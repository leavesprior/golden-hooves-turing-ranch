import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

// Living Trail presence check-in (P1) — RECORD ONLY.
//
// ⚠️ This route validates payload shape and appends to a JSONL file. It grants
// nothing, gates nothing, and signs nothing. P2 makes this path AUTHORITATIVE
// (server-signed presence verdicts that the client must present to complete a
// node) BEFORE any real-money reward rides on Living Trail chains. Until then,
// treat these records as observational ground truth only.
//
// Storage follows the discountCodesDb pattern: Railway volume at /data when
// present, /tmp fallback for local dev.

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/
const NODE_ID_PATTERN = /^lt_[a-z0-9_]{1,64}$/

function getJsonlPath(): string {
  const volumePath = '/data'
  try {
    if (fs.existsSync(volumePath) && fs.statSync(volumePath).isDirectory()) {
      return path.join(volumePath, 'living_trail_checkins.jsonl')
    }
  } catch {
    // fall through
  }
  return path.join('/tmp', 'living_trail_checkins.jsonl')
}

export async function POST(req: NextRequest) {
  let body: {
    sessionId?: unknown
    nodeId?: unknown
    presence?: unknown
    verified?: unknown
    clientTs?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 })
  }

  const { sessionId, nodeId, presence, verified, clientTs } = body
  if (typeof sessionId !== 'string' || !SESSION_ID_PATTERN.test(sessionId)) {
    return NextResponse.json({ ok: false, reason: 'invalid_session' }, { status: 400 })
  }
  if (typeof nodeId !== 'string' || !NODE_ID_PATTERN.test(nodeId)) {
    return NextResponse.json({ ok: false, reason: 'invalid_node_id' }, { status: 400 })
  }
  if (typeof verified !== 'boolean') {
    return NextResponse.json({ ok: false, reason: 'invalid_verified' }, { status: 400 })
  }

  // Privacy: coordinates are never stored — an old client may still send them,
  // and they are dropped. Only distance-to-stop and GPS accuracy are recorded.
  let safePresence: { distanceM: number; accuracyM: number } | null = null
  if (presence !== null && presence !== undefined) {
    const p = presence as { distanceM?: unknown; accuracyM?: unknown }
    if (
      typeof p.distanceM !== 'number' || !Number.isFinite(p.distanceM) || p.distanceM < 0 || p.distanceM > 1e7 ||
      typeof p.accuracyM !== 'number' || !Number.isFinite(p.accuracyM) || p.accuracyM < 0 || p.accuracyM > 1e7
    ) {
      return NextResponse.json({ ok: false, reason: 'invalid_presence' }, { status: 400 })
    }
    safePresence = { distanceM: Math.round(p.distanceM), accuracyM: Math.round(p.accuracyM) }
  }

  const record = {
    receivedAt: new Date().toISOString(),
    sessionId,
    nodeId,
    presence: safePresence,
    verified,
    clientTs: typeof clientTs === 'number' && Number.isFinite(clientTs) ? clientTs : null,
  }

  try {
    fs.appendFileSync(getJsonlPath(), JSON.stringify(record) + '\n', 'utf8')
  } catch {
    return NextResponse.json({ ok: false, reason: 'storage_error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
