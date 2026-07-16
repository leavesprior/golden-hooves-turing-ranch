import { NextRequest, NextResponse } from 'next/server'
import { PLAYER_ID_PATTERN } from '@/lib/dmDirectives'
import { enqueueDirectives, drainDirectives } from '../queueStore'

export const runtime = 'nodejs'

/**
 * DM directive queue (DM Layer P1) — record-then-drain over JSONL.
 *
 * GET  ?playerId=  → drains (returns + marks drained) all pending directives
 *                    for that player. Polled by the game client (useDmDirectives).
 * POST { playerId, directives } → appends validated directives. INTERNAL:
 *   the chat route enqueues via direct import (same process), so nothing in
 *   the product calls this over HTTP. It exists so hub-side tooling (and
 *   verification) can stage directives.
 *
 * ⚠️ P1 security posture, stated honestly: this surface is UNAUTHENTICATED.
 * That is acceptable ONLY because the deterministic validator caps every
 * effect at fiction-level (small supply grants, weather, one boss encounter,
 * per-class cooldowns) and NO directive class can mint karma or touch
 * anything real-money-adjacent. P2 LINE: any privileged or reward-bearing
 * directive class requires an authenticated, server-authoritative channel
 * FIRST (see design §8 dm-secure-channel-qsd — Grok-before).
 */

// ===================== RATE LIMITING (P1.5 hardening) =====================
// playerId is client-supplied, so per-player cooldowns can't stop an attacker
// rotating fresh ids to grow the shared JSONL. Bound the WRITE surface by
// caller identity instead: per-IP and global sliding-window limits on POST.
// Same trusted-proxy IP idiom as the chat route (x-real-ip honored; the
// client-settable x-forwarded-for only from a known reverse proxy), same
// in-memory Map + periodic sweep idiom as its ipStore.

const TRUSTED_PROXIES = new Set<string>(['127.0.0.1', '::1'])

function getClientIP(req: NextRequest): string {
  const socketIP = req.headers.get('x-real-ip') || 'unknown'
  if (TRUSTED_PROXIES.has(socketIP)) {
    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) return forwarded.split(',')[0].trim()
  }
  return socketIP
}

const RATE_WINDOW_MS = 60_000
const PER_IP_MAX_POSTS = 5
const GLOBAL_MAX_POSTS = 60
const SWEEP_INTERVAL_MS = 5 * 60_000

const globalPostTimes: number[] = []
const ipPostTimes = new Map<string, number[]>()
let lastSweep = 0

/** Sliding-window admission for one POST. Counts only admitted requests. */
function admitPost(ip: string): boolean {
  const now = Date.now()

  if (now - lastSweep > SWEEP_INTERVAL_MS) {
    lastSweep = now
    for (const [key, times] of ipPostTimes) {
      const fresh = times.filter(t => now - t < RATE_WINDOW_MS)
      if (fresh.length > 0) ipPostTimes.set(key, fresh)
      else ipPostTimes.delete(key)
    }
  }

  while (globalPostTimes.length > 0 && now - globalPostTimes[0] >= RATE_WINDOW_MS) {
    globalPostTimes.shift()
  }
  if (globalPostTimes.length >= GLOBAL_MAX_POSTS) return false

  const mine = (ipPostTimes.get(ip) ?? []).filter(t => now - t < RATE_WINDOW_MS)
  if (mine.length >= PER_IP_MAX_POSTS) {
    ipPostTimes.set(ip, mine)
    return false
  }

  mine.push(now)
  ipPostTimes.set(ip, mine)
  globalPostTimes.push(now)
  return true
}

export async function GET(req: NextRequest) {
  const playerId = req.nextUrl.searchParams.get('playerId') || ''
  if (!PLAYER_ID_PATTERN.test(playerId)) {
    return NextResponse.json({ ok: false, reason: 'invalid_player_id' }, { status: 400 })
  }
  const directives = drainDirectives(playerId)
  return NextResponse.json({ ok: true, directives })
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  if (!admitPost(ip)) {
    console.warn(`[dm-queue] 429 rate-limited POST from ${ip}`)
    return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 })
  }

  let body: { playerId?: unknown; directives?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 })
  }

  const { playerId, directives } = body
  if (typeof playerId !== 'string' || !PLAYER_ID_PATTERN.test(playerId)) {
    return NextResponse.json({ ok: false, reason: 'invalid_player_id' }, { status: 400 })
  }
  if (!Array.isArray(directives) || directives.length === 0 || directives.length > 10) {
    return NextResponse.json({ ok: false, reason: 'invalid_directives' }, { status: 400 })
  }

  const result = enqueueDirectives(playerId, directives)

  // Hard size cap breached and nothing got through → insufficient storage.
  if (result.enqueued.length === 0 && result.dropped.some(d => d.reason === 'queue_full')) {
    return NextResponse.json(
      { ok: false, reason: 'queue_full', dropped: result.dropped.map(d => d.reason) },
      { status: 507 },
    )
  }

  return NextResponse.json({
    ok: true,
    enqueued: result.enqueued.length,
    dropped: result.dropped.map(d => d.reason),
  })
}
