/**
 * Angels Camp vertical slice (2026-09-23): deterministic clue, honest badges,
 * deduction-gated stamp, one-button frog jump, 1849 era discipline.
 *   node_modules/.bin/tsx src/lib/angelsCampSlice.test.ts
 */
import {
  LEVEL2_CASES,
  caseAwaitsDeduction,
  caseForLocation,
  frontClueState,
  maybeStampCase,
  readLevel2Stamps,
  writeDeducedCase,
} from './goldCountryLevel2'
import { LOCATION_SEARCH_AREAS as SEARCH_AREAS, resolveCaseSearch } from '../app/oregon-trail/data/goldCountryEncounters'
import { frontsForLocation } from './goldCountryStreet'
import { GOLD_COUNTRY_NPCS as goldCountryNPCs } from '../app/oregon-trail/data/goldCountryNPCs'
import {
  FROG_CYCLE_MS, FROG_SWEET_MAX, FROG_SWEET_MIN, FROG_WIN_FEET, frogFeetFor, frogJumpOutcome, frogPowerAt,
} from './frogJump'

class MockStorage {
  private m = new Map<string, string>()
  getItem(k: string): string | null { return this.m.has(k) ? this.m.get(k)! : null }
  setItem(k: string, v: string): void { this.m.set(k, v) }
}

let passed = 0
const failures: string[] = []
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else failures.push(name)
}

const angels = caseForLocation('angels_camp')!
ok(!!angels && !!angels.deduction, 'angels case has a deduction')

// ---- 1. deterministic required clue, every case, every search clue ----
const realRandom = Math.random
Math.random = () => 0.999 // worst luck: every probabilistic roll fails
let clueAreasChecked = 0
const clueAreasWithoutAClue: string[] = []
for (const caze of LEVEL2_CASES) {
  for (const clue of caze.clues.filter((c) => c.kind === 'search')) {
    const area = SEARCH_AREAS.find((a) => a.id === clue.id)
    if (!area) continue // guest book etc. are not dice searches
    clueAreasChecked++
    if (!area.findings.some((f) => f.isClue)) { clueAreasWithoutAClue.push(area.id); continue }
    const f = resolveCaseSearch(area, { guaranteeClue: true })
    ok(!!f && !!f.isClue, `first search of ${caze.id}/${clue.id} yields its clue even on worst luck`)
  }
}
ok(clueAreasChecked >= 8, `the guarantee loop actually checked areas (${clueAreasChecked})`)
ok(clueAreasWithoutAClue.length === 0, `every case search area holds a clue to guarantee (missing: ${clueAreasWithoutAClue.join(', ')})`)
Math.random = realRandom
const register = SEARCH_AREAS.find((a) => a.id === 'angels_hotel_register')!
// Old odds are untouched on later searches: a roll of 0.8 misses the 0.7 clue and hits the (0.95-capped) history.
Math.random = () => 0.8
ok(resolveCaseSearch(register, { guaranteeClue: false })?.id === 'hotel_history', 'later searches keep the old odds')
Math.random = realRandom

// ---- 2. badge: the saloon holds register + barroom + Ben; green only when ALL are worked ----
const saloon = frontsForLocation('angels_camp').find((f) => f.id === 'angels_saloon')!
const held = [saloon.keeperNpcId!, ...saloon.patronNpcIds, ...saloon.searchAreaIds]
ok(frontClueState(held, angels, [], []) === 'waiting', 'saloon waits before anything is worked')
ok(frontClueState(held, angels, ['angels_saloon'], []) === 'waiting', 'ONE of three worked is still waiting (was green before)')
ok(frontClueState(held, angels, ['angels_saloon', 'angels_hotel_register'], []) === 'waiting', 'searches done, Ben untalked: still waiting')
ok(frontClueState(held, angels, ['angels_saloon', 'angels_hotel_register'], ['bartender_ben']) === 'done', 'all three worked: done')
ok(frontClueState(['some_shop'], angels, [], []) === 'none', 'a front with no clues is plain')

// ---- 3. deduction gates the stamp ----
const store = new MockStorage()
const all = { s: ['angels_hotel_register', 'angels_saloon'], t: ['bartender_ben'] }
ok(caseAwaitsDeduction(angels, all.s, all.t, store), 'three pins worked => awaits the call')
ok(!caseAwaitsDeduction(angels, ['angels_saloon'], [], store), 'not all pins => no call offered yet')
ok(!maybeStampCase('angels_camp', all.s, all.t, store).includes('angels_camp'), 'three pins alone do NOT stamp Angels')
writeDeducedCase('angels_camp', store)
ok(maybeStampCase('angels_camp', all.s, all.t, store).includes('angels_camp'), 'right call + pins => stamped')
ok(!caseAwaitsDeduction(angels, all.s, all.t, store), 'after the call, nothing left to decide')
const store2 = new MockStorage()
writeDeducedCase('angels_camp', store2)
ok(!maybeStampCase('angels_camp', ['angels_saloon'], [], store2).includes('angels_camp'), 'a call without the evidence does not stamp')
const other = LEVEL2_CASES.find((c) => !c.deduction && c.clues.every((c) => c.kind !== 'talk' || true))!
const s3 = new MockStorage()
const otherSearched = other.clues.filter((c) => c.kind === 'search').map((c) => c.id)
const otherTalked = other.clues.filter((c) => c.kind === 'talk').map((c) => c.id)
ok(maybeStampCase(other.id, otherSearched, otherTalked, s3).includes(other.id), `cases without a deduction stamp as before (${other.id})`)
ok(readLevel2Stamps(new MockStorage()).length === 0, 'fresh storage has no stamps')
ok(angels.deduction!.choices.filter((c) => c.correct).length === 1, 'exactly one right call')
ok(angels.deduction!.choices.find((c) => c.correct)!.id === 'follow_moaning_hole', 'the right call follows the note')

// ---- 4. 1849 era discipline on everything the slice puts in the 1849 mouth ----
const LATER = /\b(Twain|Clemens|Jubilee|1855|1865|1928|stone hotel|Moaning Cavern)\b/i
const stripLater = (t: string) => t.replace(/\(Later:[^)]*\)/g, '')
const ben = goldCountryNPCs.find((n) => n.id === 'bartender_ben')!
const saloonArea = SEARCH_AREAS.find((a) => a.id === 'angels_saloon')!
const mouth1849 = [
  ...ben.dialogueLines, ben.greeting,
  ...register.findings.map((f) => f.description), ...saloonArea.findings.map((f) => f.description),
  angels.deduction!.question, ...angels.deduction!.choices.map((c) => c.label), ...angels.deduction!.choices.map((c) => stripLater(c.response)),
]
const leaks = mouth1849.filter((t) => LATER.test(t))
ok(leaks.length === 0, `no later-era names in the 1849 mouth (${leaks.join(' | ')})`)
ok(/\(Later:/.test(angels.deduction!.choices.find((c) => c.correct)!.response), 'later history is dated and labelled, not claimed as 1849')

// ---- 5. frog jump ----
ok(frogPowerAt(0) === 0 && frogPowerAt(FROG_CYCLE_MS / 2) === 100 && frogPowerAt(FROG_CYCLE_MS) === 0, 'needle is a 0-100-0 triangle')
ok(frogPowerAt(FROG_CYCLE_MS / 4) === 50, 'quarter cycle = 50')
ok(frogPowerAt(-5) === 0 && frogPowerAt(Number.NaN) === 0, 'bad time is zero power')
ok(frogJumpOutcome(FROG_SWEET_MIN).won && frogJumpOutcome(FROG_SWEET_MAX).won, 'sweet band edges win')
ok(!frogJumpOutcome(FROG_SWEET_MIN - 1).won, 'just short loses')
ok(!frogJumpOutcome(FROG_SWEET_MAX + 1).won && frogJumpOutcome(100).kind === 'belly_flop', 'over-cranked flops')
let mono = true
for (let p = 1; p <= FROG_SWEET_MAX; p++) if (frogFeetFor(p) < frogFeetFor(p - 1)) mono = false
ok(mono, 'feet never drop as power rises up to the sweet band')
let wins = 0
for (let p = 0; p <= 100; p++) if (frogJumpOutcome(p).won) wins++
ok(wins === FROG_SWEET_MAX - FROG_SWEET_MIN + 1, `only the sweet band wins (${wins} winning powers)`)
ok(frogFeetFor(FROG_SWEET_MIN - 1) < FROG_WIN_FEET, 'best short jump stays under the chalk')
let consistent = true
for (let p = 0; p <= 100; p++) {
  const o = frogJumpOutcome(p)
  if ((o.kind === 'sweet') !== o.won || !o.line.includes(`${o.feet} feet`)) consistent = false
}
ok(consistent, 'the story told matches the score: sweet <=> won, and the line quotes the real feet')

console.log(JSON.stringify({ test: 'angelsCampSlice', passed, total: passed + failures.length, failed: failures }, null, 2))
process.exit(failures.length ? 1 : 0)
