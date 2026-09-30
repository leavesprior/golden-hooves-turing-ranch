/**
 * node_modules/.bin/tsx src/lib/bookingRoute.test.ts
 */
import { bookingRoute, WHIMSTAY_LISTING_URL } from './bookingRoute'

let passed = 0
let failed = 0
function ok(cond: boolean, name: string) {
  if (cond) passed += 1
  else {
    failed += 1
    console.error('FAIL', name)
  }
}

const TODAY = '2026-09-29'
const AIRBNB = 'https://www.airbnb.com/rooms/30045739'

function kind(ci: string, co: string, g = 2) {
  const r = bookingRoute(ci, co, g, TODAY)
  return r.ok ? r.kind : `error:${r.reason}`
}

// 28-night boundary (check-in far out so lead time is not the reason)
ok(kind('2027-01-01', '2027-01-28') === 'airbnb', '27 nights far out → airbnb')
ok(kind('2027-01-01', '2027-01-29') === 'long-stay', '28 nights → long-stay')

// 30-day lead boundary (short stays)
ok(kind('2026-10-29', '2026-11-01') === 'last-minute', 'lead 30 days → last-minute')
ok(kind('2026-10-30', '2026-11-02') === 'airbnb', 'lead 31 days → airbnb')
ok(kind('2026-09-29', '2026-09-30') === 'last-minute', 'check-in today → last-minute')

// Stay length first: 35 nights starting tomorrow
ok(kind('2026-09-30', '2026-11-04') === 'long-stay', '35 nights from tomorrow → long-stay')

// URLs
const far = bookingRoute('2027-03-05', '2027-03-08', 4, TODAY)
ok(far.ok && far.url === `${AIRBNB}?check_in=2027-03-05&check_out=2027-03-08&adults=4`, 'airbnb URL params')
ok(far.ok && far.nights === 3, 'nights counted')
const lm = bookingRoute('2026-10-02', '2026-10-04', 1, TODAY)
ok(WHIMSTAY_LISTING_URL === null, 'no Whimstay listing yet')
ok(lm.ok && lm.url === `${AIRBNB}?check_in=2026-10-02&check_out=2026-10-04&adults=1`, 'last-minute falls back to Airbnb while Whimstay is null')
const long = bookingRoute('2026-11-01', '2026-12-01', 6, TODAY)
ok(long.ok && long.url === '/rentals/availability?check_in=2026-11-01&check_out=2026-12-01&guests=6', 'long-stay → direct inquiry prefilled')
ok(far.ok && new URL(far.url).pathname === '/rooms/30045739', 'only the main listing')
ok(far.ok && !/vrbo/i.test(far.url), 'no VRBO')

// Invalid input rejected
ok(kind('2027-01-05', '2027-01-05') === 'error:check_out_must_follow_check_in', 'checkout == checkin rejected')
ok(kind('2027-01-05', '2027-01-04') === 'error:check_out_must_follow_check_in', 'checkout < checkin rejected')
ok(kind('2027-02-31', '2027-03-02') === 'error:invalid_date', 'rollover date rejected')
ok(kind('01/05/2027', '2027-01-08') === 'error:invalid_date', 'non-ISO date rejected')
ok(kind('2026-09-28', '2026-10-01') === 'error:check_in_in_past', 'past check-in rejected')
ok(kind('2027-01-01', '2027-01-03', 0) === 'error:guests_out_of_range', '0 guests rejected')
ok(kind('2027-01-01', '2027-01-03', 13) === 'error:guests_out_of_range', '13 guests rejected')

if (failed) {
  console.error(`FAIL bookingRoute: ${failed} failed, ${passed} passed`)
  process.exit(1)
}
console.log(`PASS bookingRoute: ${passed} checks`)
