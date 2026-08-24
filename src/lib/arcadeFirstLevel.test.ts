/**
 * Arcade first-level cabinet.
 *   node_modules/.bin/tsx src/lib/arcadeFirstLevel.test.ts
 */

import { CROSS_GAME_STORAGE_KEY } from './crossGameProgression'
import {
  OT_AUTOSAVE_KEY,
  HOST_AIRBNB_MESSAGE,
  arcadeBookHref,
  readArcadeAccess,
  readPostWinChoice,
  showDeeperTown,
  writePostWinChoice,
} from './arcadeFirstLevel'

class MockStorage {
  private m = new Map<string, string>()
  getItem(k: string): string | null { return this.m.has(k) ? this.m.get(k)! : null }
  setItem(k: string, v: string): void { this.m.set(k, v) }
}

function withSave(phase: string, distance = 0) {
  const s = new MockStorage()
  s.setItem(OT_AUTOSAVE_KEY, JSON.stringify({ savedAt: '2026-08-23T00:00:00.000Z', state: { phase, distance } }))
  return s
}

function withMilestones(ids: string[]) {
  const s = new MockStorage()
  s.setItem(CROSS_GAME_STORAGE_KEY, JSON.stringify({
    version: '1.0.0',
    milestones: ids.map((id) => ({ id, source: 'prospectors_tale', timestamp: '2026-08-23' })),
  }))
  return s
}

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else {
    failed += 1
    console.error('FAIL', name)
  }
}

const empty = readArcadeAccess({ storage: new MockStorage() })
ok(empty.trailComplete === false, 'empty: not complete')
ok(empty.bookingUnlocked === false, 'empty: book locked')
ok(empty.arcadeTown === true, 'empty: arcade town verbs')
ok(empty.directBook === false, 'empty: not EV')
ok(arcadeBookHref(empty).includes('airbnb.com/h/backofbeyondranch'), 'empty: book is Airbnb')
ok(arcadeBookHref(empty).includes('utm_source=arcade-book'), 'empty: book utm')
ok(showDeeperTown(empty) === false, 'empty: hide deeper town')

const ev = readArcadeAccess({ storage: new MockStorage(), search: '?utm_source=plugshare' })
ok(ev.directBook === true, 'plugshare: EV escape')
ok(ev.bookingUnlocked === true, 'plugshare: book unlocked without trail')
ok(arcadeBookHref(ev).includes('airbnb.com/h/backofbeyondranch'), 'plugshare: vanity airbnb')
ok(arcadeBookHref(ev).includes('utm_source=arcade-ev'), 'plugshare: utm')

const teslaExplore = readArcadeAccess({
  storage: new MockStorage(),
  search: '?utm_source=tesla&need=explore',
})
ok(teslaExplore.directBook === false, 'tesla+explore: still play (guestIntent override)')

const playing = readArcadeAccess({ storage: withSave('traveling', 80) })
ok(playing.played === true, 'traveling: played')
ok(playing.trailComplete === false, 'traveling: not complete')
ok(playing.bookingUnlocked === false, 'traveling: trail discount still gated')
ok(arcadeBookHref(playing).includes('airbnb.com/h/backofbeyondranch'), 'traveling: Book still Airbnb')
ok(playing.arcadeTown === true, 'traveling: arcade town')

const title = readArcadeAccess({ storage: withSave('title', 0) })
ok(title.played === false, 'title save is not played')

const legacyBare = new MockStorage()
legacyBare.setItem(OT_AUTOSAVE_KEY, JSON.stringify({ phase: 'town', distance: 12, currentLandmark: 'kansas_river' }))
ok(readArcadeAccess({ storage: legacyBare }).played === true, 'legacy bare-state save is played')

const victorySave = readArcadeAccess({ storage: withSave('gold_country_arrival', 2000) })
ok(victorySave.trailComplete === true, 'arrival phase is complete')
ok(victorySave.bookingUnlocked === true, 'arrival unlocks booking')
ok(victorySave.arcadeTown === false, 'arrival: deeper town verbs')
ok(showDeeperTown(victorySave) === true, 'arrival: show deeper')
ok(arcadeBookHref(victorySave).includes('airbnb.com/h/backofbeyondranch'), 'arrival: book goes to Airbnb')
ok(arcadeBookHref(victorySave).includes('utm_source=arcade-win'), 'arrival: win utm')

const mile = readArcadeAccess({ storage: withMilestones(['trail_victory']) })
ok(mile.trailComplete === true, 'trail_victory milestone completes')

const west = readArcadeAccess({ storage: withMilestones(['reached_west_point']) })
ok(west.trailComplete === true, 'reached_west_point still counts (compat)')

const returning = readArcadeAccess({
  storage: withMilestones(['trail_victory', 'booking_verified']),
})
ok(returning.returnDiscountReady === true, 'victory + booking_verified = return discount')
ok(returning.bookingVerified === true, 'booking_verified from milestones')

ok(HOST_AIRBNB_MESSAGE.includes('message on Airbnb'), 'host copy names Airbnb message')
ok(!HOST_AIRBNB_MESSAGE.toLowerCase().includes('mailto'), 'host copy is not mailto')

const choice = new MockStorage()
ok(readPostWinChoice(choice) === null, 'post-win: empty')
writePostWinChoice('take_discount', choice)
ok(readPostWinChoice(choice) === 'take_discount', 'post-win: take stored')
writePostWinChoice('risk_next', choice)
ok(readPostWinChoice(choice) === 'risk_next', 'post-win: risk stored')

if (failed) {
  console.error(`${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`arcadeFirstLevel tests passed (${passed})`)
