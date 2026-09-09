/**
 * Ranch guest book — read the names already on the table, and sign.
 * Stamps the L2 cabin_guest_book pin on first open. Local persist only.
 */

export const GUEST_BOOK_KEY = 'bobr_l2_guest_book'
export const GUEST_BOOK_AREA_ID = 'cabin_guest_book'

export type GuestBookLine = {
  id: string
  name: string
  note: string
  player?: boolean
}

export const GUEST_BOOK_HOST: GuestBookLine = {
  id: 'host_cynthia',
  name: 'Cynthia',
  note: 'The house is yours to enjoy, while you are visiting us.',
}

export const GUEST_BOOK_CANON: readonly GuestBookLine[] = [
  GUEST_BOOK_HOST,
  {
    id: 'host_greg',
    name: 'Greg',
    note: 'We paid cash as we went. Fifty dollars of lumber, a load of gravel, one fence post at a time. The ridge remembers the work.',
  },
  {
    id: 'quiet_lamp',
    name: 'Cynthia',
    note: 'After the last lamp the house sleeps. No pipes on the porch. Leave the inner latch and the night-door unkeyed so nobody meets the dark outside.',
  },
  {
    id: 'porch_dog',
    name: 'Cynthia',
    note: 'A dog on the porch is a neighbor here. The house is yours while you visit. Park to the left walk; if you come after dark, the lamps will be lit.',
  },
  {
    id: 'oaks',
    name: 'A neighbor from the oaks',
    note: 'We still walk this ridge. The post is a door, not a wall.',
  },
  {
    id: 'muleteer',
    name: 'A muleteer',
    note: 'Carson named it West Point in ’44. Water holds. So do we.',
  },
  {
    id: 'false_name',
    name: 'J. Smith',
    note: 'A quiet night. Names in this book are cheaper than faces.',
  },
]

type StorageLike = { getItem(k: string): string | null; setItem?(k: string, v: string): void }

function parsePlayerLines(raw: string | null): GuestBookLine[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw)
    if (!Array.isArray(v)) return []
    return v.filter((row): row is GuestBookLine =>
      !!row && typeof row.id === 'string' && typeof row.name === 'string' && typeof row.note === 'string',
    )
  } catch {
    return []
  }
}

export function readGuestBookPlayerLines(storage?: StorageLike | null): GuestBookLine[] {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  return parsePlayerLines(s?.getItem(GUEST_BOOK_KEY) ?? null)
}

export function writeGuestBookPlayerLines(
  lines: GuestBookLine[],
  storage?: StorageLike | null,
): GuestBookLine[] {
  const s = storage ?? (typeof window !== 'undefined' ? window.localStorage : null)
  const next = lines.filter((row) => row.name.trim() && row.note.trim())
  try { s?.setItem?.(GUEST_BOOK_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  return next
}

export function guestBookPages(storage?: StorageLike | null): GuestBookLine[] {
  return [...GUEST_BOOK_CANON, ...readGuestBookPlayerLines(storage)]
}

export function signGuestBook(
  name: string,
  note: string,
  storage?: StorageLike | null,
): GuestBookLine | null {
  const n = name.trim()
  const t = note.trim()
  if (!n || !t) return null
  const line: GuestBookLine = {
    id: `player_${Date.now()}`,
    name: n.slice(0, 48),
    note: t.slice(0, 180),
    player: true,
  }
  writeGuestBookPlayerLines([...readGuestBookPlayerLines(storage), line], storage)
  return line
}
