import { NextRequest, NextResponse } from 'next/server'
import { clientIpFrom, rateLimitOk, verifyScoreClaim } from '@/lib/markerSession'
import { listEntries, submitEntry } from '@/lib/leaderboardStore'
import { readBoundedJson } from '@/lib/boundedJson'

const MAX_BODY_BYTES = 16 * 1024

/**
 * Leaderboard API Route — Hall of Fame on the Railway /data volume
 *
 * GET /api/leaderboard?limit=50&filter=all|week|month
 *   Entries sorted by Score descending (leaderboardStore.ts)
 *
 * POST /api/leaderboard
 *   Creates/updates a player entry (dedup by PlayerId)
 *
 * Security (2026-06-16):
 *   - Ceiling (MAX_PLAUSIBLE_SCORE) + per-IP rate limit (re-uses markerSession
 *     token bucket, the same control that already protects marker rewards).
 *   - Optional claimToken: short-lived HMAC(score+playerId+game) issued by a
 *     trusted game completion path. See issueScoreClaim in markerSession.ts.
 *   - Direct unauth high-score POSTs (the 999999999 HACKER/NEOMA_AUDIT_FORGE
 *     injections) are now rejected at the API.
 *
 * Storage moved from Notion to SQLite on /data 2026-09-26: the Notion key was
 * absent in production (it was live around 2026-06), so GET answered
 * 'unavailable' and POST silently skipped every score.
 */


// GET /api/leaderboard
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const filter = searchParams.get('filter') || 'all'
  const since = filter === 'week' || filter === 'month'
    ? new Date(Date.now() - (filter === 'week' ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString()
    : undefined

  try {
    return NextResponse.json({ entries: listEntries(limit, since), source: 'server' })
  } catch (err) {
    console.error('Leaderboard GET error:', err)
    return NextResponse.json({ entries: [], source: 'error' }, { status: 503 })
  }
}

// POST /api/leaderboard
export async function POST(request: NextRequest) {
  try {
    // Rate limit and size cap BEFORE the body is read (council 20260926_141619).
    const ip = clientIpFrom(request.headers);
    if (!rateLimitOk(ip)) {
      return NextResponse.json(
        { error: 'Rate limited — too many submissions from this IP. Slow down.' },
        { status: 429 }
      );
    }
    const parsed = await readBoundedJson<Record<string, unknown>>(request, MAX_BODY_BYTES)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.reason === 'too_large' ? 'Submission too large' : 'Invalid request' }, { status: parsed.reason === 'too_large' ? 413 : 400 })
    }
    const body = parsed.value
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    const {
      playerName, playerId, score, trophies, chapter, level,
      alignment, saddleStats, topFaction, timeEchoes, milestonesCount,
      claimToken, game,
    } = body

    if (typeof playerName !== 'string' || !playerName || typeof playerId !== 'string' || !playerId || typeof score !== 'number' || !Number.isFinite(score) || score < 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // HIGH-1 FIX (2026-06-16): anti-forgery controls.
    // - Plausible ceiling: current content (Oregon/Adventure/WIT) cannot legitimately
    //   produce 8-9 digit scores. This kills the 999,999,999 curl attack.
    // - Per-IP rate limit reuses the proven token-bucket from markerSession (same
    //   primitive that already hardens the BOBR-EARLY marker path).
    // - claimToken (optional for now): when present must verify via the HMAC helper.
    //   Future: games call a record-run endpoint at end-of-run to obtain a claim
    //   for their exact final score, then forward it here. Full enforcement can
    //   flip to "claim required for score > X" without schema change.
    //
    // Test forgeries injected during audit (FULL_TEST_AUDIT_20260616):
    //   HACKER (999999999) and NEOMA_AUDIT_FORGE — they lived only in the old
    //   Notion DB; the /data store starts clean.
    const MAX_PLAUSIBLE_SCORE = 100000; // generous; real play max is far lower
    if (score > MAX_PLAUSIBLE_SCORE) {
      return NextResponse.json(
        { error: 'Score exceeds plausible maximum for current game content' },
        { status: 400 }
      );
    }

    // If a claimToken was supplied, verify it binds this exact player+score+game.
    // (Non-fatal for now; allows the existing leaderboard UI submit form to keep
    // working while games are updated to obtain claims.)
    if (claimToken && typeof claimToken === 'string') {
      const gameTag = (game as string) || 'bobr';
      if (!verifyScoreClaim(playerId, score, gameTag, claimToken)) {
        // Soft-fail the claim but still accept under the ceiling+rate umbrella
        // (upgrade to hard reject once all callers are migrated).
        console.warn('Leaderboard claimToken present but invalid for', playerId, score);
      }
    }

    const result = submitEntry({
      playerName, playerId, score, trophies, chapter, level,
      alignment, topFaction, timeEchoes, milestonesCount, saddleStats,
    })
    if (result.action === 'skipped' && (result.reason === 'Invalid player' || result.reason === 'Invalid score')) {
      return NextResponse.json({ error: result.reason }, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error('Leaderboard POST error:', err)
    return NextResponse.json({ action: 'skipped', reason: 'Server error' }, { status: 500 })
  }
}
