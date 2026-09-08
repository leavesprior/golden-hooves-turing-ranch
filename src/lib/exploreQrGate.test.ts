/**
 * Ranch-house QR gate for /explore.
 *   node_modules/.bin/tsx src/lib/exploreQrGate.test.ts
 */

import { EXPLORE_QR_TOKEN, exploreSurfaceOpen, hasExploreQr, peekTownFromSearch } from './exploreQrGate'

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

ok(peekTownFromSearch('?town=volcano') === 'volcano', 'hub interest volcano is a peek')
ok(peekTownFromSearch('?town=jackson') === '', 'jackson has no explorer face yet — not a peek')
ok(peekTownFromSearch('?town=not-a-town') === '', 'unknown town is not a peek')
ok(peekTownFromSearch('') === '', 'no town is not a peek')
ok(hasExploreQr({ search: '?town=volcano', storage: new MockStorage() }) === false, 'town peek is not a QR unlock')
const peekStore = new MockStorage()
ok(exploreSurfaceOpen({ search: '?town=volcano', storage: peekStore }) === true, 'town peek opens the surface')
ok(exploreSurfaceOpen({ search: '?town=jackson', storage: new MockStorage() }) === false, 'jackson peek stays locked until it has a face')
ok(peekStore.getItem('bobr_explore_qr') == null, 'town peek does not persist ranch-house QR')
ok(exploreSurfaceOpen({ search: '', storage: new MockStorage() }) === false, 'bare /explore stays locked')
ok(exploreSurfaceOpen({ search: '?town=volcano&qr=nope', storage: new MockStorage() }) === true, 'valid peek still opens even with a junk qr')
ok(hasExploreQr({ search: '?town=volcano&qr=nope', storage: new MockStorage() }) === false, 'junk qr does not become ranch-house')

if (failed) { console.error(`${failed} failed, ${passed} passed`); process.exit(1) }
console.log(`exploreQrGate tests passed (${passed})`)
