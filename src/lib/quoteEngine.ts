/**
 * Direct-booking quote engine — pure pricing logic.
 *
 * Listing 30045739 is West Point, unincorporated Calaveras — not Alpine /
 * Bear Valley. Live Airbnb checkout (2026-09-11/12) is the fee source of
 * truth: extra-guest $38/night after 4, cleaning ~$130, pet $269/stay.
 * Calaveras TOT is 12% of occupancy (nights + extra + cleaning + pet).
 *
 * Nightly rates here are a local default only. Confirm against live Airbnb
 * checkout for the same dates before sending a quote to a guest. Do not
 * auto-apply weekly / book-early discounts — those would undercut Airbnb.
 *
 * Pure function — no DB reads, no env access, no side effects.
 */

export const DEFAULT_BASE_NIGHTLY = 395;
export const EXTRA_GUEST_THRESHOLD = 4; // 5th guest and beyond pay extra
export const EXTRA_GUEST_FEE = 38;
export const CALAVERAS_TOT_RATE = 0.12;
export const DEFAULT_CLEANING_FEE = 130;
export const PET_FEE_PER_STAY = 269;
export const FLOOR_NIGHTLY = 300;
export const MAX_GUESTS = 12;
export const MAX_PETS = 4;

/** Premium-window override schedule. Each entry overrides the default nightly. */
interface PremiumWindow {
  name: string;
  start: string;        // YYYY-MM-DD inclusive
  end: string;          // YYYY-MM-DD exclusive (RFC 5545 DTEND-style)
  base: number;         // weekday nightly
  weekendBump: number;  // additional on Fri/Sat
  minNights: number;
}

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
  pets: number;
  per_night: QuoteLine[];
  subtotal_gross: number;          // room + extra-guest, before cleaning/pet/TOT
  discounts: QuoteLine[];          // always empty — parity with live Airbnb
  subtotal_after_discounts: number;
  occupancy_subtotal: number;      // TOT base: nights+extra+cleaning+pet
  tot: number;
  cleaning_fee: number;
  pet_fee: number;
  total: number;
  warnings: string[];
  meta: {
    base_nightly_default: number;
    extra_guest_fee_per_night: number;
    tot_rate: number;
    tot_jurisdiction: 'Calaveras County';
    floor_nightly: number;
    advance_days: number;
    nightly_is_default: boolean;
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
  pets?: number;
  advance_days?: number;
  cleaning_fee?: number;
  nightly?: number;                // override default/window nightly for every night
  now?: Date;
}

export function quote(input: QuoteInput): QuoteResult | QuoteError {
  const nights = nightsBetween(input.check_in, input.check_out);
  if (nights <= 0) {
    return { ok: false, reason: 'check_out must be after check_in' };
  }
  if (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > MAX_GUESTS) {
    return { ok: false, reason: 'guests must be 1..12' };
  }
  const pets = input.pets ?? 0;
  if (!Number.isInteger(pets) || pets < 0 || pets > MAX_PETS) {
    return { ok: false, reason: 'pets must be 0..4' };
  }
  if (input.nightly !== undefined && !(Number.isFinite(input.nightly) && input.nightly > 0)) {
    return { ok: false, reason: 'nightly must be a positive number' };
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

  const extraGuests = Math.max(0, input.guests - EXTRA_GUEST_THRESHOLD);
  const extraGuestNightly = extraGuests * EXTRA_GUEST_FEE;
  const perNight: QuoteLine[] = [];
  const warnings: string[] = [];
  let roomSubtotal = 0;
  const nightlyIsDefault = input.nightly === undefined;

  for (let i = 0; i < nights; i++) {
    const iso = isoOnly(new Date(isoToDate(input.check_in).getTime() + i * 86_400_000));
    const win = lookupWindow(iso);
    let nightly: number;
    let label: string;

    if (input.nightly !== undefined) {
      nightly = input.nightly;
      label = `${iso} — confirmed nightly`;
    } else if (win) {
      nightly = win.base + (isFriOrSat(iso) ? win.weekendBump : 0);
      label = `${iso} — ${win.name}${isFriOrSat(iso) ? ' (Fri/Sat)' : ''}`;
    } else {
      nightly = DEFAULT_BASE_NIGHTLY;
      label = `${iso} — default nightly (confirm on Airbnb)`;
    }

    const total = nightly + extraGuestNightly;
    perNight.push({
      label,
      amount: total,
      detail: extraGuests > 0
        ? `${nightly} base + ${extraGuestNightly} extra-guest (${extraGuests} × ${EXTRA_GUEST_FEE})`
        : undefined,
    });
    roomSubtotal += nightly;
  }

  const extraGuestTotal = extraGuestNightly * nights;
  const subtotalGross = roomSubtotal + extraGuestTotal;
  const discounts: QuoteLine[] = [];
  const subtotalAfterDiscounts = subtotalGross;

  const effectiveNightly = subtotalAfterDiscounts / nights;
  if (effectiveNightly < FLOOR_NIGHTLY) {
    warnings.push(
      `Effective nightly ${effectiveNightly.toFixed(2)} is below floor ${FLOOR_NIGHTLY} — host review required`,
    );
  }

  const checkInWindow = lookupWindow(input.check_in);
  if (checkInWindow && nights < checkInWindow.minNights) {
    warnings.push(
      `${checkInWindow.name} requires ${checkInWindow.minNights}-night minimum; this stay is ${nights}`,
    );
  }

  if (nightlyIsDefault) {
    warnings.push(
      'Nightly is a local default. Confirm against live Airbnb checkout for these dates before sending this quote.',
    );
  }

  const cleaningFee = input.cleaning_fee ?? DEFAULT_CLEANING_FEE;
  if (!(Number.isFinite(cleaningFee) && cleaningFee >= 0)) {
    return { ok: false, reason: 'cleaning_fee must be >= 0' };
  }
  const petFee = pets * PET_FEE_PER_STAY;
  const occupancySubtotal = subtotalAfterDiscounts + cleaningFee + petFee;
  const tot = occupancySubtotal * CALAVERAS_TOT_RATE;
  const total = occupancySubtotal + tot;

  return {
    ok: true,
    nights,
    guests: input.guests,
    pets,
    per_night: perNight,
    subtotal_gross: round2(subtotalGross),
    discounts,
    subtotal_after_discounts: round2(subtotalAfterDiscounts),
    occupancy_subtotal: round2(occupancySubtotal),
    tot: round2(tot),
    cleaning_fee: round2(cleaningFee),
    pet_fee: round2(petFee),
    total: round2(total),
    warnings,
    meta: {
      base_nightly_default: DEFAULT_BASE_NIGHTLY,
      extra_guest_fee_per_night: extraGuestNightly,
      tot_rate: CALAVERAS_TOT_RATE,
      tot_jurisdiction: 'Calaveras County',
      floor_nightly: FLOOR_NIGHTLY,
      advance_days: advanceDays,
      nightly_is_default: nightlyIsDefault,
    },
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
