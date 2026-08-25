/**
 * Ranch-house QR gate for /explore.
 *   node_modules/.bin/tsx src/lib/exploreQrGate.test.ts
 */

import { EXPLORE_QR_TOKEN, hasExploreQr } from './exploreQrGate'

class MockStorage {
  private m = new Map<string, string>()
  getItem(k: string): string | null { return this.m.has(k) ? this.m.get(k)! : null }
  setItem(k: string, v: string): void { this.m.set(k, v) }
}

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else { failed += 1; console.error('FAIL', name) }
}

ok(hasExploreQr({ search: '', storage: new MockStorage() }) === false, 'locked without qr')
ok(hasExploreQr({ search: '?foo=1', storage: new MockStorage() }) === false, 'other query stays locked')
ok(hasExploreQr({ search: `?qr=${EXPLORE_QR_TOKEN}`, storage: new MockStorage() }) === true, 'qr token opens')
ok(hasExploreQr({ search: `?gate=${EXPLORE_QR_TOKEN}`, storage: new MockStorage() }) === true, 'gate alias opens')

const s = new MockStorage()
ok(hasExploreQr({ search: `?qr=${EXPLORE_QR_TOKEN}`, storage: s }) === true, 'first scan')
ok(s.getItem('bobr_explore_qr') === EXPLORE_QR_TOKEN, 'scan persists to session')
ok(hasExploreQr({ search: '', storage: s }) === true, 'later visit in same session stays open')
ok(hasExploreQr({ search: '', storage: new MockStorage(), cookie: 'bobr_explore_qr=ranch-house' }) === true, 'cookie opens')
ok(hasExploreQr({ search: '', storage: new MockStorage(), cookie: 'other=1' }) === false, 'other cookie stays locked')

if (failed) { console.error(`${failed} failed, ${passed} passed`); process.exit(1) }
console.log(`exploreQrGate tests passed (${passed})`)
