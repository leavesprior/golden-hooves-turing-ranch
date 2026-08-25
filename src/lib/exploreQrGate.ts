/**
 * /explore is the ranch-house playable area — not a public menu.
 * The physical QR at the ranch house opens /explore?qr=ranch-house.
 * GPS on: nearby town NPCs (gpsProximity) only speak when the player is there.
 */

export const EXPLORE_QR_TOKEN = 'ranch-house'
export const EXPLORE_QR_STORAGE = 'bobr_explore_qr'
export const EXPLORE_QR_PATH = `/explore?qr=${EXPLORE_QR_TOKEN}`
export const EXPLORE_QR_PUBLIC_URL = `https://backofbeyondranch.farm${EXPLORE_QR_PATH}`

export type StorageLike = { getItem(key: string): string | null; setItem?(key: string, value: string): void }

export function tokenFromSearch(search: string): string {
  try {
    const raw = search.startsWith('?') ? search.slice(1) : search
    const q = new URLSearchParams(raw)
    return (q.get('qr') || q.get('gate') || '').trim()
  } catch {
    return ''
  }
}

export function cookieHasExploreQr(cookieHeader?: string | null): boolean {
  if (!cookieHeader) return false
  return new RegExp(`(?:^|;\\s*)${EXPLORE_QR_STORAGE}=${EXPLORE_QR_TOKEN}(?:;|$)`).test(cookieHeader)
}

export function persistExploreQr(storage?: StorageLike | null): void {
  try { storage?.setItem?.(EXPLORE_QR_STORAGE, EXPLORE_QR_TOKEN) } catch { /* ignore */ }
  if (typeof document !== 'undefined') {
    try {
      document.cookie = `${EXPLORE_QR_STORAGE}=${EXPLORE_QR_TOKEN}; Path=/; SameSite=Lax`
    } catch { /* ignore */ }
  }
}

export function hasExploreQr(input: {
  search?: string
  storage?: StorageLike | null
  cookie?: string | null
} = {}): boolean {
  const storage = input.storage ?? (typeof window !== 'undefined' ? window.sessionStorage : null)
  const raw = input.search ?? (typeof window !== 'undefined' ? window.location.search : '')
  const cookie = input.cookie ?? (typeof document !== 'undefined' ? document.cookie : '')

  if (tokenFromSearch(raw) === EXPLORE_QR_TOKEN) {
    persistExploreQr(storage)
    return true
  }
  try {
    if (storage?.getItem(EXPLORE_QR_STORAGE) === EXPLORE_QR_TOKEN) return true
  } catch { /* ignore */ }
  return cookieHasExploreQr(cookie)
}
