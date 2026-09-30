// Trail Investigate screen: every town its own places, leads that go somewhere
// real, harder clues in California, later eras kept inside "(Later: …)".
import { existsSync, readFileSync } from 'node:fs'
import {
  TRAIL_YEAR,
  getAuthoredStops,
  getGenericPlaces,
  getSceneMeta,
  figureForWitness,
  getPlaceStills,
  getTrailPlaces,
  getWitnessSprites,
  heroStillFor,
  isTrailWitnessId,
  tradeGlyph,
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
const HERO_GAPS = new Set(['Carson Hill'])
const signatures = new Map<string, string>()
for (const stop of STOPS) {
  const places = getTrailPlaces(stop)
  ok(places.length >= 1, `${stop}: has authored places`)
  // A picture differs within a town: a still, or else a distinct glyph.
  const pics = places.map(p => p.still ?? `glyph:${p.glyph}`)
  const dupGlyphs = pics.filter((x, i) => x.startsWith('glyph:') && pics.indexOf(x) !== i)
  ok(dupGlyphs.length === 0, `${stop}: no two stillless places share a glyph (${pics.join(' ')})`)
  // Art gaps are named, never filled with another town's picture.
  if (!HERO_GAPS.has(stop)) ok(!!heroStillFor(stop), `${stop}: has a hero still`)
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

// ---- 7c. the game's own visual language, never emoji ----
const EMOJI = /\p{Extended_Pictographic}/u
const GLYPHS = new Set(['shop', 'mine', 'building', 'landmark', 'assay', 'inn', 'cave', 'frog', 'church', 'fort', 'river', 'blacksmith', 'cabin', 'mountains', 'desert', 'spring', 'saloon', 'stable', 'town'])
for (const stop of STOPS) {
  for (const p of getTrailPlaces(stop)) {
    ok(GLYPHS.has(p.glyph), `${stop}/${p.id}: glyph "${p.glyph}" is one MapIcon draws`)
    ok(!EMOJI.test(p.displayName) && !EMOJI.test(p.name), `${stop}/${p.id}: no emoji in the place name`)
    if (!p.later) ok(!LATER.test(p.displayName), `${stop}/${p.id}: 1849 display name has no later-era names`)
    ok(!/\(Later:/.test(p.displayName), `${stop}/${p.id}: display name is plain (the badge carries the year)`)
  }
}
ok(getGenericPlaces().every(p => GLYPHS.has(p.glyph)), 'generic places draw glyphs')
const invSrc = readFileSync('src/app/oregon-trail/phases/InvestigationScreen.tsx', 'utf8')
ok(!EMOJI.test(invSrc.replace(/\\u[0-9A-Fa-f]{4}/g, '')), 'the Investigation screen source carries no emoji')
ok(!/npc\.portrait|\.icon\b/.test(invSrc), 'the screen never renders an emoji portrait or icon field')
ok(/west-face-shell/.test(invSrc) && /PlayerPortrait/.test(invSrc) && /InvestigationFigure/.test(invSrc), 'the screen uses the west-face shell, the player portrait and the shared figure')
for (const stop of STOPS) for (const p of getTrailPlaces(stop)) {
  const f = figureForWitness(p.witnesses[0].id, 'townfolk')
  ok(f.glyph === p.glyph && f.still === p.still && f.sprite === p.witnesses[0].sprite, `${p.witnesses[0].id}: dialogue figure matches its card`)
}
ok(figureForWitness('volcano_placer_ortiz', 'townfolk').glyph === 'mine', 'a period miner gets the mine glyph')
ok(['bartender', 'miner', 'preacher', 'merchant', 'lawman'].every(t => GLYPHS.has(tradeGlyph(t as never))), 'townsfolk trades map to drawable glyphs')

// Atlas figures: a deliberate allowlist, person by person. The lamp-helmet miner
// is an 1890s hard-rock man, so he never stands in for an 1849 placer miner.
const SPRITE_OK: Record<string, string> = {
  'west_point:sandy_gulch': 'nell', 'mariposa:pine_tree_mine': 'nell',
  'volcano:library': 'headmistress', 'san_andreas:old_jail': 'headmistress', 'san_andreas:hall_of_records': 'headmistress',
  'jackson:tailing_wheels': 'headmistress', 'grass_valley:empire_mine': 'headmistress', 'nevada_city:national_hotel': 'headmistress',
  'jackson:st_sava': 'priest', 'angels_camp:utica_mine': 'miner', 'jackson:kennedy_mine': 'miner', 'grass_valley:north_star': 'miner',
  'nevada_city:nevada_theatre': 'actor',
}
for (const [k, v] of Object.entries(getWitnessSprites())) ok(SPRITE_OK[k] === v, `sprite ${k} -> ${v} is on the allowlist`)
const sceneMeta = getSceneMeta()
for (const [k, v] of Object.entries(getWitnessSprites())) {
  if (v === 'miner') ok((sceneMeta[k]?.year ?? 0) >= 1880, `${k}: the lamp-helmet miner only stands in a hard-rock era`)
}
for (const [k, src] of Object.entries(getPlaceStills())) ok(existsSync(`public/${src.replace(/^\//, '').split('?')[0]}`), `${k}: still ${src} exists`)
for (const stop of STOPS) {
  const h = heroStillFor(stop)
  if (h) ok(existsSync(`public/${h.src.replace(/^\//, '').split('?')[0]}`), `${stop}: hero ${h.src} exists`)
}

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
