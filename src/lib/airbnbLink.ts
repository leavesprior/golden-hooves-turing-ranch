/**
 * Airbnb booking link with UTM tracking.
 * Traffic source visible in Airbnb host analytics.
 */
export function airbnbBookingLink(source: string, campaign: string = 'may2026'): string {
  const base = 'https://airbnb.com/h/backofbeyondranch';
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: 'social',
    utm_campaign: campaign,
  });
  return `${base}?${params.toString()}`;
}

export const AIRBNB_BOOKING_BASE = 'https://airbnb.com/h/backofbeyondranch';
