import assert from 'node:assert/strict'
import { postPresenceCheckin } from './livingTrailSync'
import { POST } from '../app/(api-routes)/api/living-trail/checkin/route'
import fs from 'node:fs'
import path from 'node:path'

async function main() {
// Privacy: a check-in carries how close the player was, never where they were.
let sent: Record<string, unknown> | null = null
globalThis.fetch = (async (_url: string, init?: { body?: string }) => {
  sent = JSON.parse(init?.body ?? '{}')
  return { ok: true, json: async () => ({ ok: true }) }
}) as unknown as typeof fetch

await postPresenceCheckin('lt_vol_fire_dragon', { distanceM: 12.4, accuracyM: 8 }, true)
assert.ok(sent, 'a check-in was posted')
const body = JSON.stringify(sent)
assert.doesNotMatch(body, /"lat"|"lng"|"latitude"|"longitude"/, 'no coordinates leave the device')
assert.deepEqual((sent as { presence?: unknown }).presence, { distanceM: 12, accuracyM: 8 }, 'distance rounded to the metre')

await postPresenceCheckin('lt_vol_fire_dragon', null, false)
assert.equal((sent as { presence?: unknown }).presence, null, 'remote completion sends no presence')

// The server never stores coordinates, even from an old client that still sends them.
const req = (b: unknown) => ({ json: async () => b }) as unknown as Parameters<typeof POST>[0]
const res = await POST(req({ sessionId: 'karma_1_abc', nodeId: 'lt_vol_old_abe', verified: true, coords: { lat: 38.4431, lng: -120.63079, accuracyM: 5 }, presence: { distanceM: 20, accuracyM: 5 } }))
assert.equal(res.status, 200)
const file = fs.existsSync('/data') ? '/data/living_trail_checkins.jsonl' : path.join('/tmp', 'living_trail_checkins.jsonl')
const stored = fs.readFileSync(file, 'utf8').trim().split('\n').pop() ?? ''
assert.ok(stored.includes('lt_vol_old_abe'), 'the check-in was recorded')
assert.doesNotMatch(stored, /38\.4431|-120\.63079|"lat"|"lng"/, 'no coordinates stored')
assert.match(stored, /"distanceM":20/)

console.log('livingTrailSync: ok')
}
main().catch((e) => { console.error(e); process.exit(1) })
