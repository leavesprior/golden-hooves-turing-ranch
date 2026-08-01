/**
 * Town visit ledger — the memory behind "living towns that remember you".
 *
 * TOWN_ARRIVALS (data/townArrivals.ts) has authored first / return / familiar /
 * regular lines for every landmark, but nothing was counting visits, so the whole
 * table sat unreachable. This is that counter: one small machine, one job.
 *
 * Deliberately localStorage rather than a new OregonTrailState field — it needs to
 * persist across a resetGame() (the Passing / heir carries the world forward, and
 * a town should remember the family even when the character changes).
 */

const KEY = 'bobr_town_visits'

type VisitLedger = Record<string, number>

function read(): VisitLedger {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as VisitLedger) : {}
  } catch {
    return {}
  }
}

/** How many times this town has been arrived at BEFORE now. 0 on first arrival. */
export function getTownVisitCount(townName: string): number {
  return read()[townName] ?? 0
}

/**
 * Record an arrival. Returns the count as it was *before* this visit, which is
 * what getVisitTier() expects (0 => 'first').
 */
export function recordTownVisit(townName: string): number {
  if (typeof window === 'undefined') return 0
  const ledger = read()
  const prior = ledger[townName] ?? 0
  ledger[townName] = prior + 1
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ledger))
  } catch {
    // Storage full or blocked — the arrival line still renders, we just can't
    // remember it next time. Degrade quietly rather than break the arrival.
  }
  return prior
}

/** Total distinct towns this family has set foot in. */
export function getTownsVisitedCount(): number {
  return Object.keys(read()).length
}
