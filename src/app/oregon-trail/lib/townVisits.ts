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
/** Last (landmark, arrivalDay) we incremented for. Survives remount / Strict Mode. */
const LAST_KEY = 'bobr_town_visit_last'

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

function arrivalStamp(townName: string, arrivalDay: number): string {
  return `${townName}@${arrivalDay}`
}

function readLastStamp(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(LAST_KEY)
  } catch {
    return null
  }
}

function writeLastStamp(stamp: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(LAST_KEY, stamp)
  } catch {
    // Same degrade as the ledger write — arrival still renders.
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

export interface TownArrivalRecord {
  /** Count before this arrival (what getVisitTier expects). */
  prior: number
  /** False when this (landmark, arrivalDay) was already counted. */
  recorded: boolean
}

/**
 * Record an arrival once per (town, arrivalDay). TownScreen remounts whenever
 * the player opens Journal / Investigate / Map (those are sibling phases, not
 * overlays), and React Strict Mode remounts in dev. Both used to increment
 * again because lastLoggedLandmarkRef died with the component.
 *
 * Re-arriving on a later day still counts — the stamp includes arrivalDay.
 */
export function recordTownArrival(townName: string, arrivalDay: number): TownArrivalRecord {
  const stamp = arrivalStamp(townName, arrivalDay)
  if (readLastStamp() === stamp) {
    const count = read()[townName] ?? 0
    return { prior: Math.max(0, count - 1), recorded: false }
  }
  const prior = recordTownVisit(townName)
  writeLastStamp(stamp)
  return { prior, recorded: true }
}

/** Total distinct towns this family has set foot in. */
export function getTownsVisitedCount(): number {
  return Object.keys(read()).length
}
