/**
 * Airbnb booking link with UTM tracking.
 * Traffic source visible in Airbnb host analytics.
 */
export function airbnbBookingLink(source: string, campaign: string = 'site'): string {
  const base = 'https://airbnb.com/h/backofbeyondranch';
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: 'website',
    utm_campaign: campaign,
  });
  return `${base}?${params.toString()}`;
}

export const AIRBNB_BOOKING_BASE = 'https://airbnb.com/h/backofbeyondranch';

/**
 * Retreat listing (Hot Tub Forest Retreat | Couples & Small Groups) — a
 * separate Airbnb listing for parties of 2–6, calendar-linked to the whole
 * ranch so the two never double-book. Overridable via env at deploy time.
 */
export const AIRBNB_RETREAT_BASE =
  process.env.NEXT_PUBLIC_RETREAT_AIRBNB_URL ||
  'https://www.airbnb.com/rooms/946605153900209514';

export function airbnbRetreatLink(source: string, campaign: string = 'jul2026'): string {
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: 'social',
    utm_campaign: campaign,
  });
  const sep = AIRBNB_RETREAT_BASE.includes('?') ? '&' : '?';
  return `${AIRBNB_RETREAT_BASE}${sep}${params.toString()}`;
}
