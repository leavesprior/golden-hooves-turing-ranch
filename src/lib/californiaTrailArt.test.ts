import assert from 'node:assert/strict'
import {
  editorialForDistance,
  editorialForLandmark,
  terrainForDistance,
} from './californiaTrailArt'

assert.equal(editorialForLandmark('Independence, Missouri'), '/place-art/editorial/independence.jpg')
assert.equal(editorialForLandmark('Kansas River Crossing'), '/place-art/editorial/kansas_river.jpg')
assert.equal(editorialForLandmark('Kansas River'), '/place-art/editorial/kansas_river.jpg')
assert.equal(editorialForLandmark('Fort Kearny'), '/place-art/editorial/fort_kearny.jpg')
assert.equal(editorialForLandmark('West Point'), '/place-art/editorial/west_point.jpg')
assert.equal(editorialForLandmark('Gold Country'), '/place-art/ot_title_prairie_editorial.jpg')
assert.equal(editorialForLandmark(''), null)

const start = editorialForDistance(10)
assert.equal(start.src, '/place-art/editorial/missouri_prairie.jpg', 'early miles are Missouri-Kansas prairie, not the Sierra cabin')
assert.equal(start.alt, 'Independence, Missouri')

const nearKansas = editorialForDistance(80)
assert.equal(nearKansas.src, '/place-art/editorial/kansas_river.jpg', 'last third of the first gap shows the Kansas crossing ahead')

const afterKansas = editorialForDistance(120)
assert.equal(afterKansas.src, '/place-art/editorial/missouri_prairie.jpg')

const nearKearny = editorialForDistance(250)
assert.equal(nearKearny.src, '/place-art/editorial/fort_kearny.jpg')

const platte = editorialForDistance(320)
assert.equal(platte.src, '/place-art/editorial/platte_road.jpg', 'Kearny-to-Chimney stretch is the Platte road')

const desert = editorialForDistance(1450)
assert.equal(desert.src, '/place-art/editorial/humboldt_river.jpg')

const sierra = editorialForDistance(1800)
assert.equal(sierra.src, '/place-art/editorial/truckee_pass.jpg')

assert.equal(terrainForDistance(50), 'plains')
assert.equal(terrainForDistance(500), 'plains', 'Platte valley is plains, not forest')
assert.equal(terrainForDistance(1000), 'desert')
assert.equal(terrainForDistance(1800), 'mountains')
assert.equal(terrainForDistance(1960), 'forest')

console.log('californiaTrailArt tests passed')
