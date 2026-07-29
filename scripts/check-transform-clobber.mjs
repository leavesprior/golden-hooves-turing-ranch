#!/usr/bin/env node
/**
 * check-transform-clobber — a simple machine for one exact defect class.
 *
 * THE DEFECT
 * In SVG2 a CSS `transform` (including one set by an @keyframes stop) REPLACES
 * the `transform` presentation attribute rather than composing with it. So:
 *
 *     .map-compass { animation: compass-bob 6s infinite; }
 *     @keyframes compass-bob { 0%,100% { transform: translateY(0); } }
 *
 *     <g className="map-compass" transform="translate(92, 5)">   <-- translate DIES
 *
 * The element renders at the origin instead of where the attribute says. Nothing
 * catches this: tsc passes, lint passes, the build passes, every unit test
 * passes, and the DOM still *shows* the attribute. Only geometry reveals it.
 * This shipped in MapCompass and put the compass in the wrong corner of the map.
 *
 * THE CHECK
 * 1. Read the stylesheets. Find every class whose own rule sets `transform`, or
 *    whose `animation` names a @keyframes that sets `transform` in any stop.
 * 2. Read the components. Flag any element carrying BOTH such a class AND a
 *    `transform=` attribute.
 *
 * Deterministic, no network, no deps. Exit 1 on any finding.
 *
 * Usage:  node scripts/check-transform-clobber.mjs [--json]
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const JSON_OUT = process.argv.includes('--json')

// ---------------------------------------------------------------------------
// walk
// ---------------------------------------------------------------------------
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'coverage', '.serena', '.tldr'])

function walk(dir, exts, out = []) {
  let entries
  try { entries = readdirSync(dir) } catch { return out }
  for (const name of entries) {
    if (SKIP.has(name)) continue
    const p = join(dir, name)
    let st
    try { st = statSync(p) } catch { continue }
    if (st.isDirectory()) walk(p, exts, out)
    else if (exts.some(e => name.endsWith(e))) out.push(p)
  }
  return out
}

// ---------------------------------------------------------------------------
// 1. which classes end up setting `transform`?
// ---------------------------------------------------------------------------
function transformBearingClasses(cssFiles) {
  // keyframe name -> true when any stop sets transform
  const keyframesWithTransform = new Set()
  // class -> reason
  const classes = new Map()

  for (const file of cssFiles) {
    const css = readFileSync(file, 'utf8')

    // @keyframes NAME { ... transform: ... }
    const kfRe = /@keyframes\s+([A-Za-z0-9_-]+)\s*\{/g
    let m
    while ((m = kfRe.exec(css))) {
      const name = m[1]
      // brace-match the keyframes body
      let depth = 1, i = kfRe.lastIndex
      while (i < css.length && depth > 0) {
        if (css[i] === '{') depth++
        else if (css[i] === '}') depth--
        i++
      }
      const body = css.slice(kfRe.lastIndex, i)
      if (/(^|[;{\s])transform\s*:/.test(body)) keyframesWithTransform.add(name)
    }

    // .class { ... }  — direct transform, or animation naming a transform keyframe
    const ruleRe = /(^|\})\s*([^{}@]+)\{([^{}]*)\}/g
    while ((m = ruleRe.exec(css))) {
      const selector = m[2].trim()
      const body = m[3]
      const classNames = [...selector.matchAll(/\.([A-Za-z0-9_-]+)/g)].map(x => x[1])
      if (!classNames.length) continue

      const direct = /(^|[;{\s])transform\s*:/.test(body)
      const animMatch = body.match(/(?:^|[;{\s])animation(?:-name)?\s*:\s*([^;]+)/)
      let viaKeyframes = null
      if (animMatch) {
        for (const token of animMatch[1].split(/[\s,]+/)) {
          if (keyframesWithTransform.has(token)) { viaKeyframes = token; break }
        }
      }
      if (!direct && !viaKeyframes) continue

      for (const c of classNames) {
        classes.set(c, {
          css: relative(ROOT, file),
          reason: direct ? 'rule sets transform directly' : `animation "${viaKeyframes}" sets transform`,
        })
      }
    }
  }
  return classes
}

// ---------------------------------------------------------------------------
// 2. elements carrying both a flagged class and a transform attribute
// ---------------------------------------------------------------------------
/**
 * Scan an opening JSX tag properly instead of regex-matching it.
 *
 * A regex cannot do this: attribute values nest arbitrarily
 * (`transform={`translate(${x}, ${y})`}` is braces inside a template literal
 * inside braces), and the first version of this check silently MISSED the
 * wagon marker because of exactly that. Walk the characters, track quote and
 * brace depth, stop at the `>` that closes the tag.
 */
function readOpeningTag(src, start) {
  let i = start
  let quote = null
  // Explicit mode stack. A flat depth counter plus a boolean is NOT enough:
  // `transform={`translate(${x}, ${y})`}` interleaves braces and a template
  // literal, and the first version of this parser incremented depth on `${`
  // while staying in template mode, so the closing `}` was never counted.
  // Depth never returned to zero, the tag was skipped, and the wagon marker
  // went unreported. The stack makes the nesting explicit.
  const stack = [] // 'brace' | 'tick'
  while (i < src.length) {
    const ch = src[i]
    const top = stack[stack.length - 1]
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = null
    } else if (top === 'tick') {
      if (ch === '\\') i++
      else if (ch === '`') stack.pop()
      else if (ch === '$' && src[i + 1] === '{') { stack.push('brace'); i++ }
    } else {
      // Comments first: an apostrophe in `// Don't mark ...` inside an onClick
      // handler otherwise opens a phantom string and swallows the rest of the
      // tag. That is how InvestigationScreen went unparseable.
      if (ch === '/' && src[i + 1] === '/') {
        const nl = src.indexOf('\n', i)
        if (nl === -1) return null
        i = nl
      } else if (ch === '/' && src[i + 1] === '*') {
        const end = src.indexOf('*/', i + 2)
        if (end === -1) return null
        i = end + 1
      }
      else if (ch === '"' || ch === "'") quote = ch
      else if (ch === '`') stack.push('tick')
      else if (ch === '{') stack.push('brace')
      else if (ch === '}') stack.pop()
      else if (ch === '>' && stack.length === 0) return src.slice(start, i + 1)
    }
    i++
  }
  return null
}

/** Every class name mentioned in a className attribute, literal or dynamic. */
function classNamesIn(attrs) {
  const out = []
  const m = attrs.match(/(?:className|class)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{)/)
  if (!m) return out
  if (m[1] !== undefined || m[2] !== undefined) {
    return (m[1] ?? m[2]).split(/\s+/).filter(Boolean)
  }
  // Dynamic: className={...}. Pull every quoted literal out of the expression —
  // a ternary, a clsx() call and a template literal all put the real class
  // names in string literals, which is all this check needs.
  const exprStart = attrs.indexOf('{', m.index)
  let i = exprStart, depth = 0
  for (; i < attrs.length; i++) {
    if (attrs[i] === '{') depth++
    else if (attrs[i] === '}') { depth--; if (depth === 0) break }
  }
  const expr = attrs.slice(exprStart, i + 1)
  for (const lit of expr.matchAll(/['"`]([^'"`]*)['"`]/g)) {
    for (const c of lit[1].split(/\s+/)) if (c) out.push(c)
  }
  return out
}

function findClobbers(componentFiles, flagged, unparsed) {
  const findings = []
  for (const file of componentFiles) {
    const src = readFileSync(file, 'utf8')
    const openRe = /<([A-Za-z][A-Za-z0-9.]*)[\s>]/g
    let m
    while ((m = openRe.exec(src))) {
      const tag = readOpeningTag(src, m.index)
      // A tag this parser cannot read is coverage it does not have. Silent
      // skipping is how the first version reported PASS while blind.
      if (!tag) {
        unparsed.push({ file: relative(ROOT, file), line: src.slice(0, m.index).split('\n').length, element: m[1] })
        continue
      }
      const attrs = tag.slice(1 + m[1].length, -1)
      if (!/(^|\s)transform\s*=/.test(attrs)) continue

      const seen = new Set()
      for (const c of classNamesIn(attrs)) {
        if (!flagged.has(c) || seen.has(c)) continue
        seen.add(c)
        const lit = attrs.match(/(?:^|\s)transform\s*=\s*"([^"]*)"/)
        const dyn = attrs.match(/(?:^|\s)transform\s*=\s*\{/)
        findings.push({
          file: relative(ROOT, file),
          line: src.slice(0, m.index).split('\n').length,
          element: m[1],
          className: c,
          transform: lit ? lit[1] : dyn ? '{…dynamic…}' : '<unknown>',
          ...flagged.get(c),
        })
      }
    }
  }
  return findings
}

// ---------------------------------------------------------------------------
const cssFiles = walk(join(ROOT, 'src'), ['.css', '.scss'])
  .concat(walk(join(ROOT, 'app'), ['.css', '.scss']))
const componentFiles = walk(join(ROOT, 'src'), ['.tsx'])
  .concat(walk(join(ROOT, 'app'), ['.tsx']))

const flagged = transformBearingClasses(cssFiles)
const unparsed = []
const findings = findClobbers(componentFiles, flagged, unparsed)

if (JSON_OUT) {
  console.log(JSON.stringify({ flaggedClasses: [...flagged.keys()], findings, unparsed }, null, 2))
} else {
  console.log(`transform-clobber check`)
  console.log(`  stylesheets scanned : ${cssFiles.length}`)
  console.log(`  components scanned  : ${componentFiles.length}`)
  console.log(`  transform-bearing classes: ${flagged.size} ${flagged.size ? '(' + [...flagged.keys()].join(', ') + ')' : ''}`)
  console.log(`  tags this parser could not read: ${unparsed.length}${unparsed.length ? '  <-- BLIND SPOT, not coverage' : ''}`)
  for (const u of unparsed.slice(0, 10)) console.log(`      ${u.file}:${u.line} <${u.element}>`)
  console.log('')
  if (!findings.length) {
    console.log('  PASS  no element carries both a transform attribute and a transform-animating class')
  } else {
    for (const f of findings) {
      console.log(`  FAIL  ${f.file}:${f.line}`)
      console.log(`        <${f.element} className="${f.className}" transform="${f.transform}">`)
      console.log(`        "${f.className}" ${f.reason} (${f.css})`)
      console.log(`        -> the CSS transform REPLACES the attribute; move positioning to an outer element.`)
      console.log('')
    }
    console.log(`  ${findings.length} clobber(s) found`)
  }
}

process.exit(findings.length ? 1 : 0)
