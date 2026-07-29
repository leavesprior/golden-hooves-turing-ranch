#!/usr/bin/env node
/**
 * check-transform-clobber — one law, mechanically enforced.
 *
 * THE LAW
 *   An element MUST NOT carry both a `transform` presentation attribute and a
 *   `className`/`class`. Put position on an outer <g>; put classes on an inner one.
 *
 * WHY THIS SHAPE
 * In SVG2 a CSS `transform` — including one set by an @keyframes stop — REPLACES
 * the `transform` presentation attribute rather than composing with it. The element
 * renders at the origin while the DOM still shows the attribute. tsc, eslint,
 * `next build` and every unit test pass. Only geometry reveals it. It shipped twice:
 * the map compass (wrong corner, clipped glyph) and the player wagon (position wiped
 * precisely while travelling).
 *
 * The first version of this check tried to DETECT the condition: parse the
 * stylesheets, find every class that ends up setting `transform`, flag elements
 * carrying both. Measured against a PostCSS ground truth, that version was blind to
 * 20% of the real class set (12 of 15) on this repo's own globals.css. It also
 * passed a blatant clobber at exit 0 when no CSS file was present, and its rule
 * regex silently skipped every other rule in a flat sequence — wrong on the happy
 * path, not merely on edge cases.
 *
 * Detecting CSS transform authority is a tar pit: selectors, descendants, pseudo
 * states, @media, @layer, CSS modules, Tailwind, inline style, third-party sheets,
 * and whatever CSS gains next. SEPARATING transform authority is one sentence.
 * So this check no longer reads CSS at all. It enforces the separation instead,
 * which makes the defect unrepresentable rather than merely detectable, and cannot
 * be defeated by any styling mechanism present or future.
 *
 * Cost, measured before adopting: zero. No element in src/** carried both.
 *
 * PARSING
 * Uses the TypeScript compiler API (a direct dependency) rather than a hand-rolled
 * scanner. Every bug this checker ever had was a hand-parser bug — template-literal
 * nesting, an apostrophe inside a comment, a CSS rule delimiter. A real parser
 * removes the category rather than the instances.
 *
 * ESCAPE HATCH
 *   data-allow-transform-class="<reason>"  on the element. Default is deny.
 *
 * EXIT CODES — distinct so "incomplete" can never read as "clean"
 *   0  every file parsed, no violation
 *   1  violation found
 *   2  could not see everything asked of it (parse failure, spread attributes
 *      hiding the answer, or nothing scanned at all)
 *
 * Usage: node scripts/check-transform-clobber.mjs [--root <dir>] [--json]
 */

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import ts from 'typescript'

const argv = process.argv.slice(2)
const JSON_OUT = argv.includes('--json')
const rootArg = argv.indexOf('--root')
const ROOT = rootArg !== -1 && argv[rootArg + 1] ? resolve(argv[rootArg + 1]) : process.cwd()

// `fixtures` holds deliberately-hostile files that MUST fail. They are asserted by
// exit code in check-transform-clobber.test.mjs via an explicit --root, so a
// whole-repo scan has to skip them or the check would always fail on its own bait.
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'coverage', '.serena', '.tldr', 'fixtures'])

function walk(dir, out = []) {
  let entries
  try { entries = readdirSync(dir) } catch { return out }
  for (const name of entries) {
    if (SKIP.has(name)) continue
    const p = join(dir, name)
    let st
    try { st = statSync(p) } catch { continue }
    if (st.isDirectory()) walk(p, out)
    else if (/\.(tsx|jsx)$/.test(name)) out.push(p)
  }
  return out
}

const findings = []
const blind = []

/** Attribute name as written, or null for a spread. */
function attrName(a) {
  if (ts.isJsxSpreadAttribute(a)) return null
  return a.name && 'text' in a.name ? a.name.text : String(a.name?.escapedText ?? '')
}

function checkFile(file, src) {
  let sf
  try {
    sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, /* setParentNodes */ true, ts.ScriptKind.TSX)
  } catch (e) {
    blind.push({ file: relative(ROOT, file), line: 0, why: `could not parse: ${e.message}` })
    return
  }
  // A syntactically broken file is a blind spot, not a pass.
  const diags = sf.parseDiagnostics ?? []
  if (diags.length) {
    const d = diags[0]
    const line = sf.getLineAndCharacterOfPosition(d.start ?? 0).line + 1
    blind.push({ file: relative(ROOT, file), line, why: 'file has parse errors; attributes not reliably readable' })
    return
  }

  const visit = node => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const attrs = node.attributes.properties
      const names = attrs.map(attrName)
      const hasSpread = names.some(n => n === null)
      const has = n => names.includes(n)
      const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1
      const tag = node.tagName.getText(sf)

      if (has('transform')) {
        if (has('className') || has('class')) {
          if (!has('data-allow-transform-class')) {
            const cls = attrs.find(a => attrName(a) === 'className' || attrName(a) === 'class')
            findings.push({
              file: relative(ROOT, file), line, element: tag,
              detail: cls ? cls.getText(sf).replace(/\s+/g, ' ').slice(0, 80) : '',
            })
          }
        } else if (hasSpread) {
          // {...props} could carry className. Not knowable statically — say so.
          blind.push({
            file: relative(ROOT, file), line,
            why: `<${tag}> has a transform attribute and a {...spread}; a className may be hidden in it`,
          })
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sf)
}

// ---------------------------------------------------------------------------
if (!existsSync(ROOT)) {
  console.error(`transform-clobber: root does not exist: ${ROOT}`)
  process.exit(2)
}

const files = walk(ROOT)
for (const f of files) {
  try { checkFile(f, readFileSync(f, 'utf8')) }
  catch (e) { blind.push({ file: relative(ROOT, f), line: 0, why: `unreadable: ${e.message}` }) }
}

// Health floor. "I looked at nothing, therefore it is clean" is a rubber stamp with
// better posture — the previous version passed a blatant clobber in exactly that way.
if (files.length === 0) {
  console.log('transform-clobber: NO COMPONENT FILES SCANNED')
  console.log(`  root: ${ROOT}`)
  console.log('  This is NOT a pass. A check that saw nothing proves nothing.')
  process.exit(2)
}

const exitCode = findings.length ? 1 : blind.length ? 2 : 0

if (JSON_OUT) {
  console.log(JSON.stringify({ root: ROOT, scanned: files.length, findings, blind, exitCode }, null, 2))
} else {
  console.log('transform-clobber — law: no element carries both `transform` and a class')
  console.log(`  files scanned: ${files.length}`)
  console.log(`  unreadable   : ${blind.length}${blind.length ? '   <-- BLIND SPOT, not coverage' : ''}`)
  for (const b of blind.slice(0, 10)) console.log(`      ${b.file}:${b.line} — ${b.why}`)
  console.log('')
  for (const f of findings) {
    console.log(`  FAIL  ${f.file}:${f.line}`)
    console.log(`        <${f.element} ... transform=... ${f.detail}>`)
    console.log('        A CSS transform REPLACES the transform attribute, it does not compose.')
    console.log('        Remedy: outer <g transform="..."> for position, inner <g className="..."> for motion.')
    console.log('')
  }
  if (findings.length) console.log(`  ${findings.length} violation(s)`)
  else if (blind.length) console.log('  PARTIAL CHECK — no violation in what could be read. This is NOT a pass.')
  else console.log('  PASS  transform authority is separated everywhere')
}

process.exit(exitCode)
