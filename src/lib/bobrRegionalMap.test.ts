import assert from 'node:assert/strict'
import { getGoldCountryMapNodes, GOLD_COUNTRY_ROUTES, milesBetween } from './bobrRegionalMap'

const nodes = getGoldCountryMapNodes()
const byId = Object.fromEntries(nodes.map((node) => [node.id, node]))

assert.equal(nodes.length, 7)
assert.ok(byId.volcano.y < byId.jackson.y, 'Volcano must plot north of Jackson')
assert.ok(byId.west_point.x > byId.volcano.x, 'West Point must plot east of Volcano')
assert.ok(byId.angels_camp.y > byId.murphys.y, 'Angels Camp must plot south of Murphys')
assert.ok(byId.murphys.x > byId.angels_camp.x, 'Murphys must plot east of Angels Camp')
assert.ok(nodes.every((node) => node.x >= 0 && node.x <= 100 && node.y >= 0 && node.y <= 100))
assert.ok(GOLD_COUNTRY_ROUTES.every(([from, to]) => byId[from] && byId[to]))
assert.ok(milesBetween(byId.west_point, byId.volcano) < 20)
assert.ok(milesBetween(byId.angels_camp, byId.murphys) < 15)

console.log('bobrRegionalMap tests passed')
