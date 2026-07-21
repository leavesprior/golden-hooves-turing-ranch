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
    coords?: unknown
    verified?: unknown
    clientTs?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 })
  }

  const { sessionId, nodeId, coords, verified, clientTs } = body
  if (typeof sessionId !== 'string' || !SESSION_ID_PATTERN.test(sessionId)) {
    return NextResponse.json({ ok: false, reason: 'invalid_session' }, { status: 400 })
  }
  if (typeof nodeId !== 'string' || !NODE_ID_PATTERN.test(nodeId)) {
    return NextResponse.json({ ok: false, reason: 'invalid_node_id' }, { status: 400 })
  }
  if (typeof verified !== 'boolean') {
    return NextResponse.json({ ok: false, reason: 'invalid_verified' }, { status: 400 })
  }

  // coords: null (remote variant) or { lat, lng, accuracyM? } with finite numbers
  let safeCoords: { lat: number; lng: number; accuracyM?: number } | null = null
  if (coords !== null && coords !== undefined) {
    const c = coords as { lat?: unknown; lng?: unknown; accuracyM?: unknown }
    if (
      typeof c.lat !== 'number' || !Number.isFinite(c.lat) || Math.abs(c.lat) > 90 ||
      typeof c.lng !== 'number' || !Number.isFinite(c.lng) || Math.abs(c.lng) > 180
    ) {
      return NextResponse.json({ ok: false, reason: 'invalid_coords' }, { status: 400 })
    }
    safeCoords = { lat: c.lat, lng: c.lng }
    if (typeof c.accuracyM === 'number' && Number.isFinite(c.accuracyM) && c.accuracyM >= 0) {
      safeCoords.accuracyM = c.accuracyM
    }
  }

  const record = {
    receivedAt: new Date().toISOString(),
    sessionId,
    nodeId,
    coords: safeCoords,
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
