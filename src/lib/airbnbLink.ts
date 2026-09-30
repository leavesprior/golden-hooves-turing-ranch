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

// The second listing (Hot Tub Forest Retreat, rooms/946605153900209514) was a
// duplicate made for an A/B test; Airbnb penalizes hosts for duplicates, so the
// site links only the one ranch listing (Leif 2026-09-30).
