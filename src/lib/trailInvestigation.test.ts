// Trail Investigate screen: every town its own places, leads that go somewhere
// real, harder clues in California, later eras kept inside "(Later: …)".
import { readFileSync } from 'node:fs'
import {
  TRAIL_YEAR,
  getAuthoredStops,
  getGenericPlaces,
  getSceneMeta,
  getTrailPlaces,
  isTrailWitnessId,
  resolveTrailTown,
  resolveWitnessNpc,
} from './trailInvestigation'
import { INVESTIGATIONS } from './townInvestigations'
import { getCanonicalTown } from './townRegistry'
import { getNPCsAtLocation } from '../app/oregon-trail/data/goldCountryNPCs'
import { CHAPTER_1_WAYPOINTS, GOLD_COUNTRY_LOCATIONS } from '../app/oregon-trail/data/worldMaps'
import { getPuzzlesForLandmark } from '../app/oregon-trail/data/townPuzzles'

let passed = 0
const failures: string[] = []
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else failures.push(name)
}

const WAYPOINTS = [...CHAPTER_1_WAYPOINTS, ...GOLD_COUNTRY_LOCATIONS]
const LANDMARK_NAMES = new Set(WAYPOINTS.map(w => w.name))
const TOWNS = WAYPOINTS.filter(w => w.type === 'town' || w.type === 'fort').map(w => w.name)
const STOPS = [...new Set([...TOWNS, ...getAuthoredStops()])]

// ---- 1. every town and fort has its own places, with its own icons ----
ok(TOWNS.length >= 9, `found the trail towns and forts (${TOWNS.join(', ')})`)
const signatures = new Map<string, string>()
for (const stop of STOPS) {
  const places = getTrailPlaces(stop)
  ok(places.length >= 1, `${stop}: has authored places`)
  const icons = places.map(p => p.icon)
  ok(new Set(icons).size === icons.length, `${stop}: icons differ within the town (${icons.join(' ')})`)
  ok(!icons.includes('🔎'), `${stop}: no fallback icon`)
  const sig = places.map(p => p.name).sort().join('|')
  ok(!signatures.has(sig), `${stop}: places are not a copy of ${signatures.get(sig)}`)
  signatures.set(sig, stop)
}

// ---- 2. no telegraph anywhere in 1849 (the line west came in 1861) ----
const allText = STOPS.flatMap(stop => getTrailPlaces(stop).flatMap(p => [
  p.name, ...p.witnesses.flatMap(w => [w.name, w.role, w.greeting, w.clue, ...w.lines]),
]))
ok(!allText.some(t => /telegraph/i.test(t)), 'no telegraph in any authored place')
ok(!getGenericPlaces().some(p => /telegraph/i.test(p.name) || p.witnesses.includes('telegraph_operator')), 'no telegraph in the generic list')
const screenSrc = readFileSync('src/app/oregon-trail/phases/InvestigationScreen.tsx', 'utf8')
ok(!/Telegraph Office/.test(screenSrc), 'the screen no longer hard-codes a Telegraph Office')

// ---- 3. the resolver finds each town's people (the old slug missed two) ----
for (const [landmark, min] of [
  ['West Point', 2], ['Calaveras Big Trees', 1], ['Volcano', 4], ['Jackson', 1],
  ['Angels Camp', 1], ['Mokelumne Hill', 1],
] as const) {
  const n = resolveTrailTown(landmark).npcLocations.flatMap(getNPCsAtLocation).length
  ok(n >= min, `${landmark}: resolves to ${n} townsfolk (want >= ${min})`)
}
const volcanoIds = resolveTrailTown('Volcano').npcLocations.flatMap(getNPCsAtLocation).map(n => n.id)
const jacksonIds = resolveTrailTown('Jackson').npcLocations.flatMap(getNPCsAtLocation).map(n => n.id)
ok(!volcanoIds.some(id => jacksonIds.includes(id)), 'Volcano and Jackson do not share townsfolk')
ok(resolveTrailTown('Fort Laramie').townId === undefined && !resolveTrailTown('Fort Laramie').california, 'Fort Laramie is not a California town')

// ---- 4. California is harder; the plains name their lead ----
for (const stop of STOPS) {
  const cal = resolveTrailTown(stop).california
  for (const p of getTrailPlaces(stop)) {
    for (const w of p.witnesses) {
      if (cal) {
        ok(w.obscurity >= 2, `${stop}/${p.id}: California clue is obscurity >= 2`)
      } else {
        ok(w.obscurity === 1, `${stop}/${p.id}: plains clue is obscurity 1`)
        const key = w.lead?.label.split(',')[0].replace(/^The /, '') ?? '?'
        ok(w.clue.includes(key) || w.clue.includes(key.split(' ')[0]), `${stop}/${p.id}: plains clue names its lead (${key})`)
      }
    }
  }
}

// ---- 5. every lead goes somewhere real ----
for (const stop of STOPS) {
  for (const p of getTrailPlaces(stop)) {
    for (const w of p.witnesses) {
      const to = w.lead?.to
      ok(!!to, `${stop}/${p.id}: has a lead`)
      if (!to) continue
      const real = LANDMARK_NAMES.has(to) || !!getCanonicalTown(to) || to.includes(':')
      ok(real, `${stop}/${p.id}: lead "${to}" is a trail landmark, registry town, or scene`)
    }
  }
}
const crossTown = STOPS.flatMap(s => getTrailPlaces(s).flatMap(p => p.witnesses))
  .filter(w => w.lead && !w.lead.to.includes(':'))
ok(crossTown.length >= 10, `clues lead on to another town (${crossTown.length})`)
const crossEra = STOPS.flatMap(s => getTrailPlaces(s).flatMap(p => p.witnesses))
  .filter(w => (w.lead?.year ?? 0) > TRAIL_YEAR)
ok(crossEra.length >= 3, `clues lead into a later era (${crossEra.length})`)

// ---- 6. later eras stay inside "(Later: …)" ----
const stripLater = (t: string) => t.replace(/\(Later:[^)]*\)/g, '')
const LATER = /\b(Twain|Clemens|Jubilee|1855|1865|1928|stone hotel|Moaning Cavern|Jim Smiley|Pinkerton)\b/i
for (const stop of STOPS) {
  for (const p of getTrailPlaces(stop)) {
    const texts = [p.name, ...p.witnesses.flatMap(w => [w.greeting, w.clue, ...w.lines])]
    if (p.later) {
      ok(texts.every(t => stripLater(t).trim() === ''), `${stop}/${p.id}: later-era text is wholly inside (Later: …)`)
    } else {
      ok(texts.every(t => !LATER.test(stripLater(t))), `${stop}/${p.id}: 1849 text has no later-era names`)
    }
  }
}
ok(getTrailPlaces('Angels Camp').every(p => p.later), 'Angels Camp scenes (1855+) are all crossings, not 1849')

// ---- 7. every witness resolves for the dialogue and clue path ----
for (const stop of STOPS) {
  for (const p of getTrailPlaces(stop)) {
    for (const w of p.witnesses) {
      const npc = resolveWitnessNpc(w.id)
      ok(!!npc && npc.investigationClue?.text === w.clue && npc.name === w.name, `${w.id}: resolves to an NPC carrying its clue`)
    }
  }
}
ok(resolveWitnessNpc('volcano_placer_ortiz')?.name === 'Rafael Ortíz', 'period NPCs still resolve first')
ok(resolveWitnessNpc('tinv:nowhere:x') === undefined && resolveWitnessNpc(null) === undefined, 'unknown ids resolve to nothing')

// ---- 7b. place witnesses stay scripted; period NPCs never speak journal prose ----
const allWitnessIds = STOPS.flatMap(s => getTrailPlaces(s).flatMap(p => p.witnesses.map(w => w.id)))
ok(allWitnessIds.every(isTrailWitnessId), 'every place witness is recognised as one')
ok(!isTrailWitnessId('volcano_placer_ortiz') && !isTrailWitnessId(null), 'period NPCs are not place witnesses')
const dialogueSrc = readFileSync('src/app/oregon-trail/components/WitnessDialogue.tsx', 'utf8')
ok(/!npc \|\| isTrailWitnessId\(npc\.id\)\) return null/.test(dialogueSrc), 'place witnesses skip the 1849-framed chat persona')
ok(/!clueObtained && isTrailWitnessId\(npc\.id\) \? clue\.text/.test(dialogueSrc), 'only place witnesses speak clue text on the fallback')
ok(/catch \{[\s\S]{0,160}floorLine\(\)/.test(dialogueSrc), 'a timed-out chat still grants the clue')

// ---- 8. every authored scene has an icon and a year ----
const meta = getSceneMeta()
for (const inv of Object.values(INVESTIGATIONS)) {
  for (const sc of inv.scenes) {
    ok(!!meta[`${inv.townId}:${sc.id}`], `${inv.townId}:${sc.id} has an icon and year`)
  }
}

// ---- 9. puzzles keyed by town id now reach their landmark ----
ok(getPuzzlesForLandmark('Calaveras Big Trees').some(p => p.id === 'big_trees_rings'), 'Big Trees ring puzzle reaches "Calaveras Big Trees"')
ok(getPuzzlesForLandmark('Mokelumne Hill').some(p => p.id === 'mok_hill_ledger'), 'Mok Hill ledger puzzle reaches "Mokelumne Hill"')
ok(getPuzzlesForLandmark('Fort Kearny').length >= 1, 'name-keyed puzzles still work')

console.log(JSON.stringify({ test: 'trailInvestigation', passed, total: passed + failures.length, failed: failures }, null, 2))
process.exit(failures.length ? 1 : 0)
