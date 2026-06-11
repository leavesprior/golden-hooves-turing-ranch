/**
 * Direct-booking quote engine — pure pricing logic.
 *
 * Canonical source: BOBR v4 plan §8.2 + advertising plan 2026-06-02 + execution
 * audit 2026-05-28.
 *
 * Inputs: check_in, check_out, guests. Output: line-itemed total with TOT.
 *
 * Order of operations (conservative — discounts apply to gross, TOT applies to
 * discounted subtotal, cleaning is added last):
 *   1. base nightly = premium-window override OR default median ($395)
 *   2. weekend bump (Fri/Sat in premium windows: Bear Valley $560 → $600)
 *   3. extra-guest fee: $25/guest/night for guest 7+
 *   4. gross = sum(per-night base + extra-guest) over [check_in, check_out)
 *   5. − 25% weekly discount if nights ≥ 7
 *   6. − 8% Book-Early-Stay-Long if nights ≥ 7 AND advance_days ≥ 60 AND
 *        check-in falls in a shoulder month
 *   7. + Alpine County 14% TOT on the discounted subtotal (v4 + ca-str-legal)
 *   8. + cleaning fee (config; default 0 until Leif sets)
 *
 * Pure function — no DB reads, no env access, no side effects.
 */

const DEFAULT_BASE_NIGHTLY = 395;
const EXTRA_GUEST_THRESHOLD = 6;     // 7th and beyond pay extra
const EXTRA_GUEST_FEE = 25;
const WEEKLY_DISCOUNT_THRESHOLD = 7; // nights
const WEEKLY_DISCOUNT_RATE = 0.25;
const BOOK_EARLY_THRESHOLD_DAYS = 60;
const BOOK_EARLY_RATE = 0.08;
const ALPINE_TOT_RATE = 0.14;        // Alpine County Measure G, eff. 2025-01-01
const FLOOR_NIGHTLY = 300;           // per v4 §3 floor-discipline guard

// Shoulder months for Book-Early-Stay-Long eligibility. Conservative: only
// confirmed soft months. Excludes Bear Valley window and major holidays.
const SHOULDER_MONTHS = new Set([4, 5, 9, 10, 11]); // Apr, May, Sep, Oct, Nov

/** Premium-window override schedule. Each entry overrides the default nightly. */
interface PremiumWindow {
  name: string;
  start: string;        // YYYY-MM-DD inclusive
  end: string;          // YYYY-MM-DD exclusive (RFC 5545 DTEND-style)
  base: number;         // weekday nightly
  weekendBump: number;  // additional on Fri/Sat
  minNights: number;
}

// Canonical v4/v5 premium windows. Extend as Leif sets new events.
export const PREMIUM_WINDOWS: PremiumWindow[] = [
  {
    name: 'Bear Valley Music Festival',
    start: '2026-07-17',
    end: '2026-08-03',
    base: 560,
    weekendBump: 40, // → $600 Fri/Sat
    minNights: 3,
  },
  {
    name: 'July 4',
    start: '2026-07-02',
    end: '2026-07-06',
    base: 520,
    weekendBump: 0,
    minNights: 3,
  },
];

function isoToDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function isoOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dayOfWeekUtc(iso: string): number {
  return isoToDate(iso).getUTCDay(); // 0=Sun, 5=Fri, 6=Sat
}

function isFriOrSat(iso: string): boolean {
  const dow = dayOfWeekUtc(iso);
  return dow === 5 || dow === 6;
}

function lookupWindow(iso: string): PremiumWindow | null {
  for (const w of PREMIUM_WINDOWS) {
    if (iso >= w.start && iso < w.end) return w;
  }
  return null;
}

/** Whole nights between two YYYY-MM-DD dates (UTC, DST-safe). */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = Date.parse(`${checkIn}T00:00:00Z`);
  const b = Date.parse(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export interface QuoteLine {
  label: string;
  amount: number;
  detail?: string;
}

export interface QuoteResult {
  ok: true;
  nights: number;
  guests: number;
  per_night: QuoteLine[];          // one entry per night, for the breakdown
  subtotal_gross: number;          // sum of per_night before discounts
  discounts: QuoteLine[];          // weekly + book-early
  subtotal_after_discounts: number;
  tot: number;
  cleaning_fee: number;
  total: number;
  warnings: string[];              // floor-discipline + min-night flags
  meta: {
    base_nightly_default: number;
    extra_guest_fee_per_night: number;
    alpine_tot_rate: number;
    floor_nightly: number;
    advance_days: number;
    is_shoulder_checkin: boolean;
  };
}

export interface QuoteError {
  ok: false;
  reason: string;
}

export interface QuoteInput {
  check_in: string;
  check_out: string;
  guests: number;
  advance_days?: number;           // override if provided; else derived from now()
  cleaning_fee?: number;
  now?: Date;                      // for deterministic tests; defaults to new Date()
}

export function quote(input: QuoteInput): QuoteResult | QuoteError {
  const nights = nightsBetween(input.check_in, input.check_out);
  if (nights <= 0) {
    return { ok: false, reason: 'check_out must be after check_in' };
  }
  if (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > 12) {
    return { ok: false, reason: 'guests must be 1..12' };
  }

  const now = input.now ?? new Date();
  const advanceDays =
    input.advance_days ??
    Math.max(
      0,
      Math.round(
        (Date.parse(`${input.check_in}T00:00:00Z`) - now.getTime()) / 86_400_000,
      ),
    );

  const checkInMonth = isoToDate(input.check_in).getUTCMonth() + 1;
  const isShoulderCheckin = SHOULDER_MONTHS.has(checkInMonth);

  // Walk each night, building line items.
  const extraGuests = Math.max(0, input.guests - EXTRA_GUEST_THRESHOLD);
  const extraGuestNightly = extraGuests * EXTRA_GUEST_FEE;
  const perNight: QuoteLine[] = [];
  const warnings: string[] = [];
  let subtotalGross = 0;

  for (let i = 0; i < nights; i++) {
    const iso = isoOnly(new Date(isoToDate(input.check_in).getTime() + i * 86_400_000));
    const win = lookupWindow(iso);
    let nightly: number;
    let label: string;

    if (win) {
      nightly = win.base + (isFriOrSat(iso) ? win.weekendBump : 0);
      label = `${iso} — ${win.name}${isFriOrSat(iso) ? ' (Fri/Sat)' : ''}`;
    } else {
      nightly = DEFAULT_BASE_NIGHTLY;
      label = `${iso} — base rate`;
    }

    const total = nightly + extraGuestNightly;
    perNight.push({
      label,
      amount: total,
      detail: extraGuests > 0
        ? `${nightly} base + ${extraGuestNightly} extra-guest (${extraGuests} × ${EXTRA_GUEST_FEE})`
        : undefined,
    });
    subtotalGross += total;
  }

  // Discounts.
  const discounts: QuoteLine[] = [];
  let weeklyAmount = 0;
  if (nights >= WEEKLY_DISCOUNT_THRESHOLD) {
    weeklyAmount = subtotalGross * WEEKLY_DISCOUNT_RATE;
    discounts.push({
      label: '25% weekly discount',
      amount: -weeklyAmount,
      detail: `nights ≥ ${WEEKLY_DISCOUNT_THRESHOLD}`,
    });
  }

  let earlyAmount = 0;
  if (
    nights >= WEEKLY_DISCOUNT_THRESHOLD &&
    advanceDays >= BOOK_EARLY_THRESHOLD_DAYS &&
    isShoulderCheckin
  ) {
    earlyAmount = (subtotalGross - weeklyAmount) * BOOK_EARLY_RATE;
    discounts.push({
      label: '8% Book Early Stay Long',
      amount: -earlyAmount,
      detail: `≥${BOOK_EARLY_THRESHOLD_DAYS}d advance, ≥${WEEKLY_DISCOUNT_THRESHOLD} nights, shoulder-month check-in`,
    });
  }

  const subtotalAfterDiscounts = subtotalGross - weeklyAmount - earlyAmount;

  // Floor-discipline warning (worst-case stacked nightly).
  const effectiveNightly = subtotalAfterDiscounts / nights;
  if (effectiveNightly < FLOOR_NIGHTLY) {
    warnings.push(
      `Effective nightly ${effectiveNightly.toFixed(2)} is below floor ${FLOOR_NIGHTLY} — v4 §3 conflict; host review required`,
    );
  }

  // Per-window min-night flag.
  const checkInWindow = lookupWindow(input.check_in);
  if (checkInWindow && nights < checkInWindow.minNights) {
    warnings.push(
      `${checkInWindow.name} requires ${checkInWindow.minNights}-night minimum; this stay is ${nights}`,
    );
  }

  const tot = subtotalAfterDiscounts * ALPINE_TOT_RATE;
  const cleaningFee = input.cleaning_fee ?? 0;
  const total = subtotalAfterDiscounts + tot + cleaningFee;

  return {
    ok: true,
    nights,
    guests: input.guests,
    per_night: perNight,
    subtotal_gross: round2(subtotalGross),
    discounts: discounts.map(d => ({ ...d, amount: round2(d.amount) })),
    subtotal_after_discounts: round2(subtotalAfterDiscounts),
    tot: round2(tot),
    cleaning_fee: round2(cleaningFee),
    total: round2(total),
    warnings,
    meta: {
      base_nightly_default: DEFAULT_BASE_NIGHTLY,
      extra_guest_fee_per_night: extraGuestNightly,
      alpine_tot_rate: ALPINE_TOT_RATE,
      floor_nightly: FLOOR_NIGHTLY,
      advance_days: advanceDays,
      is_shoulder_checkin: isShoulderCheckin,
    },
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
