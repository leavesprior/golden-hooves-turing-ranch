/** One discovery ledger for the single map. Trail, Gold Country, and GPS all write here. */

const KEY = 'bobr_one_map_discovered'

function memory(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch {
    return null
  }
}

const _mem = new Set<string>(['independence', 'bobr_ranch'])

export function readDiscovered(): string[] {
  const store = memory()
  if (!store) return Array.from(_mem)
  try {
    const raw = store.getItem(KEY)
    if (!raw) return ['independence', 'bobr_ranch']
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return ['independence', 'bobr_ranch']
    const ids = parsed.filter((x): x is string => typeof x === 'string')
    if (!ids.includes('independence')) ids.push('independence')
    return ids
  } catch {
    return ['independence', 'bobr_ranch']
  }
}

export function revealOnMap(id: string): string[] {
  const next = Array.from(new Set([...readDiscovered(), id]))
  _mem.clear()
  next.forEach((x) => _mem.add(x))
  const store = memory()
  if (store) {
    try { store.setItem(KEY, JSON.stringify(next)) } catch { /* quota */ }
  }
  return next
}

export function isDiscovered(id: string): boolean {
  return readDiscovered().includes(id)
}

export function metersBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const rad = (d: number) => (d * Math.PI) / 180
  const R = 6371000
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const lat1 = rad(a.lat)
  const lat2 = rad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)))
}
