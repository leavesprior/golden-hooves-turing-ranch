#!/usr/bin/env node
/**
 * canon-lint.mjs — DRAFT accuracy gate. NOT wired into package.json or CI.
 *
 * Grep narrative content for place-like proper-noun tokens that are NOT registered
 * in src/data/goldCountryCanon.ts. The intent: once all content references canon ids,
 * an unknown proper place-noun means either a typo/alias drift or unvetted new content —
 * and the build should refuse it until the name is added to the registry (with a source).
 *
 * ⚠️ This is a DRAFT. It is deliberately left un-wired. The hub will run it past Grok +
 * Leif before it is allowed to gate a build (a heuristic that fails builds on proper nouns
 * needs a curated stoplist + a review of false positives first). Run manually:
 *
 *     node scripts/canon-lint.mjs            # report only
 *     node scripts/canon-lint.mjs --strict   # exit 1 if any unknown place token found
 *
 * Heuristic scope (kept narrow on purpose to limit noise): tokens whose head or tail word
 * is a Gold-Country place suffix (Camp, Hill, Mine, Creek, Caverns, Hotel, County, Gulch,
 * Point, Valley, Springs, Diggings, Bar, Flat). Person-name linting is intentionally out of
 * scope for this draft — names collide with ordinary Title-Case prose far too often.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CANON = join(ROOT, 'src/data/goldCountryCanon.ts')

const CONTENT_DIRS = [
  'src/app/explore/data',
  'src/app/explore',
  'src/app/adventure/data',
  'src/app/oregon-trail/data',
]

const PLACE_SUFFIXES = [
  'Camp', 'Hill', 'Mine', 'Creek', 'Caverns', 'Cavern', 'Hotel', 'County',
  'Gulch', 'Point', 'Valley', 'Springs', 'Diggings', 'Bar', 'Flat', 'Fairgrounds',
]

// ---- build the known-name set from the registry (textual parse, no TS runtime) ----
function loadKnownNames() {
  const src = readFileSync(CANON, 'utf8')
  const known = new Set()
  // pull every quoted string inside a `names: [ ... ]` array
  const nameArrays = src.match(/names:\s*\[([^\]]*)\]/gs) || []
  for (const block of nameArrays) {
    for (const m of block.matchAll(/['"`]([^'"`]+)['"`]/g)) {
      known.add(norm(m[1]))
    }
  }
  return known
}

const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim()

// ---- candidate place tokens: Title-Case runs ending (or starting) with a place suffix ----
function findPlaceTokens(text) {
  const found = new Map() // token -> count
  const re = /\b([A-Z][A-Za-z']+(?:\s+(?:[A-Z][A-Za-z']+|of|the|and|de))*)\b/g
  for (const m of text.matchAll(re)) {
    const token = m[1].replace(/\s+/g, ' ').trim()
    const words = token.split(' ')
    const head = words[0]
    const tail = words[words.length - 1]
    if (PLACE_SUFFIXES.includes(tail) || PLACE_SUFFIXES.includes(head)) {
      // require at least two words OR a standalone suffix like "Caverns" — skip bare suffix
      if (words.length < 2) continue
      found.set(token, (found.get(token) || 0) + 1)
    }
  }
  return found
}

function walk(dir, acc) {
  const abs = join(ROOT, dir)
  let entries
  try { entries = readdirSync(abs) } catch { return acc }
  for (const e of entries) {
    const p = join(abs, e)
    const st = statSync(p)
    if (st.isDirectory()) walk(join(dir, e), acc)
    else if (/\.(ts|tsx)$/.test(e) && !/\.test\.(ts|tsx)$/.test(e)) acc.push(p)
  }
  return acc
}

function main() {
  const strict = process.argv.includes('--strict')
  const known = loadKnownNames()
  const files = []
  for (const d of CONTENT_DIRS) walk(d, files)

  const unknown = new Map() // token -> { count, files:Set }
  for (const file of files) {
    if (file === CANON) continue
    const text = readFileSync(file, 'utf8')
    for (const [token, count] of findPlaceTokens(text)) {
      if (known.has(norm(token))) continue
      const rec = unknown.get(token) || { count: 0, files: new Set() }
      rec.count += count
      rec.files.add(file.replace(ROOT + '/', ''))
      unknown.set(token, rec)
    }
  }

  const sorted = [...unknown.entries()].sort((a, b) => b[1].count - a[1].count)
  console.log(`canon-lint (DRAFT): scanned ${files.length} content files; registry knows ${known.size} names.`)
  if (sorted.length === 0) {
    console.log('No unknown place-like tokens found.')
    process.exit(0)
  }
  console.log(`\nUnknown place-like tokens (not in goldCountryCanon.ts) — ${sorted.length} distinct:\n`)
  for (const [token, rec] of sorted) {
    console.log(`  ${String(rec.count).padStart(4)}×  ${token}   (${[...rec.files].slice(0, 3).join(', ')}${rec.files.size > 3 ? ', …' : ''})`)
  }
  console.log(
    '\nNOTE: this is a heuristic DRAFT — many of these are legitimate wider-radius places or ' +
    'false positives. Curate a stoplist and register real places (with sources) before wiring ' +
    'this to gate a build. Grok-before + Leif approval required.'
  )
  process.exit(strict ? 1 : 0)
}

main()
