/**
 * 1849 volcano explorer does not present later brick as here-now.
 *   node_modules/.bin/tsx src/lib/exploreVolcanoEra.test.ts
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { arcadePresentAttractions } from '../app/explore/explorerContext'
import {
  GRASS_VALLEY_LATER_ATTRACTION_IDS,
  NEVADA_CITY_LATER_ATTRACTION_IDS,
  TOWN_NPCS,
  VOLCANO_LATER_ATTRACTION_IDS,
  presentStreetHits,
} from './goldCountryEditorial'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../app/explore/ExploreClient.tsx')
const src = readFileSync(root, 'utf8')
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
const code = strip(src)

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else { failed += 1; console.error('FAIL', name) }
}

for (const id of VOLCANO_LATER_ATTRACTION_IDS) {
  const block = src.split(`id: '${id}'`)[1]?.slice(0, 900) || ''
  ok(/period:\s*'later'/.test(block), `${id} tagged later in code`)
}

ok(arcadePresentAttractions([
  { id: 'vol_cemetery', period: 'available' as const },
  { id: 'vol_st_george', period: 'later' as const },
]).map((a) => a.id).join() === 'vol_cemetery', 'filter drops later')

ok(arcadePresentAttractions([{ id: 'vol_st_george' } as { id: string; period?: 'available' | 'later' }]).map((a) => a.id).join() === 'vol_st_george', 'untagged stays present — tag is load-bearing')

ok(arcadePresentAttractions([{ id: 'x', period: 'later' as const }]).length === 0, 'later-only list is empty')

ok(TOWN_NPCS.volcano.filter((n) => n.period === 'later').map((n) => n.id).sort().join() === 'v_armand,v_keeper', 'hotel/theatre NPCs stay later')
ok(TOWN_NPCS.volcano.some((n) => n.id === 'v_bell' && n.period !== 'later'), 'Josiah Bell is 1849-present on the canvas')
ok(TOWN_NPCS.west_point.some((n) => n.id === 'wp_will' && n.period === 'later'), 'Willows regular is later')
ok(TOWN_NPCS.west_point.some((n) => n.id === 'wp_pack' && n.period !== 'later'), 'Packer is 1849-present')
for (const id of ['bobr_cabin', 'bobr_treasure', 'bobr_gold_pan']) {
  const block = src.split(`id: '${id}'`)[1]?.slice(0, 900) || ''
  ok(/period:\s*'later'/.test(block), `${id} tagged later in code`)
}
ok(!/period:\s*'later'/.test(src.split("id: 'bobr_campfire'")[1]?.slice(0, 700) || ''), 'campfire stays 1849-present')
ok(/eraName:\s*'The oak camp'/.test(src), 'ranch 1849 face is named the oak camp')
ok(/eraTagline:\s*'Fire at dusk'/.test(src), 'ranch 1849 tagline is fire at dusk')
ok(/id: 'vol_canvas_flat'/.test(src) && /id: 'vol_soldiers_gulch'/.test(src), '1849 canvas and gulch exist in ExploreClient')
ok(/Canvas and rope in 1849/.test(code), 'townStory is 1849 canvas, not brick capital')
ok(!/housed the state's first lending library, astronomical observatory, and little theatre/.test(code), '1849 story does not claim later brick as present')
ok(!/stone walls still stand/.test(src), 'tunnels copy does not promise later stone on the 1849 face')
ok(/Cut stone comes later/.test(src), 'tunnels copy says cut stone is later')

for (const id of NEVADA_CITY_LATER_ATTRACTION_IDS) {
  const block = src.split(`id: '${id}'`)[1]?.slice(0, 900) || ''
  ok(/period:\s*'later'/.test(block), `${id} tagged later in code`)
}
ok(/period:\s*'available'/.test(src.split("id: 'nc_deer_creek'")[1]?.slice(0, 900) || ''), 'Deer Creek stays 1849-present')
ok(/eraName:\s*'Deer Creek camp'/.test(src), 'Nevada City 1849 face is the creek camp')
ok(/Gravel, not gaslight/.test(src), 'Nevada City 1849 tagline is gravel')
ok(/Victorian downtown, the 1856 hotel, and gaslight come later/.test(src), 'Nevada City story does not claim Victorian as present')
ok(TOWN_NPCS.nevada_city.some((n) => n.id === 'nc_lamp' && n.period === 'later'), 'lamp-lighter is later')
ok(!presentStreetHits('nevada_city').spots.some((s) => s.attractionId === 'nc_national_hotel'), '1856 hotel pin is off the 1849 street')
ok(presentStreetHits('nevada_city').spots.some((s) => s.attractionId === 'nc_deer_creek'), 'Deer Creek pin stays')

for (const id of GRASS_VALLEY_LATER_ATTRACTION_IDS) {
  const block = src.split(`id: '${id}'`)[1]?.slice(0, 900) || ''
  ok(/period:\s*'later'/.test(block), `${id} tagged later in code`)
}
ok(/period:\s*'available'/.test(src.split("id: 'gv_condon_park'")[1]?.slice(0, 900) || ''), 'pine ridge stays 1849-present')
ok(/eraName:\s*'The pine ridge'/.test(src), 'Grass Valley 1849 face is the pine ridge')
ok(/The town is not from this year/.test(src), 'Grass Valley 1849 tagline is not-yet-a-town')
ok(/The town starts in 1850/.test(src), 'Grass Valley story does not claim the 1850 town as 1849')
ok(TOWN_NPCS.grass_valley.some((n) => n.id === 'gv_cornish' && n.period === 'later'), 'Cornish miner is later')
ok(!presentStreetHits('grass_valley').spots.some((s) => s.attractionId === 'gv_empire_mine'), 'Empire Mine pin is off the 1849 street')
ok(!presentStreetHits('grass_valley').spots.some((s) => s.attractionId === 'gv_condon_park'), 'pine ridge is a list pill, not a pin on the later mine painting')

const townFace = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../components/explore/InteractiveTown.tsx'), 'utf8')
ok(/Looked at \$\{a\.name\}/.test(townFace), 'pin click looks; it does not enter a walkable room')
ok(!/same as walking a town in the old RPGs/.test(townFace), 'empty-state does not claim an old-RPG walk')
ok(/Click a building on the street to look closer/.test(townFace), 'empty-state speaks look')

if (failed) { console.error(`${failed} failed, ${passed} passed`); process.exit(1) }
console.log(JSON.stringify({ ok: true, passed, later_ids: VOLCANO_LATER_ATTRACTION_IDS.length }))
