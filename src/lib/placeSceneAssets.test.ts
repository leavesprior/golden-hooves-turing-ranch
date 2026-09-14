import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { placeSceneFor, placeSceneMapLink } from './placeSceneAssets'
import { getCanonicalTown, TOWN_REGISTRY } from './townRegistry'
import { TOWN_EDITORIAL } from './goldCountryEditorial'
import { NextRequest } from 'next/server'
import { middleware } from '../middleware'

const supported = new Set(['west_point', 'bobr_ranch'])
for (const town of TOWN_REGISTRY) {
  const aliases = [town.id, town.sources.explore, town.sources.oregon, ...(town.sources.chapter ?? [])]
    .filter((id): id is string => typeof id === 'string')
  for (const alias of new Set(aliases)) {
    const scene = placeSceneFor(alias)
    if (!supported.has(town.id)) {
      assert.equal(scene, undefined, `${alias}: unsupported places retain their existing scene`)
      continue
    }
    assert.ok(scene, `${alias}: supported canonical aliases receive the overlay`)
    assert.equal(scene.town, town, `${alias}: use the registry identity and coordinates`)
    assert.deepEqual(scene, placeSceneFor(town.id), `${alias}: aliases share art and provenance`)

    const mapLink = new URL(placeSceneMapLink(scene.town))
    assert.equal(mapLink.origin, 'https://www.google.com')
    assert.equal(mapLink.pathname, '/maps/search/')
    assert.equal(mapLink.searchParams.get('api'), '1')
    assert.deepEqual(mapLink.searchParams.get('query')?.split(',').map(Number), [town.lat, town.lng],
      `${alias}: the external map fallback points to the same ground`)
  }
}
for (const id of ['', 'unknown_town', 'ch4_unknown', 'https://example.com']) {
  assert.equal(placeSceneFor(id), undefined, 'unknown input must not borrow another place or its map')
}

const westPoint = placeSceneFor('west_point')!
const ranch = placeSceneFor('bobr_cabin')!
assert.equal(westPoint.modern.kind, 'maps_embed')
const embed = new URL(westPoint.modern.src)
assert.equal(embed.origin, 'https://www.google.com')
assert.equal(embed.pathname, '/maps/embed', 'use the official Share → Embed URL')
assert.equal(embed.searchParams.has('key'), false, 'the public share embed requires no API key')
// Read the coordinate fields in the captured share URL, without pinning its
// opaque timestamp, viewport, or encoded place-label fields.
const center = embed.searchParams.get('pb')?.match(/!2d(-?[\d.]+)!3d(-?[\d.]+)/)
assert.ok(center, 'the official embed must retain its coordinate center')
assert.ok(Math.abs(Number(center[1]) - westPoint.town.lng) < 1e-9, 'embed longitude matches the registry')
assert.ok(Math.abs(Number(center[2]) - westPoint.town.lat) < 1e-9, 'embed latitude matches the registry')
assert.notEqual(getCanonicalTown('west_point')!.lat, ranch.town.lat, 'town and ranch are distinct map points')

assert.equal(ranch.modern.kind, 'property_photo')
if (ranch.modern.kind !== 'property_photo') throw new Error('ranch photo missing')
assert.equal(ranch.modern.src, '/cabin-photos/cabin-2.jpg',
  'visually verified house exterior: cabin-1 is the hot tub, despite the old gallery labels')
assert.match(ranch.modern.alt, /house.*glass sun porch/i)
assert.match(ranch.modern.label, /photograph/i)
assert.equal(ranch.modern.painting, TOWN_EDITORIAL.bobr_ranch, 'the existing modern-house painting remains available')
assert.equal(readFileSync(new URL('../../public' + ranch.modern.src, import.meta.url)).readUInt16BE(0), 0xffd8,
  'the existing property photograph is present as a JPEG')

for (const scene of [westPoint, ranch]) {
  assert.equal(scene.historical.fictional, true, 'an illustrated camp is not a surveyed historical view')
  assert.match(scene.historical.label, /^1849\b/)
  assert.ok(scene.historical.alt.length > 20, 'missing art still has useful descriptive text')
  assert.match(scene.historical.notes, /invented|fictional/i, 'the reconstruction is disclosed')
  assert.notEqual(scene.historical.src, scene.modern.src, 'the era switch does not relabel the same asset')
  assert.ok(scene.historical.src.startsWith('/place-art/'), 'historical scenes use authored local art')
  assert.ok(readFileSync(new URL('../../public' + scene.historical.src.split('?')[0], import.meta.url)).length > 0)
}
assert.notEqual(ranch.historical.src, ranch.modern.painting, 'the modern glass-porch house is not the 1849 camp')
assert.match(ranch.historical.notes, /not a documented settlement/i)
assert.equal(ranch.historical.pixelated, true)
const oakCamp = readFileSync(new URL('../../public' + ranch.historical.src, import.meta.url))
assert.equal(oakCamp.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
assert.equal(oakCamp.readUInt32BE(16), 320)
assert.equal(oakCamp.readUInt32BE(20), 180)

// The public-host middleware supplies an additional policy in standalone
// deployments. Every active policy must allow the frame; localhost skips it.
async function verifyPublicPolicy() {
  const oldCanary = process.env.LAN_CANARY
  try {
    delete process.env.LAN_CANARY
    const response = await middleware(new NextRequest('https://bobr.example/explore?town=west_point', {
      headers: { host: 'bobr.example' },
    }))
    const policy = response.headers.get('content-security-policy') ?? ''
    const directive = (name: string) => policy.split(';').map(value => value.trim()).find(value => value.startsWith(`${name} `))
    assert.equal(directive('frame-src'), 'frame-src https://www.google.com/maps/embed', 'public middleware permits only the official embed path')
    assert.equal(directive('default-src'), "default-src 'self'")
    assert.equal(directive('connect-src'), "connect-src 'self'")
    assert.equal(directive('frame-ancestors'), "frame-ancestors 'none'")
  } finally {
    if (oldCanary === undefined) delete process.env.LAN_CANARY
    else process.env.LAN_CANARY = oldCanary
  }
}

verifyPublicPolicy().then(() => {
  console.log('PlaceScene assets: canonical aliases, unsupported fallback, official embed/map coordinate parity, public middleware CSP, property-photo identity and fictional 1849 art PASS')
}).catch(error => { console.error(error); process.exitCode = 1 })
