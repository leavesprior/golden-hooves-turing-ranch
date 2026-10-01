import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { editorialForExplorePlace } from '../lib/goldCountryEditorial'

// These five files in public/place-art are app screenshots (address bar, side panel,
// hotbar), not paintings. No place may map to them (09-30).
const SCREENSHOTS = ['west_point', 'nevada_city', 'vol_st_george', 'bobr_cabin', 'sa_courthouse']

const src = readFileSync(new URL('./PlaceBackdrop.tsx', import.meta.url), 'utf8')
const start = src.indexOf('const PLACE_ART')
const block = src.slice(start, src.indexOf('\n}\n', start)).replace(/\/\/.*$/gm, '')
const entries = [...block.matchAll(/(\w+): '(\w+)'/g)].map((m) => [m[1], m[2]] as const)

assert.ok(entries.length > 40, `PLACE_ART parsed ${entries.length} entries; parser is broken`)
for (const [id, file] of entries) {
  assert.ok(!SCREENSHOTS.includes(file), `${id} maps to the screenshot ${file}.png`)
}
// The entries removed on 09-30 must still draw their editorial photo, so the removal
// changed nothing a player sees.
for (const id of ['west_point', 'nevada_city', 'vol_st_george', 'bobr_cabin', 'bobr_ranch', 'sa_courthouse',
  'ch2_st_george', 'ch4_west_point', 'ch4_ranch_site', 'ch5_ranch_house']) {
  assert.ok(editorialForExplorePlace(id), `${id} lost its editorial photo and would draw nothing`)
}
// Neighbours of the removed entries stay mapped.
const ids = new Set(entries.map(([id]) => id))
for (const id of ['murphys', 'moaning_cavern', 'ch3_jumping_frog', 'ch4_jackson', 'volcano', 'angels_camp']) {
  assert.ok(ids.has(id), `${id} fell out of PLACE_ART`)
}
console.log(`placeBackdropScreenshots: ${entries.length} entries, 0 screenshots, 10 editorial fallbacks OK`)
