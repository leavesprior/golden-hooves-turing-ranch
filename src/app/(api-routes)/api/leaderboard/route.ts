import { NextRequest, NextResponse } from 'next/server'
import { clientIpFrom, rateLimitOk, verifyScoreClaim } from '@/lib/markerSession'

/**
 * Leaderboard API Route - Notion Database Proxy
 *
 * GET /api/leaderboard?limit=50&filter=all|week|month
 *   Queries Notion DB sorted by Score descending
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
 * Keeps Notion API token server-side. Graceful degradation when unconfigured.
 */

const NOTION_API_KEY = process.env.NOTION_API_KEY || ''
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || ''
const NOTION_API_VERSION = '2022-06-28'
const NOTION_BASE = 'https://api.notion.com/v1'
const FETCH_TIMEOUT = 8000

interface NotionPage {
  id: string
  properties: Record<string, unknown>
}

function notionHeaders() {
  return {
    'Authorization': `Bearer ${NOTION_API_KEY}`,
    'Notion-Version': NOTION_API_VERSION,
    'Content-Type': 'application/json',
  }
}

function extractText(prop: unknown): string {
  if (!prop || typeof prop !== 'object') return ''
  const p = prop as Record<string, unknown>
  if (p.type === 'title' && Array.isArray(p.title)) {
    return (p.title as Array<{ plain_text?: string }>).map(t => t.plain_text || '').join('')
  }
  if (p.type === 'rich_text' && Array.isArray(p.rich_text)) {
    return (p.rich_text as Array<{ plain_text?: string }>).map(t => t.plain_text || '').join('')
  }
  if (p.type === 'select' && p.select && typeof p.select === 'object') {
    return (p.select as { name?: string }).name || ''
  }
  if (p.type === 'date' && p.date && typeof p.date === 'object') {
    return (p.date as { start?: string }).start || ''
  }
  return ''
}

function extractNumber(prop: unknown): number {
  if (!prop || typeof prop !== 'object') return 0
  const p = prop as { type?: string; number?: number }
  if (p.type === 'number') return p.number ?? 0
  return 0
}

function extractCheckbox(prop: unknown): boolean {
  if (!prop || typeof prop !== 'object') return false
  const p = prop as { type?: string; checkbox?: boolean }
  if (p.type === 'checkbox') return p.checkbox ?? false
  return false
}

function extractMultiSelect(prop: unknown): string[] {
  if (!prop || typeof prop !== 'object') return []
  const p = prop as { type?: string; multi_select?: Array<{ name: string }> }
  if (p.type === 'multi_select' && Array.isArray(p.multi_select)) {
    return p.multi_select.map(s => s.name)
  }
  return []
}

function pageToEntry(page: NotionPage) {
  const props = page.properties
  return {
    playerName: extractText(props.Name),
    playerId: extractText(props.PlayerId),
    score: extractNumber(props.Score),
    trophyCount: extractNumber(props.TrophyCount),
    trophies: extractMultiSelect(props.Trophies),
    chapter: extractNumber(props.Chapter),
    level: extractNumber(props.Level),
    alignment: extractText(props.Alignment),
    topFaction: extractText(props.TopFaction),
    timeEchoes: extractNumber(props.TimeEchoes),
    isNPC: extractCheckbox(props.IsNPC),
    submittedAt: extractText(props.SubmittedAt),
  }
}

async function notionFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
  try {
    const resp = await fetch(url, {
      ...options,
      headers: { ...notionHeaders(), ...(options.headers || {}) },
      signal: controller.signal,
    })
    return resp
  } finally {
    clearTimeout(timeout)
  }
}

// GET /api/leaderboard
export async function GET(request: NextRequest) {
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    return NextResponse.json({ entries: [], source: 'unavailable' })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
  const filter = searchParams.get('filter') || 'all'

  try {
    // Build Notion query — only return leaderboard entries (not game saves)
    const queryBody: Record<string, unknown> = {
      sorts: [{ property: 'Score', direction: 'descending' }],
      page_size: limit,
    }

    // Base filter: only leaderboard entries
    const leaderboardFilter = {
      property: 'SaveType',
      select: { equals: 'leaderboard' },
    }

    // Time filter
    if (filter === 'week' || filter === 'month') {
      const daysAgo = filter === 'week' ? 7 : 30
      const since = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      queryBody.filter = {
        and: [
          leaderboardFilter,
          {
            property: 'SubmittedAt',
            date: { on_or_after: since.toISOString().split('T')[0] },
          },
        ],
      }
    } else {
      queryBody.filter = leaderboardFilter
    }

    const response = await notionFetch(`${NOTION_BASE}/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      body: JSON.stringify(queryBody),
    })

    if (!response.ok) {
      console.error('Notion query failed:', response.status, await response.text())
      return NextResponse.json({ entries: [], source: 'error' })
    }

    const data = await response.json()
    const entries = (data.results as NotionPage[]).map(pageToEntry)

    return NextResponse.json({ entries, source: 'notion' })
  } catch (err) {
    console.error('Leaderboard GET error:', err)
    return NextResponse.json({ entries: [], source: 'error' })
  }
}

// POST /api/leaderboard
export async function POST(request: NextRequest) {
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    return NextResponse.json(
      { action: 'skipped', reason: 'Notion not configured' },
      { status: 200 }
    )
  }

  try {
    const body = await request.json()
    const {
      playerName, playerId, score, trophies, chapter, level,
      alignment, saddleStats, topFaction, timeEchoes, milestonesCount,
      claimToken, game,
    } = body

    if (!playerName || !playerId || typeof score !== 'number') {
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
    //   HACKER (999999999) and NEOMA_AUDIT_FORGE — purge manually from the Notion
    //   leaderboard DB (filter by Name or PlayerId). They were created via direct
    //   unauthenticated POST before this guard landed.
    const MAX_PLAUSIBLE_SCORE = 100000; // generous; real play max is far lower
    if (score > MAX_PLAUSIBLE_SCORE) {
      return NextResponse.json(
        { error: 'Score exceeds plausible maximum for current game content' },
        { status: 400 }
      );
    }

    const ip = clientIpFrom(request.headers);
    if (!rateLimitOk(ip)) {
      return NextResponse.json(
        { error: 'Rate limited — too many submissions from this IP. Slow down.' },
        { status: 429 }
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

    // Dedup: check if player already exists
    const existingResp = await notionFetch(`${NOTION_BASE}/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      body: JSON.stringify({
        filter: {
          property: 'PlayerId',
          rich_text: { equals: playerId },
        },
        page_size: 1,
      }),
    })

    if (!existingResp.ok) {
      return NextResponse.json({ action: 'skipped', reason: 'Notion query failed' }, { status: 502 })
    }

    const existingData = await existingResp.json()
    const existingPages = existingData.results as NotionPage[]

    // Build Notion properties
    const properties: Record<string, unknown> = {
      Name: { title: [{ text: { content: playerName } }] },
      PlayerId: { rich_text: [{ text: { content: playerId } }] },
      Score: { number: score },
      TrophyCount: { number: Array.isArray(trophies) ? trophies.length : 0 },
      Chapter: { number: chapter || 0 },
      Level: { number: level || 1 },
      IsNPC: { checkbox: false },
      SubmittedAt: { date: { start: new Date().toISOString() } },
      SaveType: { select: { name: 'leaderboard' } },
    }

    if (Array.isArray(trophies) && trophies.length > 0) {
      properties.Trophies = {
        multi_select: trophies.map((t: string) => ({ name: t })),
      }
    }
    if (alignment) {
      properties.Alignment = { select: { name: alignment } }
    }
    if (topFaction) {
      properties.TopFaction = { select: { name: topFaction } }
    }
    if (typeof timeEchoes === 'number') {
      properties.TimeEchoes = { number: timeEchoes }
    }
    if (typeof milestonesCount === 'number') {
      properties.MilestonesCount = { number: milestonesCount }
    }
    if (saddleStats) {
      properties.SaddleStats = {
        rich_text: [{ text: { content: JSON.stringify(saddleStats) } }],
      }
    }

    if (existingPages.length > 0) {
      // Update only if new score is higher
      const existingScore = extractNumber(existingPages[0].properties.Score)
      if (score <= existingScore) {
        return NextResponse.json({ action: 'skipped', reason: 'Existing score is higher or equal' })
      }

      await notionFetch(`${NOTION_BASE}/pages/${existingPages[0].id}`, {
        method: 'PATCH',
        body: JSON.stringify({ properties }),
      })
      return NextResponse.json({ action: 'updated' })
    }

    // Create new entry
    await notionFetch(`${NOTION_BASE}/pages`, {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: NOTION_DATABASE_ID },
        properties,
      }),
    })
    return NextResponse.json({ action: 'created' })
  } catch (err) {
    console.error('Leaderboard POST error:', err)
    return NextResponse.json({ action: 'skipped', reason: 'Server error' }, { status: 500 })
  }
}
