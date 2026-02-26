/**
 * BOBR Analytics - Lightweight Privacy-Respecting Event Tracker
 *
 * All data stays in localStorage — no external services, no tracking pixels.
 * Events are batched in 'bobr_analytics' and capped at 1000 entries (FIFO).
 * Session IDs live in sessionStorage so each browser tab gets its own session.
 */

const STORAGE_KEY = 'bobr_analytics'
const SESSION_KEY = 'bobr_analytics_session_id'
const MAX_EVENTS = 1000

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TrackedEvent {
  category: string
  action: string
  label?: string
  value?: number
  timestamp: number
  sessionId: string
}

export interface EventSummary {
  totalEvents: number
  countsByCategory: Record<string, number>
  mostPopularGames: { game: string; count: number }[]
  completionRates: { game: string; starts: number; completes: number; rate: number }[]
}

export interface SessionStats {
  totalEvents: number
  uniqueSessions: number
  avgSessionDuration: number   // milliseconds
  topCategories: { category: string; count: number }[]
  conversionFunnel: {
    page_view: number
    game_start: number
    chapter_complete: number
    booking_click: number
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

function getSessionId(): string {
  if (typeof sessionStorage === 'undefined') return 'ssr'
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function loadEvents(): TrackedEvent[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as TrackedEvent[]) : []
  } catch {
    return []
  }
}

function saveEvents(events: TrackedEvent[]): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch {
    // Storage may be full; silently ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core tracking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Record a single analytics event.
 * Events are stored locally, FIFO-evicted above 1000 entries.
 */
export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number,
): void {
  if (typeof window === 'undefined') return   // SSR guard

  const event: TrackedEvent = {
    category,
    action,
    label,
    value,
    timestamp: Date.now(),
    sessionId: getSessionId(),
  }

  const events = loadEvents()
  events.push(event)

  // FIFO eviction — keep the newest MAX_EVENTS
  const trimmed = events.length > MAX_EVENTS ? events.slice(events.length - MAX_EVENTS) : events
  saveEvents(trimmed)
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience functions
// ─────────────────────────────────────────────────────────────────────────────

export function trackGameStart(game: 'adventure' | 'oregon-trail' | 'explore' | 'clue-game'): void {
  trackEvent('game', 'game_start', game)
}

export function trackChapterComplete(game: string, chapter: string, duration_ms: number): void {
  trackEvent('game', 'chapter_complete', `${game}:${chapter}`, duration_ms)
}

export function trackMysteryAttempt(mysteryId: string, correct: boolean): void {
  trackEvent('mystery', correct ? 'deduction_correct' : 'deduction_wrong', mysteryId, correct ? 1 : 0)
}

export function trackEncounterResult(encounterId: string, outcome: string): void {
  trackEvent('encounter', outcome, encounterId)
}

export function trackBookingClick(source: string): void {
  trackEvent('conversion', 'booking_click', source)
}

export function trackPageView(path: string): void {
  trackEvent('navigation', 'page_view', path)
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics query functions
// ─────────────────────────────────────────────────────────────────────────────

/** Returns a high-level summary: counts by category, popular games, completion rates. */
export function getEventSummary(): EventSummary {
  const events = loadEvents()

  const countsByCategory: Record<string, number> = {}
  const gameStarts: Record<string, number> = {}
  const gameCompletes: Record<string, number> = {}

  for (const e of events) {
    countsByCategory[e.category] = (countsByCategory[e.category] ?? 0) + 1

    if (e.action === 'game_start' && e.label) {
      gameStarts[e.label] = (gameStarts[e.label] ?? 0) + 1
    }
    if (e.action === 'chapter_complete' && e.label) {
      const game = e.label.split(':')[0]
      gameCompletes[game] = (gameCompletes[game] ?? 0) + 1
    }
  }

  const mostPopularGames = Object.entries(gameStarts)
    .map(([game, count]) => ({ game, count }))
    .sort((a, b) => b.count - a.count)

  const completionRates = Object.keys(gameStarts).map((game) => {
    const starts = gameStarts[game] ?? 0
    const completes = gameCompletes[game] ?? 0
    return { game, starts, completes, rate: starts > 0 ? completes / starts : 0 }
  })

  return { totalEvents: events.length, countsByCategory, mostPopularGames, completionRates }
}

/** Returns all events belonging to a given category. */
export function getEventsByCategory(category: string): TrackedEvent[] {
  return loadEvents().filter((e) => e.category === category)
}

/** Returns aggregate stats across all stored sessions. */
export function getSessionStats(): SessionStats {
  const events = loadEvents()

  // Group events by session
  const sessionMap: Record<string, TrackedEvent[]> = {}
  for (const e of events) {
    if (!sessionMap[e.sessionId]) sessionMap[e.sessionId] = []
    sessionMap[e.sessionId].push(e)
  }

  const sessions = Object.values(sessionMap)
  const uniqueSessions = sessions.length

  // Average session duration = mean of (last ts - first ts) per session
  let totalDuration = 0
  for (const ses of sessions) {
    if (ses.length < 2) continue
    const sorted = ses.map((e) => e.timestamp).sort((a, b) => a - b)
    totalDuration += sorted[sorted.length - 1] - sorted[0]
  }
  const avgSessionDuration = uniqueSessions > 0 ? totalDuration / uniqueSessions : 0

  // Top categories
  const catCount: Record<string, number> = {}
  for (const e of events) {
    catCount[e.category] = (catCount[e.category] ?? 0) + 1
  }
  const topCategories = Object.entries(catCount)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Conversion funnel — count specific action types
  const conversionFunnel = {
    page_view: 0,
    game_start: 0,
    chapter_complete: 0,
    booking_click: 0,
  }
  for (const e of events) {
    if (e.action === 'page_view') conversionFunnel.page_view++
    if (e.action === 'game_start') conversionFunnel.game_start++
    if (e.action === 'chapter_complete') conversionFunnel.chapter_complete++
    if (e.action === 'booking_click') conversionFunnel.booking_click++
  }

  return {
    totalEvents: events.length,
    uniqueSessions,
    avgSessionDuration,
    topCategories,
    conversionFunnel,
  }
}

/** Wipe all stored analytics events. */
export function clearEvents(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
