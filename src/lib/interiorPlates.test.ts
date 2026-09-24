import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { INTERIOR_PLATE_IDS, interiorPlateFor } from './interiorPlates'
import { TOWN_FRONTS } from './goldCountryStreet'

const root = path.resolve(__dirname, '../../public')
const frontIds = new Set(TOWN_FRONTS.map((f) => f.id))
const manifestPath = path.join(root, 'images/interiors/manifest.json')
const manifest = (INTERIOR_PLATE_IDS.length ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {}) as Record<string, unknown>
for (const id of INTERIOR_PLATE_IDS) {
  assert.ok(frontIds.has(id), `${id} is a real street front`)
  const src = interiorPlateFor(id)!
  const file = path.join(root, src)
  assert.ok(fs.existsSync(file), `${id}: ${src} exists`)
  assert.ok(fs.statSync(file).size < 600_000, `${id}: plate stays small for phones`)
  const buf = fs.readFileSync(file)
  // JPEG SOF0/SOF2 marker carries the pixel size: plates are 16:9.
  let w = 0, h = 0
  for (let i = 2; i < buf.length - 9; i++) {
    if (buf[i] === 0xff && (buf[i + 1] === 0xc0 || buf[i + 1] === 0xc2)) { h = buf.readUInt16BE(i + 5); w = buf.readUInt16BE(i + 7); break }
  }
  assert.ok(w > 0 && Math.abs(w / h - 16 / 9) < 0.01, `${id}: 16:9 (${w}x${h})`)
  assert.ok(manifest[id], `${id}: prompt recorded in manifest.json`)
}
assert.equal(interiorPlateFor('no_such_front'), null)
console.log(`interiorPlates: ok (${INTERIOR_PLATE_IDS.length} plates)`)
