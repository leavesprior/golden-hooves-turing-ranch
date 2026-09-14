import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { middleware } from '../../../../middleware'
import { issueLocalBridgeGrant, localBackendConfig, LOCAL_BRIDGE_COOKIE, LOCAL_BRIDGE_TTL_MS } from '../../../../lib/localBackendAccess'

async function main() {
  const envKeys = ['DM_TABLE_ENABLED', 'WORKER_TIMESHEETS_ENABLED', 'LOCAL_BACKEND_SLIDES_ENABLED', 'LOCAL_BACKEND_BRIDGE_SECRET'] as const
  const before = Object.fromEntries(envKeys.map(key => [key, process.env[key]]))
  const origin = 'http://127.0.0.1:3360', endpoint = `${origin}/api/local-backend/bridge`
  const answers = ['42', 'my towel', "don't panic", 'African or European?']
  const request = (body: unknown, headers: Record<string, string> = {}) => new NextRequest(endpoint, {
    method: 'POST', body: JSON.stringify(body), headers: { host: '127.0.0.1:3360', origin, 'content-type': 'application/json', ...headers },
  })
  try {
    process.env.DM_TABLE_ENABLED = 'true'
    process.env.WORKER_TIMESHEETS_ENABLED = 'true'
    process.env.LOCAL_BACKEND_SLIDES_ENABLED = 'true'
    process.env.LOCAL_BACKEND_BRIDGE_SECRET = 'disposable-local-route-test-secret-0123456789'
    for (const body of [{}, { answers: [] }, { answers: answers.slice(0, 3) }, { answers: [...answers, 'extra'] }, { answers: ['wrong', ...answers.slice(1)] }, { answers: ['42', '', ...answers.slice(2)] }, { answers: [42, ...answers.slice(1)] }, { answers: ['x'.repeat(513), ...answers.slice(1)] }]) {
      const result = await POST(request(body))
      assert.equal(result.status, 403)
      assert.equal(result.cookies.get(LOCAL_BRIDGE_COOKIE), undefined)
    }
    const foreignHeaders: Record<string, string>[] = [{ origin: 'https://evil.example' }, { origin: '' }, { origin: 'http://localhost:3360' }, { 'sec-fetch-site': 'cross-site' }]
    for (const headers of foreignHeaders) assert.equal((await POST(request({ answers }, headers))).status, 403)
    assert.equal((await POST(request({ answers }, { 'content-type': 'text/plain' }))).status, 415)
    assert.equal((await POST(request({ answers }, { 'content-length': '4097' }))).status, 413)
    assert.equal((await POST(request({ padding: 'x'.repeat(4097) }))).status, 413)
    for (const host of ['localhost.evil', 'backofbeyondranch.farm']) assert.equal((await POST(request({ answers }, { host }))).status, 404)
    assert.equal((await POST(request({ answers }, { host: 'localhost:3360' }))).status, 403, 'Origin must match the original Host')
    for (const swallowAnswer of ['African?', 'European?', 'WHAT DO YOU MEAN?']) {
      assert.equal((await POST(request({ answers: [...answers.slice(0, 3), swallowAnswer] }))).status, 200, 'existing Keeper reversal must receive its promised passage')
      assert.equal((await POST(request({ answers: [swallowAnswer, ...answers.slice(1)] }))).status, 403, 'the reversal does not answer a non-swallow question')
    }
    const result = await POST(request({ answers }))
    assert.equal(result.status, 200)
    assert.equal(result.headers.get('cache-control'), 'no-store')
    const cookie = result.cookies.get(LOCAL_BRIDGE_COOKIE)
    assert.ok(cookie)
    assert.equal(cookie.httpOnly, true)
    assert.equal(cookie.sameSite, 'strict')
    assert.equal(cookie.path, '/')
    assert.equal(cookie.maxAge, LOCAL_BRIDGE_TTL_MS / 1000)
    assert.equal(cookie.secure, false, 'loopback HTTP can use the cookie')
    const body = await result.json()
    assert.equal(body.workerEnabled, true)
    assert.equal(body.slidesEnabled, true)
    assert.ok(body.expiresAt > Date.now())
    const config = localBackendConfig(process.env)
    const expired = await issueLocalBridgeGrant(origin, config, Date.now() - LOCAL_BRIDGE_TTL_MS - 1)
    assert.ok(expired)
    for (const path of ['/worker', '/worker/danna', '/api/worker/entries', '/api/worker/entries/7', '/neoma/neoma-slides.pdf']) {
      for (const token of [null, 'forged', expired.token]) {
        const response = await middleware(new NextRequest(`${origin}${path}`, { headers: { host: '127.0.0.1:3360', ...(token ? { cookie: `${LOCAL_BRIDGE_COOKIE}=${token}` } : {}) } }))
        assert.equal(response.status, 404, `${path}: no direct URL bypass`)
      }
      const allowed = await middleware(new NextRequest(`${origin}${path}`, { headers: { host: '127.0.0.1:3360', cookie: `${LOCAL_BRIDGE_COOKIE}=${cookie.value}` } }))
      assert.equal(allowed.headers.get('x-middleware-next'), '1', `${path}: actual signed grant accepted`)
      const publicRequest = await middleware(new NextRequest(`https://backofbeyondranch.farm${path}`, { headers: { host: 'backofbeyondranch.farm', cookie: `${LOCAL_BRIDGE_COOKIE}=${cookie.value}` } }))
      assert.equal(publicRequest.status, 404)
    }
    for (const path of ['/api/neoma/chat', '/neoma/index.html', '/oregon-trail']) {
      const allowed = await middleware(new NextRequest(`${origin}${path}`, { headers: { host: '127.0.0.1:3360' } }))
      assert.equal(allowed.headers.get('x-middleware-next'), '1', `${path} unaffected`)
    }
    // Invoke middleware only: never submit/delete a real payroll entry in tests.
    for (const method of ['POST', 'DELETE', 'PUT', 'PATCH']) {
      for (const requestOrigin of ['', 'http://localhost:3361', 'https://evil.example']) {
        const blocked = await middleware(new NextRequest(`${origin}/api/worker/entries/7`, { method, headers: { host: '127.0.0.1:3360', origin: requestOrigin, cookie: `${LOCAL_BRIDGE_COOKIE}=${cookie.value}` } }))
        assert.equal(blocked.status, 404, `${method}: a valid cookie cannot authorize a foreign-origin write`)
      }
      const allowed = await middleware(new NextRequest(`${origin}/api/worker/entries/7`, { method, headers: { host: '127.0.0.1:3360', origin, cookie: `${LOCAL_BRIDGE_COOKIE}=${cookie.value}` } }))
      assert.equal(allowed.headers.get('x-middleware-next'), '1', `${method}: same-origin worker request retains its route`)
    }
    process.env.LOCAL_BACKEND_BRIDGE_SECRET = ''
    assert.equal((await POST(request({ answers }))).status, 404)
    assert.equal((await middleware(new NextRequest(`${origin}/dm-table`, { headers: { host: '127.0.0.1:3360' } }))).status, 404)
    console.log('local backend Bridge route and real middleware passed: answers, same-origin, cookie attributes, direct URLs, public host and missing config')
  } finally {
    for (const key of envKeys) {
      if (before[key] === undefined) delete process.env[key]
      else process.env[key] = before[key]
    }
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
