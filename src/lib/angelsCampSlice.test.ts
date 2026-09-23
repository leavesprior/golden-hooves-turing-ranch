/**
 * Angels Camp vertical slice (2026-09-23): deterministic clue, honest badges,
 * deduction-gated stamp, one-button frog jump, 1849 era discipline.
 *   node_modules/.bin/tsx src/lib/angelsCampSlice.test.ts
 */
import { readFileSync } from 'node:fs'
import {
  LEVEL2_CASES,
  caseAwaitsDeduction,
  casePinsDone,
  caseForLocation,
  deductionCtaVisible,
  frontClueState,
  guaranteeCaseClue,
  level2Progress,
  maybeStampCase,
  pinsCompleteLine,
  readFoundClues,
  writeDeducedCase,
  writeFoundClue,
} from './goldCountryLevel2'
import { LOCATION_SEARCH_AREAS as SEARCH_AREAS, resolveCaseSearch, resolveSearch } from '../app/oregon-trail/data/goldCountryEncounters'
import { applyLevel2Persist, frontsForLocation, snapshotLevel2Persist } from './goldCountryStreet'
import { GOLD_COUNTRY_NPCS as goldCountryNPCs, type GoldCountryQuest } from '../app/oregon-trail/data/goldCountryNPCs'
import { getGoldCountryLocation } from '../app/oregon-trail/data/goldCountryLocations'
import { EDITORIAL_ERA_CAPTION, editorialForExplorePlace } from './goldCountryEditorial'
import {
  FROG_CYCLE_MS, FROG_SWEET_MAX, FROG_SWEET_MIN, FROG_WIN_FEET, frogFeetFor, frogJumpOutcome, frogOutcomeConsequence, frogPowerAt,
} from './frogJump'

class MockStorage {
  private m = new Map<string, string>()
  getItem(k: string): string | null { return this.m.has(k) ? this.m.get(k)! : null }
  setItem(k: string, v: string): void { this.m.set(k, v) }
}
// Every clue area FOUND — what a real search that turns up the clue records.
const FOUND = SEARCH_AREAS.map((a) => a.id)
function foundStorage(): MockStorage {
  const m = new MockStorage()
  m.setItem('bobr_l2_found_clues', JSON.stringify(FOUND))
  return m
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
ok(frontClueState(held, angels, ['angels_saloon', 'angels_hotel_register'], ['bartender_ben'], FOUND) === 'done', 'all three worked: done')
ok(frontClueState(['some_shop'], angels, [], []) === 'none', 'a front with no clues is plain')

// ---- 3. deduction gates the stamp ----
const store = foundStorage()
const all = { s: ['angels_hotel_register', 'angels_saloon'], t: ['bartender_ben'] }
ok(caseAwaitsDeduction(angels, all.s, all.t, store), 'three pins worked => awaits the call')
ok(!caseAwaitsDeduction(angels, ['angels_saloon'], [], store), 'not all pins => no call offered yet')
ok(!maybeStampCase('angels_camp', all.s, all.t, store).includes('angels_camp'), 'three pins alone do NOT stamp Angels')
writeDeducedCase('angels_camp', store)
ok(maybeStampCase('angels_camp', all.s, all.t, store).includes('angels_camp'), 'right call + pins => stamped')
ok(!caseAwaitsDeduction(angels, all.s, all.t, store), 'after the call, nothing left to decide')
const store2 = foundStorage()
writeDeducedCase('angels_camp', store2)
ok(!maybeStampCase('angels_camp', ['angels_saloon'], [], store2).includes('angels_camp'), 'a call without the evidence does not stamp')
const other = LEVEL2_CASES.find((c) => !c.deduction)!
const s3 = foundStorage()
const otherSearched = other.clues.filter((c) => c.kind === 'search').map((c) => c.id)
const otherTalked = other.clues.filter((c) => c.kind === 'talk').map((c) => c.id)
ok(maybeStampCase(other.id, otherSearched, otherTalked, s3).includes(other.id), `cases without a deduction stamp as before (${other.id})`)
ok(angels.deduction!.choices.filter((c) => c.correct).length === 1, 'exactly one right call')
ok(angels.deduction!.choices.find((c) => c.correct)!.id === 'follow_moaning_hole', 'the right call follows the note')

// ---- 3b. Level-2 progress: a deduction case is not visited on pins alone ----
const pinsOnly = level2Progress({ searchedAreaIds: all.s, talkedNpcIds: all.t, foundClueAreaIds: FOUND })
ok(!pinsOnly.visited.includes('angels_camp'), 'level2Progress does NOT count Angels on three pins alone (voucher cannot jump the call)')
ok(level2Progress({ searchedAreaIds: all.s, talkedNpcIds: all.t, deducedCaseIds: ['angels_camp'], foundClueAreaIds: FOUND }).visited.includes('angels_camp'), 'pins + the right call counts Angels')
ok(!level2Progress({ searchedAreaIds: ['angels_saloon'], deducedCaseIds: ['angels_camp'] }).visited.includes('angels_camp'), 'the call without the pins does not count')
ok(level2Progress({ stamps: ['angels_camp'] }).visited.includes('angels_camp'), 'a stamp still counts')
const exploreSrc = readFileSync(new URL('../app/oregon-trail/components/GoldCountryExplore.tsx', import.meta.url), 'utf8')
ok(/deducedCaseIds: typeof window !== 'undefined' \? readDeducedCases\(\) : \[\]/.test(exploreSrc), 'the map/voucher reader passes the deduced-cases key (wiring presence)')
ok(level2Progress({ searchedAreaIds: otherSearched, talkedNpcIds: otherTalked, foundClueAreaIds: FOUND }).visited.includes(other.id), `cases without a deduction still count on pins (${other.id})`)

// ---- 3c. the guarantee keys off the FOUND clue, not "searched" (legacy saves) ----
ok(guaranteeCaseClue(angels, register, []), 'register owes its clue until found — even if a legacy save marked it searched')
ok(!guaranteeCaseClue(angels, register, ['angels_hotel_register']), 'guarantee is false once the clue id is in found-clues')
const nonCaseArea = SEARCH_AREAS.find((a) => a.location === 'angels_camp' && !angels.clues.some((c) => c.id === a.id))
  ?? SEARCH_AREAS.find((a) => !LEVEL2_CASES.some((c) => c.clues.some((cl) => cl.id === a.id)))!
ok(!guaranteeCaseClue(angels, nonCaseArea, []), `non-case areas keep the old odds (${nonCaseArea.id})`)
ok(!guaranteeCaseClue(angels, { id: 'angels_saloon', findings: [{ isClue: false }] }, []), 'no clue finding => nothing to guarantee (never locks an area open)')
ok(!guaranteeCaseClue(null, register, []), 'no case => no guarantee')
const foundStore = new MockStorage()
writeFoundClue('angels_hotel_register', foundStore)
ok(!guaranteeCaseClue(angels, register, readFoundClues(foundStore)), 'found-clues write/read round-trips into the guarantee')

// ---- 3d. badge honesty holds on Murphys (same shape: one front holds all three) ----
const murphys = caseForLocation('murphys')!
const barrels = frontsForLocation('murphys').find((f) => f.id === 'murphys_barrels')!
const mHeld = [barrels.keeperNpcId!, ...barrels.patronNpcIds, ...barrels.searchAreaIds]
ok(murphys.clues.every((c) => mHeld.includes(c.id)), 'murphys_barrels holds all three Murphys clues (the shape under test)')
ok(frontClueState(mHeld, murphys, ['murphys_hotel_register'], []) === 'waiting', 'Murphys: one of three is still waiting')
ok(frontClueState(mHeld, murphys, ['murphys_hotel_register', 'murphys_wine_cellar'], []) === 'waiting', 'Murphys: Pierre untalked is still waiting')
ok(frontClueState(mHeld, murphys, ['murphys_hotel_register', 'murphys_wine_cellar'], ['vintner_pierre'], FOUND) === 'done', 'Murphys: all three worked is done')

// ---- 3f. legacy save: areas SEARCHED before the guarantee, clue never FOUND (Codex round-3) ----
{
  const legacy = new MockStorage() // bobr_l2_found_clues absent
  ok(!deductionCtaVisible(angels, all.s, all.t, { storage: legacy }), 'legacy save: searched-not-found hides the call')
  ok(frontClueState(held, angels, all.s, all.t, []) === 'waiting', 'legacy save: saloon badge stays amber')
  ok(casePinsDone(angels, all.s, all.t, []).done === 1, 'legacy save: only Ben counts as a pin')
  writeDeducedCase('angels_camp', legacy)
  ok(!maybeStampCase('angels_camp', all.s, all.t, legacy).includes('angels_camp'), 'legacy save: a call does not stamp without the found clues')
  ok(!level2Progress({ searchedAreaIds: all.s, talkedNpcIds: all.t, deducedCaseIds: ['angels_camp'], foundClueAreaIds: [] }).visited.includes('angels_camp'), 'legacy save: voucher progress does not count Angels')
  writeFoundClue('angels_hotel_register', legacy)
  writeFoundClue('angels_saloon', legacy)
  ok(maybeStampCase('angels_camp', all.s, all.t, legacy).includes('angels_camp'), 'legacy save: after re-finding both clues the call stamps')
}

// ---- 3e. the call is not hidden by a Level-3 hunt; copy says make the call ----
const ctaStore = foundStorage()
ok(deductionCtaVisible(angels, all.s, all.t, { hunting: true, storage: ctaStore }), 'make-the-call shows even while a Level-3 hunt is active')
ok(deductionCtaVisible(angels, all.s, all.t, { hunting: false, storage: ctaStore }), 'make-the-call shows with no hunt')
ok(!deductionCtaVisible(angels, ['angels_saloon'], [], { hunting: false, storage: ctaStore }), 'no call before the pins')
const locSrc = readFileSync(new URL('../app/oregon-trail/components/GoldCountryLocation.tsx', import.meta.url), 'utf8')
const ctaAt = locSrc.indexOf('data-testid="case-deduce-open"')
const ctaCond = locSrc.slice(locSrc.lastIndexOf('\n        {', ctaAt), ctaAt).split('\n')[1] ?? ''
ok(ctaAt > 0 && ctaCond.includes('deductionCtaVisible(') && !/!hunting/.test(ctaCond), `the CTA condition is the ungated helper (${ctaCond.trim()})`)
// Wiring presence (not behaviour): the component calls the tested helpers, so reverting the wiring fails here.
ok(locSrc.includes('pinsCompleteLine(level2Case, readDeducedCases())'), 'search-result copy is wired to pinsCompleteLine')
ok(locSrc.includes('guaranteeCaseClue(caseForLocation(locationId), area, readFoundClues())'), 'handleSearch guarantee keys off found clues')
ok(locSrc.includes('if (finding.isClue) setFoundClues(writeFoundClue(area.id))'), 'a shown clue finding is recorded as found')
ok((locSrc.match(/searchedAreaIds=\{closedAreaIds\}/g) ?? []).length === 1 && locSrc.includes('const searched = closedAreaIds.includes(area.id)'), 'indoor + outdoor searches stay open until the clue is found')
ok(pinsCompleteLine(angels, []) === 'All three clues are in — make the call.', 'third pin on a deduction case says make the call, not "stamps"')
ok(pinsCompleteLine(angels, ['angels_camp']) === 'The three pins close. The case stamps.', 'after the call, the stamp line is true')
ok(pinsCompleteLine(other, []) === 'The three pins close. The case stamps.', 'cases without a deduction keep the stamp line')

// ---- 3f. save/load carries the call and the found clues ----
const persistFrom = new MockStorage()
writeDeducedCase('angels_camp', persistFrom)
writeFoundClue('angels_saloon', persistFrom)
const snap = snapshotLevel2Persist(persistFrom)
const persistTo = new MockStorage()
applyLevel2Persist(snap, persistTo)
ok(snap.deducedCases?.includes('angels_camp') === true && snap.foundClues?.includes('angels_saloon') === true, 'export carries deduced cases + found clues')
ok(caseAwaitsDeduction(angels, all.s, all.t, persistTo) === false && readFoundClues(persistTo).includes('angels_saloon'), 'import restores them')

// ---- 4. 1849 era discipline on ALL rendered Angels Camp 1849 text ----
const LATER = /\b(Twain|Clemens|Jubilee|1855|1865|1928|stone hotel|Moaning Cavern|Jim Smiley|Pinkerton)\b/i
const stripLater = (t: string) => t.replace(/\(Later:[^)]*\)/g, '')
const ben = goldCountryNPCs.find((n) => n.id === 'bartender_ben')!
const questText = (q: GoldCountryQuest | undefined): string[] => q
  ? [q.title, q.description, q.objective, ...(q.moralChoices ?? []).flatMap((c) => [c.text, c.consequence ?? ''])]
  : []
const angelsNpcs = goldCountryNPCs.filter((n) => n.location === 'angels_camp')
ok(angelsNpcs.length >= 4, `scanning every Angels NPC (${angelsNpcs.length})`)
// Owner ruling: Ben Coon stays in 1849 and tells his Jim Smiley yarn — the ONLY whitelist.
const isBenYarn = (npcId: string, t: string) => npcId === 'bartender_ben' && /Jim Smiley/.test(t)
const npcText = angelsNpcs.flatMap((n) =>
  [n.greeting, ...n.dialogueLines, n.clueHint ?? '', ...questText(n.quest), ...(n.additionalQuests ?? []).flatMap(questText)]
    .filter((t) => !isBenYarn(n.id, t)),
)
ok(ben.dialogueLines.some((t) => /Jim Smiley/.test(t)), 'Ben still tells the Jim Smiley yarn (owner ruling)')
const angelsAreas = SEARCH_AREAS.filter((a) => a.location === 'angels_camp')
const travelLabels = getGoldCountryLocation('angels_camp')!.adjacentTo.map((id) => getGoldCountryLocation(id)!.shortName)
const mouth1849 = [
  ...npcText,
  ...angelsAreas.flatMap((a) => [a.name, a.description, ...a.findings.map((f) => f.description)]),
  angels.warrant, angels.then, angels.verb,
  angels.deduction!.question, ...angels.deduction!.choices.map((c) => c.label), ...angels.deduction!.choices.map((c) => stripLater(c.response)),
  ...travelLabels,
].map(stripLater)
const leaks = mouth1849.filter((t) => LATER.test(t))
ok(leaks.length === 0, `no later-era names in the 1849 mouth (${leaks.join(' | ')})`)
ok(travelLabels.includes('The moaning hole'), `Angels travel list says "The moaning hole" (${travelLabels.join(', ')})`)
ok(getGoldCountryLocation('moaning_cavern')!.id === 'moaning_cavern', 'moaning_cavern id/route unchanged')

// ---- 4b. street art: the later-town painting carries an honest era caption ----
ok(editorialForExplorePlace('angels_camp')!.includes('angels_camp.jpg'), 'Angels street still uses angels_camp.jpg (no era-true still exists)')
ok(/later town/.test(EDITORIAL_ERA_CAPTION.angels_camp ?? '') && /1849/.test(EDITORIAL_ERA_CAPTION.angels_camp ?? '') && /tents/.test(EDITORIAL_ERA_CAPTION.angels_camp ?? ''), 'Angels art is captioned as the later town')
ok(locSrc.includes('EDITORIAL_ERA_CAPTION[locationId]'), 'the street view renders the era caption')
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
const consolation = 'Your frog puts up a respectable fight. Win or lose, you earned every inch honestly.'
const winText = frogOutcomeConsequence(frogJumpOutcome(FROG_SWEET_MIN), consolation)
ok(!winText.includes('Win or lose') && winText === frogJumpOutcome(FROG_SWEET_MIN).line, 'a WIN does not append the win-or-lose line')
ok(frogOutcomeConsequence(frogJumpOutcome(0), consolation).endsWith(consolation), 'a short jump gets the consolation line')
ok(frogOutcomeConsequence(frogJumpOutcome(100), consolation).endsWith(consolation), 'a belly-flop gets the consolation line')

// An authored probability of 1.0 is a certainty; the 0.95 ceiling only bounds a stat BONUS.
{
  const realRandom = Math.random
  Math.random = () => 0.97
  try {
    const sure = { findings: [{ id: 'sure', description: 'always there', probability: 1.0, isClue: false }] } as unknown as Parameters<typeof resolveSearch>[0]
    ok(resolveSearch(sure)?.id === 'sure', 'a probability-1.0 find is never missed (roll 0.97)')
    const boosted = { statBonus: 'wits', findings: [{ id: 'maybe', description: 'x', probability: 0.9, isClue: false }] } as unknown as Parameters<typeof resolveSearch>[0]
    ok(resolveSearch(boosted, 10) === null, 'a stat bonus still cannot lift a find past 0.95 (roll 0.97)')
  } finally {
    Math.random = realRandom
  }
}

console.log(JSON.stringify({ test: 'angelsCampSlice', passed, total: passed + failures.length, failed: failures }, null, 2))
process.exit(failures.length ? 1 : 0)
