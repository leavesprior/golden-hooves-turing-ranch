/**
 * Integration smoke for the direct-booking store + sync math.
 * Run: npx tsx scripts/test-availability-db.mts
 * Uses the /tmp sqlite fallback (no /data locally), so it's destructive-safe.
 */
import {
  dbReplaceSourceBlocks,
  dbGetSyncMeta,
  dbCreateInquiry,
  dbGetInquiries,
  dbCreateBooking,
  dbGetBookings,
  dbAddSubscriber,
  dbGetSubscribers,
  nightsBetween,
} from '../src/lib/availabilityDb'
import { getAvailabilityView } from '../src/lib/availabilitySync'

let failures = 0
function check(name: string, cond: boolean, detail = '') {
  if (cond) console.log(`  ok  - ${name}`)
  else { failures++; console.log(`  FAIL - ${name}${detail ? `  (${detail})` : ''}`) }
}

// --- availability: full-replace per source ---
dbReplaceSourceBlocks('airbnb', [
  { uid: 'a1', start_date: '2026-07-17', end_date: '2026-07-20', summary: 'Reserved' },
  { uid: 'a2', start_date: '2026-08-01', end_date: '2026-08-03', summary: 'Blocked' },
])
dbReplaceSourceBlocks('vrbo', [
  { uid: 'v1', start_date: '2026-07-25', end_date: '2026-07-27', summary: 'Reserved' },
])

let view = getAvailabilityView('2026-07-01', '2026-08-31')
check('airbnb+vrbo merged', view.blocked_nights.includes('2026-07-17') && view.blocked_nights.includes('2026-07-25'))
check('exclusive checkout open', !view.blocked_nights.includes('2026-07-20'))
check('two sources reported', view.sources.length === 2, JSON.stringify(view.sources.map(s => s.source)))

// Re-sync airbnb with a freed date — full-replace must drop the old block.
dbReplaceSourceBlocks('airbnb', [
  { uid: 'a1', start_date: '2026-07-17', end_date: '2026-07-20', summary: 'Reserved' },
])
view = getAvailabilityView('2026-07-01', '2026-08-31')
check('freed date drops on re-sync', !view.blocked_nights.includes('2026-08-01'))
check('vrbo untouched by airbnb re-sync', view.blocked_nights.includes('2026-07-25'))

const meta = dbGetSyncMeta().find(m => m.source === 'airbnb')
check('sync meta has timestamp', !!meta?.last_synced_at, JSON.stringify(meta))

// --- inquiries ---
const inq = dbCreateInquiry({ name: 'Jane', email: 'jane@example.com', phone: null, check_in: '2026-09-01', check_out: '2026-09-05', guests: 8, message: 'Is Labor Day open?' })
check('inquiry created with id', !!inq.id && inq.status === 'new')
check('inquiry listed', dbGetInquiries('new').some(i => i.id === inq.id))

// --- bookings (nights auto-derived) ---
const bk = dbCreateBooking({ inquiry_id: inq.id, name: 'Jane', email: 'jane@example.com', phone: null, check_in: '2026-09-01', check_out: '2026-09-05', guests: 8, quote_total: 1600, deposit_amount: 400, deposit_method: 'qr', source: 'direct' })
check('booking nights derived = 4', bk.nights === 4, String(bk.nights))
check('booking listed', dbGetBookings().some(b => b.id === bk.id))

// --- subscribers (idempotent by email) ---
const s1 = dbAddSubscriber('Test@Example.com ', 'squeeze')
const s2 = dbAddSubscriber('test@example.com', 'giveaway')
check('subscriber email normalized', s1.email === 'test@example.com')
check('subscriber dedup by email', s1.id === s2.id)
check('subscriber listed', dbGetSubscribers().some(s => s.email === 'test@example.com'))

check('nightsBetween helper', nightsBetween('2026-07-17', '2026-07-20') === 3)

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
