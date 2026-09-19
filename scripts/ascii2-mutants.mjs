/**
 * ascii2-mutants.mjs — can the ascii2 tests be made to lie?
 *
 *   node scripts/ascii2-mutants.mjs
 *
 * Each seed breaks one claim the ladder notes make. A seed is SCORED only if:
 *   1. its `find` text occurs EXACTLY ONCE in the file (a substring that also
 *      matches a longer line would mutate the wrong code path — this happened),
 *   2. the file actually changed, and
 *   3. the behaviour fingerprint (scripts/ascii2-mutant-probe.ts) changed.
 * A seed failing 1-3 is reported as NO-OP and never counted as caught.
 * Then ascii2Walk, townGeo and townWalk tests run; a non-zero exit means CAUGHT.
 * Every file is restored in `finally`, whatever happens.
 *
 * Exit 0 = every seed scored and caught, 1 = a scored seed survived,
 * 2 = UNMEASURED (a seed was a no-op, or the baseline was not green).
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const SEEDS = [
  { id: 'absence-default-flipped', file: 'src/lib/ascii2Walk.ts',
    find: 'export const ABSENCE_BLOCKS_DEFAULT = false', replace: 'export const ABSENCE_BLOCKS_DEFAULT = true' },
  { id: 'absence-switch-ignored', file: 'src/lib/ascii2Walk.ts',
    find: 'if (scene.absenceBlocks && crossed && (next.x', replace: 'if (false && crossed && (next.x' },
  { id: 'ghost-may-hide-a-real-target', file: 'src/lib/ascii2Walk.ts',
    find: '        if (map.targets.some((t) => t.position.x === x && t.position.y === y)) continue\n', replace: '\n' },
  { id: 'fog-drawn-solid', file: 'src/lib/ascii2Walk.ts',
    find: "const FOG_GLYPHS = ['·', '˙', '˚', '·', 'ʼ', '˙']", replace: "const FOG_GLYPHS = ['▒']" },
  { id: 'name-plate-holes-in-absence', file: 'src/lib/ascii2Walk.ts',
    find: "blank ? (lr < horizon ? sky : ground) :", replace: "blank ? (face.form === 'fog' ? fog : ink) :" },
  { id: 'camera-grows-own-movement', file: 'src/lib/ascii2Walk.ts',
    find: '  const next = stepTownWalk(scene.map, position, heading)\n',
    replace: "  const d0 = DELTA[heading]\n  const next = { x: Math.max(0, Math.min(scene.map.width - 1, position.x + d0.dx)), y: Math.max(0, Math.min(scene.map.height - 1, position.y + d0.dy)) }\n" },
  { id: 'parity-walk-loses-the-fire', file: 'src/lib/townWalk.ts',
    find: "    prop('crate', 7, 5), prop('fire', 11, 5),\n", replace: "    prop('crate', 7, 5),\n" },
  { id: 'ground-evidence-ignored', file: 'src/lib/ascii2Walk.ts',
    find: '    const fromGround = geoWanted(map, site, geo)\n', replace: '    const fromGround = null as TownWalkPosition | null\n' },
  { id: 'creek-tile-dropped', file: 'src/lib/townWalk.ts',
    find: '[13, 5], [13, 6], [14, 5],', replace: '[13, 5], [14, 5],' },
  { id: 'far-site-pulled-into-camp', file: 'src/lib/ascii2Walk.ts',
    find: '    if (site.geo && geo && !fromGround) continue\n', replace: '\n' },
  { id: 'west-point-pack-road-fixture-blocked', file: 'src/lib/townWalk.ts',
    find: "    prop('rock', 6, 4), prop('rock', 14, 8),", replace: "    prop('rock', 10, 7), prop('rock', 6, 4), prop('rock', 14, 8)," },
]

const run = (cmd, args) => {
  try { return { rc: 0, out: execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 1 << 26 }) } }
  catch (e) { return { rc: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` } }
}
const probe = () => {
  const r = run('npx', ['tsx', 'scripts/ascii2-mutant-probe.ts'])
  return r.rc === 0 ? JSON.parse(r.out.trim().split('\n').pop()).fingerprint : `probe-crashed:${r.rc}`
}
const test = () => {
  const a = run('npx', ['tsx', 'src/lib/ascii2Walk.test.ts'])
  if (a.rc !== 0) return a
  const b = run('npx', ['tsx', 'src/lib/townGeo.test.ts'])
  return b.rc !== 0 ? b : run('npx', ['tsx', 'src/lib/townWalk.test.ts'])
}

const baseTest = test()
if (baseTest.rc !== 0) { console.error('UNMEASURED: baseline test is not green\n' + baseTest.out.slice(-800)); process.exit(2) }
const baseFp = probe()
console.log(`baseline green, fingerprint ${baseFp}`)

const results = []
for (const seed of SEEDS) {
  const original = readFileSync(seed.file, 'utf8')
  const hits = original.split(seed.find).length - 1
  if (hits !== 1) { results.push({ ...seed, verdict: 'NO-OP', why: `find matched ${hits}x, need exactly 1` }); continue }
  try {
    const mutated = original.replace(seed.find, seed.replace)
    if (mutated === original) { results.push({ ...seed, verdict: 'NO-OP', why: 'file unchanged' }); continue }
    writeFileSync(seed.file, mutated)
    const fp = probe()
    if (fp === baseFp) { results.push({ ...seed, verdict: 'NO-OP', why: 'behaviour fingerprint unchanged' }); continue }
    const t = test()
    const line = t.out.split('\n').find((l) => /AssertionError|assert|must|Error/.test(l)) ?? ''
    results.push({ ...seed, verdict: t.rc !== 0 ? 'CAUGHT' : 'SURVIVED', why: line.trim().slice(0, 140) })
  } finally {
    writeFileSync(seed.file, original)
  }
}
if (probe() !== baseFp) { console.error('UNMEASURED: tree not restored to baseline behaviour'); process.exit(2) }

for (const r of results) console.log(`${r.verdict.padEnd(8)} ${r.id} — ${r.why}`)
const scored = results.filter((r) => r.verdict !== 'NO-OP')
const caught = scored.filter((r) => r.verdict === 'CAUGHT').length
console.log(`\n${scored.length} scored, ${caught} caught, ${results.length - scored.length} no-op`)
process.exit(results.some((r) => r.verdict === 'NO-OP') ? 2 : caught === scored.length ? 0 : 1)
