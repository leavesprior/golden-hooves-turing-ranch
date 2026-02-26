'use client'

/**
 * BOBR Analytics Debug Panel
 *
 * Rendered only when the URL includes ?debug=analytics.
 * Styled with the existing pixel/retro theme (dark bg, gold/blue accents,
 * monospace font). Collapsible, positioned fixed bottom-right so it never
 * blocks game content.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getEventSummary,
  getSessionStats,
  clearEvents,
  type TrackedEvent,
  type SessionStats,
  type EventSummary,
} from '@/lib/eventTracker'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const m = Math.floor(ms / 60_000)
  const s = Math.round((ms % 60_000) / 1000)
  return `${m}m ${s}s`
}

function formatTs(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function loadRecentEvents(n = 20): TrackedEvent[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem('bobr_analytics')
    if (!raw) return []
    const all = JSON.parse(raw) as TrackedEvent[]
    return all.slice(-n).reverse()
  } catch {
    return []
  }
}

function exportJSON(summary: EventSummary, stats: SessionStats, recent: TrackedEvent[]): void {
  const blob = new Blob(
    [JSON.stringify({ summary, stats, recentEvents: recent }, null, 2)],
    { type: 'application/json' },
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bobr-analytics-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function CategoryBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="mb-1">
      <div className="flex justify-between mb-0.5" style={{ fontFamily: 'monospace', fontSize: 10 }}>
        <span style={{ color: 'var(--pixel-ui-text)' }}>{label}</span>
        <span style={{ color: 'var(--pixel-gold-light)' }}>{count}</span>
      </div>
      <div style={{ height: 6, background: 'var(--pixel-bg-dark)', border: '1px solid var(--pixel-ui-border)' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'var(--pixel-ui-border)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}

function FunnelRow({ label, value, prev }: { label: string; value: number; prev?: number }) {
  const drop = prev !== undefined && prev > 0 ? Math.round(((prev - value) / prev) * 100) : null
  return (
    <div
      className="flex justify-between items-center py-0.5"
      style={{ fontFamily: 'monospace', fontSize: 10, borderBottom: '1px solid rgba(65,166,246,0.15)' }}
    >
      <span style={{ color: 'var(--pixel-ui-text)' }}>{label}</span>
      <span style={{ color: 'var(--pixel-gold-light)' }}>
        {value}
        {drop !== null && (
          <span style={{ color: drop > 50 ? '#b13e53' : '#a4d23d', marginLeft: 4 }}>
            ({drop}% drop)
          </span>
        )}
      </span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────────────────────

export default function AnalyticsPanel() {
  const [visible, setVisible] = useState(false)
  const [open, setOpen] = useState(true)
  const [summary, setSummary] = useState<EventSummary | null>(null)
  const [stats, setStats] = useState<SessionStats | null>(null)
  const [recent, setRecent] = useState<TrackedEvent[]>([])

  // Only activate when ?debug=analytics is in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('debug') === 'analytics') setVisible(true)
  }, [])

  const refresh = useCallback(() => {
    setSummary(getEventSummary())
    setStats(getSessionStats())
    setRecent(loadRecentEvents(20))
  }, [])

  useEffect(() => {
    if (!visible) return
    refresh()
    // Re-read every 3s so new events from the page show up automatically
    const id = setInterval(refresh, 3000)
    return () => clearInterval(id)
  }, [visible, refresh])

  if (!visible) return null

  const maxCat = stats ? Math.max(...stats.topCategories.map((c) => c.count), 1) : 1
  const funnel = stats?.conversionFunnel

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        width: open ? 340 : 'auto',
        maxHeight: open ? '80vh' : 'auto',
        background: 'var(--pixel-bg-dark)',
        border: '2px solid var(--pixel-ui-border)',
        boxShadow: '0 0 20px rgba(65,166,246,0.3)',
        fontFamily: 'monospace',
        fontSize: 11,
        color: 'var(--pixel-ui-text)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '6px 10px',
          background: 'var(--pixel-ui-bg)',
          borderBottom: open ? '2px solid var(--pixel-ui-border)' : 'none',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ color: 'var(--pixel-gold-light)', fontWeight: 'bold', fontSize: 11 }}>
          [BOBR ANALYTICS]
        </span>
        <span style={{ color: 'var(--pixel-ui-text)', fontSize: 10 }}>
          {stats ? `${stats.totalEvents} events` : '...'} {open ? '[-]' : '[+]'}
        </span>
      </div>

      {open && summary && stats && (
        <div style={{ overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Session overview */}
          <section>
            <div style={{ color: 'var(--pixel-gold-mid)', marginBottom: 4, fontSize: 10, letterSpacing: 1 }}>
              SESSION STATS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
              {[
                ['Total events', stats.totalEvents],
                ['Sessions', stats.uniqueSessions],
                ['Avg duration', formatDuration(stats.avgSessionDuration)],
                ['Games started', stats.conversionFunnel.game_start],
              ].map(([label, val]) => (
                <div key={String(label)} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(65,166,246,0.1)', padding: '1px 0' }}>
                  <span style={{ color: 'var(--pixel-ui-text)' }}>{label}</span>
                  <span style={{ color: 'var(--pixel-gold-light)' }}>{val}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Top categories */}
          {stats.topCategories.length > 0 && (
            <section>
              <div style={{ color: 'var(--pixel-gold-mid)', marginBottom: 4, fontSize: 10, letterSpacing: 1 }}>
                TOP CATEGORIES
              </div>
              {stats.topCategories.map((c) => (
                <CategoryBar key={c.category} label={c.category} count={c.count} max={maxCat} />
              ))}
            </section>
          )}

          {/* Conversion funnel */}
          {funnel && (
            <section>
              <div style={{ color: 'var(--pixel-gold-mid)', marginBottom: 4, fontSize: 10, letterSpacing: 1 }}>
                CONVERSION FUNNEL
              </div>
              <FunnelRow label="page_view" value={funnel.page_view} />
              <FunnelRow label="game_start" value={funnel.game_start} prev={funnel.page_view} />
              <FunnelRow label="chapter_complete" value={funnel.chapter_complete} prev={funnel.game_start} />
              <FunnelRow label="booking_click" value={funnel.booking_click} prev={funnel.page_view} />
            </section>
          )}

          {/* Most popular games */}
          {summary.mostPopularGames.length > 0 && (
            <section>
              <div style={{ color: 'var(--pixel-gold-mid)', marginBottom: 4, fontSize: 10, letterSpacing: 1 }}>
                GAME STARTS
              </div>
              {summary.mostPopularGames.map((g) => (
                <div
                  key={g.game}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid rgba(65,166,246,0.1)' }}
                >
                  <span>{g.game}</span>
                  <span style={{ color: 'var(--pixel-gold-light)' }}>{g.count}</span>
                </div>
              ))}
            </section>
          )}

          {/* Completion rates */}
          {summary.completionRates.some((r) => r.starts > 0) && (
            <section>
              <div style={{ color: 'var(--pixel-gold-mid)', marginBottom: 4, fontSize: 10, letterSpacing: 1 }}>
                COMPLETION RATES
              </div>
              {summary.completionRates.filter((r) => r.starts > 0).map((r) => (
                <div
                  key={r.game}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0', borderBottom: '1px solid rgba(65,166,246,0.1)' }}
                >
                  <span>{r.game}</span>
                  <span style={{ color: r.rate > 0.5 ? '#a4d23d' : r.rate > 0.2 ? 'var(--pixel-gold-light)' : '#b13e53' }}>
                    {r.completes}/{r.starts} ({Math.round(r.rate * 100)}%)
                  </span>
                </div>
              ))}
            </section>
          )}

          {/* Recent events */}
          {recent.length > 0 && (
            <section>
              <div style={{ color: 'var(--pixel-gold-mid)', marginBottom: 4, fontSize: 10, letterSpacing: 1 }}>
                RECENT EVENTS (last 20)
              </div>
              <div
                style={{
                  maxHeight: 160,
                  overflowY: 'auto',
                  background: 'var(--pixel-bg-mid)',
                  border: '1px solid rgba(65,166,246,0.2)',
                  padding: 4,
                }}
              >
                {recent.map((e, i) => (
                  <div
                    key={i}
                    style={{ padding: '1px 0', borderBottom: '1px solid rgba(65,166,246,0.08)', fontSize: 10 }}
                  >
                    <span style={{ color: 'rgba(192,203,220,0.5)', marginRight: 4 }}>{formatTs(e.timestamp)}</span>
                    <span style={{ color: 'var(--pixel-ui-border)' }}>{e.category}</span>
                    <span style={{ color: 'var(--pixel-ui-text)' }}>/{e.action}</span>
                    {e.label && (
                      <span style={{ color: 'var(--pixel-gold-light)', marginLeft: 4 }}>{e.label}</span>
                    )}
                    {e.value !== undefined && (
                      <span style={{ color: '#a4d23d', marginLeft: 4 }}>={e.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Action buttons */}
          <section style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={refresh}
              style={{
                flex: 1,
                padding: '4px 8px',
                background: 'var(--pixel-ui-bg)',
                border: '1px solid var(--pixel-ui-border)',
                color: 'var(--pixel-ui-text)',
                fontFamily: 'monospace',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
            <button
              onClick={() => exportJSON(summary, stats, recent)}
              style={{
                flex: 1,
                padding: '4px 8px',
                background: 'var(--pixel-ui-bg)',
                border: '1px solid var(--pixel-ui-border)',
                color: 'var(--pixel-gold-light)',
                fontFamily: 'monospace',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              Export JSON
            </button>
            <button
              onClick={() => {
                clearEvents()
                refresh()
              }}
              style={{
                flex: 1,
                padding: '4px 8px',
                background: 'rgba(177,62,83,0.3)',
                border: '1px solid #b13e53',
                color: '#b13e53',
                fontFamily: 'monospace',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          </section>

        </div>
      )}

      {/* Empty state */}
      {open && (!summary || !stats) && (
        <div style={{ padding: 12, color: 'rgba(192,203,220,0.5)', fontSize: 10, textAlign: 'center' }}>
          No events yet. Interact with the page to start tracking.
        </div>
      )}
    </div>
  )
}
