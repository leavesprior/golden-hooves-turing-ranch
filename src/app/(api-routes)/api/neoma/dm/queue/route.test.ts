import assert from 'node:assert/strict'

import { NextRequest } from 'next/server'

import { mintDmQueueCapability } from '@/lib/dmSecurity'
import { GET, POST } from './route'

const ADMIN_TOKEN = 'test-only-dm-admin-token-0123456789abcdef'

process.env.DM_QUEUE_SIGNING_SECRET =
  'test-only-dm-signing-secret-0123456789abcdef'
process.env.DM_QUEUE_ADMIN_TOKEN = ADMIN_TOKEN

function queueRequest(
  playerId: string,
  authorization?: string,
): NextRequest {
  return new NextRequest(
    `http://localhost/api/neoma/dm/queue?playerId=${encodeURIComponent(playerId)}`,
    authorization ? { headers: { authorization } } : undefined,
  )
}

function postRequest(
  authorization?: string,
  body = '{',
): NextRequest {
  return new NextRequest('http://localhost/api/neoma/dm/queue', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(authorization ? { authorization } : {}),
    },
    body,
  })
}

async function responseBody(
  response: Response,
): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>
}

async function main(): Promise<void> {
const playerId = `route_auth_probe_${process.pid}`
const otherPlayerId = `${playerId}_other`
const capability = mintDmQueueCapability(playerId)
const otherCapability = mintDmQueueCapability(otherPlayerId)

assert.ok(capability, 'valid player id must mint a queue capability')
assert.ok(otherCapability, 'second valid player id must mint a queue capability')

let response: Response = await GET(queueRequest('not valid!'))
assert.equal(response.status, 400)
assert.equal((await responseBody(response)).reason, 'invalid_player_id')

response = await GET(queueRequest(playerId))
assert.equal(response.status, 401)
assert.equal((await responseBody(response)).reason, 'unauthorized')

response = await GET(queueRequest(playerId, 'Basic nope'))
assert.equal(response.status, 401)

response = await GET(queueRequest(playerId, `Bearer ${otherCapability}`))
assert.equal(response.status, 401, 'a capability must stay bound to its player')

response = await GET(queueRequest(playerId, `Bearer ${capability}`))
assert.equal(response.status, 200)
assert.equal(response.headers.get('cache-control'), 'no-store')
const authorizedGet = await responseBody(response)
assert.equal(authorizedGet.ok, true)
assert.deepEqual(
  authorizedGet.directives,
  [],
  'the unique probe player must have no queued directives',
)

response = await POST(postRequest())
assert.equal(response.status, 403)
assert.equal((await responseBody(response)).reason, 'forbidden')

response = await POST(postRequest('Bearer wrong'))
assert.equal(response.status, 403)

response = await POST(postRequest(`Bearer ${ADMIN_TOKEN}`))
assert.equal(
  response.status,
  400,
  'an authorized caller must pass the admin gate and reach JSON validation',
)
assert.equal((await responseBody(response)).reason, 'invalid_json')

delete process.env.DM_QUEUE_ADMIN_TOKEN
response = await POST(postRequest(`Bearer ${ADMIN_TOKEN}`))
assert.equal(response.status, 403, 'POST must fail closed without a server secret')
process.env.DM_QUEUE_ADMIN_TOKEN = ADMIN_TOKEN

console.log('DM queue route authorization tests passed')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
