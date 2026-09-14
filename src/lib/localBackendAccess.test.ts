import assert from 'node:assert/strict'
import { allowLocalBackendRequest, issueLocalBridgeGrant, localBackendConfig, localBackendOrigin, localBackendRoute, LOCAL_BRIDGE_TTL_MS, verifyLocalBridgeGrant } from './localBackendAccess'

async function main() {
  const env = { DM_TABLE_ENABLED: 'true', WORKER_TIMESHEETS_ENABLED: 'true', LOCAL_BACKEND_SLIDES_ENABLED: 'true', LOCAL_BACKEND_BRIDGE_SECRET: 'disposable-local-test-secret-0123456789' }
  const config = localBackendConfig(env), origin = 'http://127.0.0.1:3360', now = 1_800_000_000_000
  let checked = 0
  for (const host of ['localhost', 'localhost:3360', '127.0.0.1', '127.0.0.1:3360', '[::1]', '[::1]:3360']) {
    assert.equal(localBackendOrigin(`http://${host}/dm-table`, host), `http://${host}`); checked++
  }
  for (const host of ['localhost.evil', 'localhostevil:3360', '127.0.0.1.evil', '127.0.0.11', '127.1', '2130706433', 'localhost.', 'localhost@evil.com', 'localhost:3360/path', 'localhost:70000', 'localhost:3360 ', '192.168.1.42', 'backofbeyondranch.farm', '']) {
    assert.equal(localBackendOrigin(`${origin}/dm-table`, host), null, host); checked++
  }
  assert.equal(localBackendOrigin('http://localhost:3360/dm-table', '127.0.0.1:3360'), origin, 'Next normalizes the URL but original loopback Host binds the grant')
  assert.equal(localBackendOrigin('http://public.example/dm-table', 'localhost'), null, 'public request URL cannot claim local Host')
  assert.equal(localBackendOrigin(`${origin}/dm-table`, 'localhost:3361'), null, 'ports must agree')
  const grant = await issueLocalBridgeGrant(origin, config, now)
  assert.ok(grant)
  assert.equal(grant.expiresAt, now + LOCAL_BRIDGE_TTL_MS)
  assert.equal(await verifyLocalBridgeGrant(grant.token, origin, config, now), true)
  assert.equal(await verifyLocalBridgeGrant(grant.token, origin, config, grant.expiresAt - 1), true)
  for (const at of [now - 1, grant.expiresAt, grant.expiresAt + 1]) assert.equal(await verifyLocalBridgeGrant(grant.token, origin, config, at), false)
  for (const wrongOrigin of ['http://localhost:3360', 'http://127.0.0.1:3361', 'https://127.0.0.1:3360']) assert.equal(await verifyLocalBridgeGrant(grant.token, wrongOrigin, config, now), false)
  for (const forged of ['', 'true', 'v1.1.2.fake.fake', `${grant.token}x`, grant.token.replace('.v1.', '.v2.'), grant.token.replace(String(grant.expiresAt), String(grant.expiresAt + 1))].filter(token => token !== grant.token)) {
    assert.equal(await verifyLocalBridgeGrant(forged, origin, config, now), false); checked++
  }
  const parts = grant.token.split('.')
  parts[3] = (parts[3][0] === '0' ? '1' : '0') + parts[3].slice(1)
  assert.equal(await verifyLocalBridgeGrant(parts.join('.'), origin, config, now), false, 'changed nonce cannot forge a grant')
  assert.equal(await verifyLocalBridgeGrant(grant.token, origin, { ...config, secret: `${env.LOCAL_BACKEND_BRIDGE_SECRET}changed` }, now), false)
  for (const secret of ['', 'short', ' '.repeat(40)]) {
    const missing = localBackendConfig({ ...env, LOCAL_BACKEND_BRIDGE_SECRET: secret })
    assert.equal(missing.enabled, false)
    assert.equal(await issueLocalBridgeGrant(origin, missing, now), null)
    assert.equal(await verifyLocalBridgeGrant(grant.token, origin, missing, now), false)
  }
  for (const dm of [false, true]) for (const worker of [false, true]) for (const slides of [false, true]) {
    const flags = localBackendConfig({ ...env, DM_TABLE_ENABLED: String(dm), WORKER_TIMESHEETS_ENABLED: String(worker), LOCAL_BACKEND_SLIDES_ENABLED: String(slides) })
    for (const path of ['/dm-table', '/dm-table/child', '/api/local-backend/bridge', '/worker', '/worker/danna', '/api/worker/entries', '/api/worker/entries/7', '/neoma/neoma-slides.pdf']) {
      const route = localBackendRoute(path)
      const needsGrant = route === 'worker' || route === 'slides'
      for (const withGrant of [false, true]) {
        const expected = dm && (route !== 'worker' || worker) && (route !== 'slides' || slides) && (!needsGrant || withGrant)
        assert.equal(await allowLocalBackendRequest({ path, url: `${origin}${path}`, host: '127.0.0.1:3360', cookie: withGrant ? grant.token : null, config: flags, now }), expected, `${path} flag matrix`)
        assert.equal(await allowLocalBackendRequest({ path, url: `https://backofbeyondranch.farm${path}`, host: 'backofbeyondranch.farm', cookie: grant.token, config: flags, now }), false, 'flags never open the public host')
        checked += 2
      }
    }
  }
  for (const path of ['/api/neoma/chat', '/neoma/cca-trainer.html', '/neoma/index.html', '/oregon-trail', '/explore', '/karma-market', '/api/workers']) {
    assert.equal(localBackendRoute(path), null)
    assert.equal(await allowLocalBackendRequest({ path, url: `https://backofbeyondranch.farm${path}`, host: 'backofbeyondranch.farm', config: localBackendConfig({}) }), true)
    checked++
  }
  for (const path of ['/neoma/%6eeoma-slides.pdf', '/%6eeoma/neoma-slides.pdf', '/neoma%2fneoma-slides.pdf', '/neoma/neoma-slides.%70df', '/%256eeoma/neoma-slides.pdf', '/neoma/%256eeoma-slides.pdf', '/neoma/extra/%2e%2e/neoma-slides.pdf', '/neoma//neoma-slides.pdf', '/neoma/neoma-slides.pdf/']) {
    assert.equal(localBackendRoute(path), 'slides', path)
    assert.equal(await allowLocalBackendRequest({ path, url: `${origin}${path}`, host: '127.0.0.1:3360', config, now }), false, 'decoded static alias requires the grant')
    checked++
  }
  for (const path of ['/%77orker', '/worker/%64anna', '/worker%2fdanna', '/%77orker%2fdanna', '/api/%77orker/entries', '/api/worker%2fentries', '/api/%2577orker/entries', '/api/worker/entries/%2e%2e/entries']) {
    assert.equal(localBackendRoute(path), 'worker', path)
    assert.equal(await allowLocalBackendRequest({ path, url: `${origin}${path}`, host: '127.0.0.1:3360', config, now }), false)
    checked++
  }
  console.log(`localBackendAccess passed (${checked} route/host checks plus signature and expiry assertions)`)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
