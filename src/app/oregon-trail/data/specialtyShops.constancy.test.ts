/** Run with npm run test:shop-constancy. */
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { LANDMARKS } from '../state/constants'
import { getAvailableShops, type SpecialtyShopType } from './specialtyShops'

function roster(name: string, type = 'town', seed?: number) {
  return getAvailableShops(name, type, seed).map(shop => ({
    type: shop.type, name: shop.name, keeper: shop.keeperName,
  }))
}

function types(name: string, type = 'town'): SpecialtyShopType[] {
  return getAvailableShops(name, type).map(shop => shop.type).sort()
}

test('West Point keeps its wagonwright and blacksmith across days and miles', () => {
  assert.deepEqual(types('West Point'), ['blacksmith', 'wagonwright'])
  assert.deepEqual(roster('West Point', 'town', 1), roster('West Point', 'town', 99999))
  assert.equal(getAvailableShops('West Point', 'town')[0].keeperName, 'Old Silas')
})

test('Volcano has its own assayer and apothecary, distinct from West Point', () => {
  assert.deepEqual(types('Volcano'), ['apothecary', 'assayer'])
  assert.notDeepEqual(roster('Volcano'), roster('West Point'))
})

test('named forts and Gold Country towns retain their authored services', () => {
  const expected: [string, string, SpecialtyShopType[]][] = [
    ['Fort Kearny', 'fort', ['blacksmith', 'wagonwright']],
    ['Fort Laramie', 'fort', ['apothecary', 'blacksmith']],
    ['Fort Bridger', 'fort', ['blacksmith', 'wagonwright']],
    ['Fort Hall', 'fort', ['apothecary', 'outfitter']],
    ['Fort Boise', 'fort', ['blacksmith']],
    ['Sacramento regional gateway', 'town', ['assayer', 'outfitter']],
    ['Angels Camp', 'town', ['assayer', 'outfitter']],
    ['Jackson', 'town', ['blacksmith', 'wagonwright']],
    ['Murphys', 'town', ['apothecary', 'outfitter']],
    ['Mokelumne Hill', 'town', ['assayer', 'blacksmith']],
    ['Nevada City', 'town', ['apothecary', 'assayer']],
    ['Grass Valley', 'town', ['blacksmith', 'outfitter']],
  ]
  for (const [name, type, shops] of expected) {
    assert.deepEqual(types(name, type), shops, name)
    for (const seed of [undefined, 1, 2000, 99999]) {
      assert.deepEqual(roster(name, type, seed), roster(name, type), name)
    }
  }
})

test('the actual starting landmark gets Independence shops', () => {
  const start = LANDMARKS[0]
  assert.equal(start.name, 'Independence, Missouri')
  assert.deepEqual(types(start.name, start.type), ['outfitter', 'wagonwright'])
})

test('Independence Rock and Sacramento Valley do not inherit town rosters', () => {
  for (const name of ['Independence Rock', 'Sacramento Valley']) {
    const landmark = LANDMARKS.find(candidate => candidate.name === name)!
    for (const shop of getAvailableShops(landmark.name, landmark.type)) {
      assert.ok(shop.requiredLandmarkTypes.includes(landmark.type), `${name}: ${shop.type}`)
    }
    assert.ok(!types(name, landmark.type).includes('outfitter'), name)
    assert.ok(!types(name, landmark.type).includes('wagonwright'), name)
  }
})

test('unknown stops use only their name for repeatable selection, without Math.random', () => {
  const random = Math.random
  Math.random = () => { throw new Error('shop selection must not use ambient randomness') }
  try {
    const seen = new Set<string>()
    for (const name of ['Pine Camp', 'River Camp', 'Cedar Camp', 'Dust Camp', 'New Crossing']) {
      const first = roster(name)
      seen.add(JSON.stringify(first))
      for (const seed of [undefined, 1, 2, 99999]) {
        assert.deepEqual(roster(name, 'town', seed), first, name)
      }
    }
    assert.ok(seen.size > 1, 'unknown towns do not all get the same fallback')
  } finally {
    Math.random = random
  }
})

test('all trail landmarks retain type eligibility and stable keepers', () => {
  for (const landmark of LANDMARKS) {
    assert.deepEqual(roster(landmark.name, landmark.type, 1), roster(landmark.name, landmark.type, 99999))
    for (const shop of getAvailableShops(landmark.name, landmark.type)) {
      assert.ok(shop.requiredLandmarkTypes.includes(landmark.type), `${landmark.name}: ${shop.type}`)
    }
  }
})

test('named shops still respect landmark eligibility', () => {
  assert.deepEqual(getAvailableShops('West Point', 'river'), [])
  assert.deepEqual(getAvailableShops('Volcano', 'desert'), [])
})

test('unknown names that match object properties cannot crash roster lookup', () => {
  for (const name of ['constructor', '__proto__', 'toString', '']) {
    assert.deepEqual(roster(name, 'town', 1), roster(name, 'town', 99999))
  }
})

test('changing a returned shop list cannot change future visits', () => {
  const before = roster('Fort Kearny', 'fort')
  getAvailableShops('Fort Kearny', 'fort').pop()
  assert.deepEqual(roster('Fort Kearny', 'fort'), before)
})
