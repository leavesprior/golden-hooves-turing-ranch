/**
 * node_modules/.bin/tsx src/lib/airbnbContact.test.ts
 */
import {
  AIRBNB_CONTACT_HOST_URL,
  AIRBNB_LISTING_URL,
  AIRBNB_ROOM_ID,
  airbnbDiscountMessage,
  voucherLines,
} from './airbnbContact'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else {
    failed += 1
    console.error('FAIL', name)
  }
}

ok(AIRBNB_ROOM_ID === '30045739', 'room id is Hot Tub Hideaway')
ok(AIRBNB_CONTACT_HOST_URL === 'https://www.airbnb.com/contact_host/30045739', 'contact_host URL')
ok(AIRBNB_LISTING_URL.includes('/rooms/30045739'), 'listing URL')
ok(!AIRBNB_CONTACT_HOST_URL.includes('h/backofbeyondranch'), 'message path is not the vanity book URL')

const v = { playerName: 'Ada', percent: 5, tierName: 'TRAIL SURVIVOR', level: 1 as const }
const msg = airbnbDiscountMessage(v)
ok(msg.includes('5%'), 'message names percent')
ok(msg.includes('Ada'), 'message names player')
ok(msg.includes('level 1'), 'message names level 1')
ok(msg.toLowerCase().includes('airbnb') || msg.toLowerCase().includes('discount'), 'asks for discount')
ok(!msg.toLowerCase().includes('mailto'), 'not mailto')

const qr = voucherLines(v)
ok(qr.includes('5%'), 'QR text names percent')
ok(qr.includes('30045739'), 'QR text names listing')
ok(qr.includes('first level'), 'QR text names first level')
ok(!/`BOBR-/.test(qr), 'QR is not a BOBR- mint template')

const v2 = { ...v, level: 2 as const, percent: 10, tierName: 'TRAIL VETERAN' }
ok(airbnbDiscountMessage(v2).includes('Level 2'), 'L2 message')
ok(voucherLines(v2).includes('level 2'), 'L2 QR text')

const v3 = { ...v, level: 3 as const, percent: 15, tierName: 'TRAIL VETERAN' }
ok(airbnbDiscountMessage(v3).includes('Level 3'), 'L3 message')
ok(voucherLines(v3).includes('level 3'), 'L3 QR text')
ok(v3.percent === 15, 'L3 floor is 15')

if (failed) {
  console.error(`${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`airbnbContact tests passed (${passed})`)
