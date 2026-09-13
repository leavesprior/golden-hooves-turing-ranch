/**
 * Quote-engine regression: Calaveras 12% TOT, extra $38 after 4, cleaning $130,
 * pet $269, no weekly slash, no Alpine 14%.
 *
 *   node_modules/.bin/tsx src/lib/quoteEngine.test.ts
 */

import assert from 'node:assert/strict'
import {
  quote,
  nightsBetween,
  CALAVERAS_TOT_RATE,
  EXTRA_GUEST_THRESHOLD,
  EXTRA_GUEST_FEE,
  DEFAULT_CLEANING_FEE,
  PET_FEE_PER_STAY,
  DEFAULT_BASE_NIGHTLY,
} from './quoteEngine'

const NOW = new Date('2026-09-01T12:00:00Z')

function mustOk(input: Parameters<typeof quote>[0]) {
  const q = quote({ ...input, now: NOW })
  assert.equal(q.ok, true, JSON.stringify(q))
  if (!q.ok) throw new Error('unreachable')
  return q
}

{
  assert.equal(nightsBetween('2026-09-21', '2026-09-23'), 2)
  assert.equal(nightsBetween('2026-09-21', '2026-09-21'), 0)
  assert.equal(CALAVERAS_TOT_RATE, 0.12)
  assert.equal(EXTRA_GUEST_THRESHOLD, 4)
  assert.equal(EXTRA_GUEST_FEE, 38)
  assert.equal(DEFAULT_CLEANING_FEE, 130)
  assert.equal(PET_FEE_PER_STAY, 269)
}

{
  const q = mustOk({ check_in: '2026-09-21', check_out: '2026-09-23', guests: 4 })
  assert.equal(q.nights, 2)
  assert.equal(q.subtotal_gross, 790) // 395 * 2
  assert.equal(q.discounts.length, 0)
  assert.equal(q.cleaning_fee, 130)
  assert.equal(q.pet_fee, 0)
  assert.equal(q.occupancy_subtotal, 920)
  assert.equal(q.tot, 110.4)
  assert.equal(q.total, 1030.4)
  assert.equal(q.meta.tot_rate, 0.12)
  assert.equal(q.meta.tot_jurisdiction, 'Calaveras County')
  assert.equal(q.meta.nightly_is_default, true)
  assert.ok(q.warnings.some(w => /Airbnb checkout/i.test(w)))
}

{
  const four = mustOk({ check_in: '2026-09-21', check_out: '2026-09-23', guests: 4 })
  const six = mustOk({ check_in: '2026-09-21', check_out: '2026-09-23', guests: 6 })
  const eight = mustOk({ check_in: '2026-09-21', check_out: '2026-09-23', guests: 8 })
  // Extra occupancy: $38 × extras × nights. 4→6 is 2 extras × 2 nights = 152.
  assert.equal(six.occupancy_subtotal - four.occupancy_subtotal, 152)
  assert.equal(eight.occupancy_subtotal - six.occupancy_subtotal, 152)
  assert.equal(six.subtotal_gross - four.subtotal_gross, 152)
  assert.equal(six.tot, 128.64)
  assert.equal(eight.tot, 146.88)
}

{
  // 10 guests × 6 nights @ $400 confirmed nightly, no pet.
  // room 2400 + extra 6×38×6=1368 + cleaning 130 = 3898; TOT 467.76
  const q = mustOk({
    check_in: '2026-10-01',
    check_out: '2026-10-07',
    guests: 10,
    nightly: 400,
  })
  assert.equal(q.nights, 6)
  assert.equal(q.subtotal_gross, 3768)
  assert.equal(q.cleaning_fee, 130)
  assert.equal(q.occupancy_subtotal, 3898)
  assert.equal(q.tot, 467.76)
  assert.equal(q.total, 4365.76)
  assert.equal(q.meta.nightly_is_default, false)
  assert.ok(!q.warnings.some(w => /Airbnb checkout/i.test(w)))
}

{
  const q = mustOk({
    check_in: '2026-09-21',
    check_out: '2026-09-23',
    guests: 4,
    pets: 1,
    nightly: 400,
  })
  assert.equal(q.pet_fee, 269)
  assert.equal(q.occupancy_subtotal, 1199) // 800 + 130 + 269
  assert.equal(q.tot, 143.88)
  assert.equal(q.total, 1342.88)
}

{
  // Seven nights must NOT apply the old 25% weekly slash.
  const q = mustOk({
    check_in: '2026-10-01',
    check_out: '2026-10-08',
    guests: 4,
    nightly: 400,
  })
  assert.equal(q.nights, 7)
  assert.equal(q.discounts.length, 0)
  assert.equal(q.subtotal_gross, 2800)
  assert.equal(q.occupancy_subtotal, 2930)
  assert.equal(q.tot, 351.6)
}

{
  const bad = quote({ check_in: '2026-09-21', check_out: '2026-09-21', guests: 2, now: NOW })
  assert.equal(bad.ok, false)
  const over = quote({ check_in: '2026-09-21', check_out: '2026-09-23', guests: 13, now: NOW })
  assert.equal(over.ok, false)
  const pet = quote({ check_in: '2026-09-21', check_out: '2026-09-23', guests: 2, pets: 5, now: NOW })
  assert.equal(pet.ok, false)
}

{
  // Alpine 14% / extra-after-6 / cleaning-0 must not be reconstructable.
  const q = mustOk({ check_in: '2026-09-21', check_out: '2026-09-23', guests: 6, nightly: 400 })
  assert.notEqual(q.meta.tot_rate, 0.14)
  assert.equal(q.cleaning_fee, 130)
  // 6 guests under the OLD engine paid $0 extra (threshold 6). Now 2 extras.
  assert.equal(q.meta.extra_guest_fee_per_night, 76)
  const alpineLie = q.occupancy_subtotal * 0.14
  assert.notEqual(q.tot, Math.round(alpineLie * 100) / 100)
}

void DEFAULT_BASE_NIGHTLY

console.log('quoteEngine.test.ts: all passed')
