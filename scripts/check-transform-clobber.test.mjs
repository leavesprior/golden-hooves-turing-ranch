#!/usr/bin/env node
/**
 * Exit-code assertions for check-transform-clobber.
 *
 * WHY THIS FILE EXISTS
 * The checker's only continuous evidence of life used to be "PASS on the tree we
 * just cleaned." Same author writes the rule and only ever runs it on healthy
 * input — homework graded by the student. A check only ever run on healthy input
 * is a rubber stamp.
 *
 * These fixtures are hostile on purpose and asserted by EXIT CODE, independent of
 * whether live src happens to be clean. If the checker ever stops detecting the
 * defect, this fails even though the repository is healthy.
 */

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const CHECK = join(here, 'check-transform-clobber.mjs')
const FIX = join(here, '..', 'fixtures', 'transform-clobber')

const cases = [
  { root: join(FIX, 'fail'), expect: 1, why: 'both authorities on one node must FAIL' },
  { root: join(FIX, 'pass'), expect: 0, why: 'split / transform-only / class-only / allowed must PASS' },
  { root: join(FIX, 'blind'), expect: 2, why: 'a spread that may hide className must report a BLIND SPOT' },
  { root: join(FIX, 'does-not-exist'), expect: 2, why: 'a missing root must not be a pass' },
  { root: join(here, 'empty-on-purpose'), expect: 2, why: 'scanning nothing must not be a pass' },
]

let failed = 0
for (const c of cases) {
  const r = spawnSync(process.execPath, [CHECK, '--root', c.root], { encoding: 'utf8' })
  const got = r.status
  const ok = got === c.expect
  if (!ok) failed++
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  exit ${got} (expected ${c.expect}) — ${c.why}`)
  if (!ok) console.log((r.stdout || r.stderr || '').split('\n').map(l => '        ' + l).join('\n'))
}

// The live tree must also be clean.
const live = spawnSync(process.execPath, [CHECK], { encoding: 'utf8', cwd: join(here, '..') })
const liveOk = live.status === 0
if (!liveOk) failed++
console.log(`  ${liveOk ? 'PASS' : 'FAIL'}  exit ${live.status} (expected 0) — the live tree obeys the law`)
if (!liveOk) console.log((live.stdout || '').split('\n').map(l => '        ' + l).join('\n'))

console.log(failed ? `\ntransform-clobber fixtures: ${failed} FAILED` : '\ntransform-clobber fixtures: ALL PASS')
process.exit(failed ? 1 : 0)
