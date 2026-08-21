/**
 * Quiet guest-intent split: overnight EV + a bed vs walking Gold Country.
 * Face of the site stays education. Direct Airbnb only when the signal is charge-tonight.
 */

export type GuestIntent = 'charge_overnight' | 'explore' | 'unknown'

const CHARGE_KEYS = [
  'charge', 'charger', 'charging', 'ev', 'j1772', 'nacs',
  'plugshare', 'overnight', 'last-minute', 'lastminute', 'whimstay',
  'tonight', 'destination-charger',
]

const CHARGE_UTM = ['tesla', 'plugshare', 'whimstay', 'grok', 'x-tesla']

const EXPLORE_KEYS = [
  'explore', 'game', 'town', 'volcano', 'theatre', 'theater',
  'gold-country', 'diggings', 'trail', 'frog',
]

function haystack(input: {
  search?: string
  referrer?: string
  utmSource?: string
  need?: string
}): string {
  return [
    input.need,
    input.utmSource,
    input.referrer,
    input.search,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function hasAny(text: string, keys: string[]): boolean {
  return keys.some((k) => text.includes(k))
}

function paramsFromSearch(search?: string): URLSearchParams {
  if (!search) return new URLSearchParams()
  try {
    return new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
  } catch {
    return new URLSearchParams()
  }
}

/** Classify from URL search params + optional referrer. */
export function classifyGuestIntent(input: {
  search?: string
  referrer?: string
  utmSource?: string
  need?: string
}): GuestIntent {
  const q = paramsFromSearch(input.search)
  const need = (input.need || q.get('need') || q.get('intent') || '').toLowerCase()
  if (need === 'charge' || need === 'overnight' || need === 'ev') return 'charge_overnight'
  if (need === 'explore' || need === 'game') return 'explore'

  const utm = (input.utmSource || q.get('utm_source') || '').toLowerCase()
  if (CHARGE_UTM.includes(utm) && need !== 'explore') return 'charge_overnight'

  const text = haystack({
    ...input,
    utmSource: utm || undefined,
  })
  const charge = hasAny(text, CHARGE_KEYS)
  const explore = hasAny(text, EXPLORE_KEYS)
  if (charge && !explore) return 'charge_overnight'
  if (explore && !charge) return 'explore'
  return 'unknown'
}

export function airbnbChargeLink(): string {
  const params = new URLSearchParams({
    utm_source: 'stay-charge',
    utm_medium: 'intent',
    utm_campaign: 'ev-overnight',
  })
  return `https://airbnb.com/h/backofbeyondranch?${params.toString()}`
}
