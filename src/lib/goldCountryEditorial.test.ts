import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  chapterMapArt,
  editorialForExplorePlace,
  exploreMapPosition,
  GOLD_COUNTRY_MAP_ART,
  TOWN_EDITORIAL,
  TOWN_HOTSPOTS,
} from './goldCountryEditorial'
import { getDefaultLocation } from '../app/adventure/data/chapterLocations'

assert.equal(editorialForExplorePlace('volcano'), '/place-art/editorial/volcano_main.jpg?v=20260820a')
assert.equal(editorialForExplorePlace('vol_theatre'), '/place-art/editorial/volcano_main.jpg?v=20260820a')
assert.equal(editorialForExplorePlace('angels_camp'), '/place-art/editorial/angels_camp.jpg?v=20260820a')
assert.equal(editorialForExplorePlace('angels_camp_expanded'), '/place-art/editorial/angels_camp_expanded.jpg?v=20260820a')
assert.equal(editorialForExplorePlace('gv_empire_mine'), '/place-art/editorial/grass_valley.jpg?v=20260820a')
assert.equal(editorialForExplorePlace('bobr_ranch'), '/place-art/editorial/bobr_ranch.jpg?v=20260820a')
assert.equal(editorialForExplorePlace('west_point'), '/place-art/editorial/west_point.jpg?v=20260820a')
assert.equal(editorialForExplorePlace('ch1_independence'), '/place-art/editorial/independence.jpg?v=20260820a')
assert.equal(editorialForExplorePlace('ch4_ranch_site'), '/place-art/editorial/bobr_ranch.jpg?v=20260820a')
assert.equal(editorialForExplorePlace('welcome_gate'), '/place-art/editorial/welcome_gate.jpg?v=20260820a')
assert.equal(editorialForExplorePlace('jackson'), '/place-art/editorial/jackson.jpg?v=20260820a')
assert.equal(editorialForExplorePlace('murphys'), '/place-art/editorial/murphys.jpg?v=20260820a')
assert.equal(editorialForExplorePlace('moaning_cavern'), '/place-art/editorial/moaning_cavern.jpg?v=20260820a')
assert.equal(editorialForExplorePlace('ch2_hangtown'), '/place-art/editorial/hangtown.jpg?v=20260820a')
assert.equal(editorialForExplorePlace('ch3_donner_pass'), '/place-art/editorial/truckee_pass.jpg?v=20260820a')
assert.equal(editorialForExplorePlace('ot_kansas_river'), '/place-art/editorial/kansas_river.jpg?v=20260820a')
assert.equal(editorialForExplorePlace('unknown_place'), null)

const editorialDir = join(import.meta.dirname, '../../public/place-art/editorial')
for (const file of [
  'jackson.jpg',
  'welcome_gate.jpg',
  'hangtown.jpg',
  'moaning_cavern.jpg',
  'murphys.jpg',
  'harris_ranch.jpg',
  'natural_bridges.jpg',
]) {
  assert.equal(existsSync(join(editorialDir, file)), true, file)
}
assert.equal(GOLD_COUNTRY_MAP_ART, '/place-art/editorial/gold_country_map.jpg?v=20260820a')
assert.equal(chapterMapArt(1), '/place-art/editorial/missouri_prairie.jpg?v=20260820a')
assert.equal(chapterMapArt(2), GOLD_COUNTRY_MAP_ART)
assert.equal(chapterMapArt(5), GOLD_COUNTRY_MAP_ART)
assert.equal(getDefaultLocation(1)?.id, 'ch1_independence')
assert.equal(getDefaultLocation(2)?.id, 'ch2_volcano_main')

const artPaths = Object.values(TOWN_EDITORIAL)
assert.equal(new Set(artPaths).size, artPaths.length, 'each town still must be unique')

for (const id of Object.keys(TOWN_EDITORIAL)) {
  assert.ok((TOWN_HOTSPOTS[id] || []).length > 0, `${id} needs hotspots`)
}

const ranch = exploreMapPosition('bobr_ranch', 38.3947, -120.5269)
const westPoint = exploreMapPosition('west_point', 38.3965, -120.5269)
assert.ok(Math.abs(ranch.x - westPoint.x) > 2, 'ranch and West Point pins must not stack')
const nevadaCity = exploreMapPosition('nevada_city', 39.2616, -121.0161)
const mariposa = exploreMapPosition('mariposa', 37.4849, -119.9663)
assert.ok(nevadaCity.y < mariposa.y, 'Nevada City is north of Mariposa')
assert.ok(nevadaCity.x < mariposa.x, 'Nevada City is west of Mariposa')

console.log('goldCountryEditorial tests passed')
