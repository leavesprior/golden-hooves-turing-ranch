/**
 * Standalone correctness test for the iCal parser — the Phase-1 keystone.
 * Run: npx tsx scripts/test-ical-parser.mts
 *
 * Covers the cases that actually bite with Airbnb/VRBO feeds:
 *   - RFC 5545 line folding (CRLF + leading space continues a line)
 *   - all-day VALUE=DATE events
 *   - EXCLUSIVE DTEND (checkout day is NOT a blocked night)
 *   - missing DTEND ⇒ single night
 *   - events partially outside the query window (clamping)
 *   - missing UID ⇒ synthesized, event still kept
 */
import { parseIcal, blockedNightsInWindow, addDays } from '../src/lib/ical'

let failures = 0
function check(name: string, cond: boolean, detail = '') {
  if (cond) {
    console.log(`  ok  - ${name}`)
  } else {
    failures++
    console.log(`  FAIL - ${name}${detail ? `  (${detail})` : ''}`)
  }
}

// A folded SUMMARY line (the "ailable" continues "Not av") mirrors Airbnb output.
const ICS = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//Airbnb Inc//Hosting Calendar//EN',
  'BEGIN:VEVENT',
  'DTEND;VALUE=DATE:20260720',
  'DTSTART;VALUE=DATE:20260717',
  'UID:abc123@airbnb.com',
  'SUMMARY:Airbnb (Not av',
  ' ailable)',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART;VALUE=DATE:20260801',
  'UID:noend@airbnb.com',
  'SUMMARY:Blocked',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART;VALUE=DATE:20260815',
  'DTEND;VALUE=DATE:20260818',
  'SUMMARY:Reserved',
  'END:VEVENT',
].join('\r\n')

const events = parseIcal(ICS)

check('parses 3 events', events.length === 3, `got ${events.length}`)

const e0 = events[0]
check('unfolds folded SUMMARY', e0.summary === 'Airbnb (Not available)', e0.summary)
check('DTSTART parsed to ISO', e0.start_date === '2026-07-17', e0.start_date)
check('DTEND parsed to ISO (exclusive)', e0.end_date === '2026-07-20', e0.end_date)

const e1 = events[1]
check('missing DTEND ⇒ +1 day', e1.end_date === '2026-08-02', e1.end_date)

const e2 = events[2]
check('missing UID synthesized', e2.uid === '2026-08-15_2026-08-18', e2.uid)

// Blocked nights for the first reservation: 17,18,19 — NOT 20 (checkout is open).
const nights = blockedNightsInWindow(events, '2026-07-01', '2026-07-31')
check('exclusive DTEND: 17/18/19 blocked', nights.join(',') === '2026-07-17,2026-07-18,2026-07-19', nights.join(','))
check('checkout day (20th) NOT blocked', !nights.includes('2026-07-20'))

// Window clamp: a reservation straddling the window edge only contributes the in-window nights.
const clamped = blockedNightsInWindow(
  [{ uid: 'x', start_date: '2026-07-28', end_date: '2026-08-03', summary: 'r' }],
  '2026-08-01',
  '2026-09-01',
)
check('clamps to window start', clamped[0] === '2026-08-01', clamped[0])
check('respects exclusive end inside window', !clamped.includes('2026-08-03') && clamped.includes('2026-08-02'), clamped.join(','))

check('addDays rolls month boundary', addDays('2026-07-31', 1) === '2026-08-01', addDays('2026-07-31', 1))

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
