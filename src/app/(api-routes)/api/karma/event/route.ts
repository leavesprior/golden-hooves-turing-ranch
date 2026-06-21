import { NextRequest, NextResponse } from 'next/server';
import { dbAppendKarmaEvent, type KarmaType } from '@/lib/discountCodesDb';
import { rateLimitOk, clientIpFrom, signBalance } from '@/lib/markerSession';

export const runtime = 'nodejs';

const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const KARMA_TYPES = new Set<KarmaType>(['good', 'neutral', 'bad']);

// Phase 0 (2026-06-19): persist an IN-GAME karma earn/spend event to the
// server-authoritative ledger. This is the UNVERIFIED in-game path (Leif's model:
// in-game karma proceeds without human-presence verification). The server still
// owns the write — it coerces the delta to an int, tags the source, and is the
// only thing that appends to the hash-chained ledger. The 3 BOUNDARY operations
// (convert ±↔neutral, neutral>1000, karma onto another person) are NOT handled
// here — those require the Frank/QSD presence gate and are Grok-gated.
//
// Idempotent on eventId so a retried/offline-replayed POST is a no-op.
const MAX_DELTA = 10000; // sanity clamp; in-game earns are small

export async function POST(req: NextRequest) {
  const ip = clientIpFrom(req.headers);
  if (!rateLimitOk(ip)) {
    return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 });
  }

  let body: { sessionId?: string; eventId?: string; karmaType?: string; delta?: number; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 });
  }

  const { sessionId, eventId, karmaType, delta, source } = body;
  if (!sessionId || !SESSION_ID_PATTERN.test(sessionId)) {
    return NextResponse.json({ ok: false, reason: 'invalid_session' }, { status: 400 });
  }
  if (!karmaType || !KARMA_TYPES.has(karmaType as KarmaType)) {
    return NextResponse.json({ ok: false, reason: 'invalid_karma_type' }, { status: 400 });
  }
  if (typeof delta !== 'number' || !Number.isFinite(delta)) {
    return NextResponse.json({ ok: false, reason: 'invalid_delta' }, { status: 400 });
  }
  if (!eventId || !SESSION_ID_PATTERN.test(eventId)) {
    return NextResponse.json({ ok: false, reason: 'invalid_event_id' }, { status: 400 });
  }

  // Server-owned delta: int, clamped. (In-game is unverified but still server-written.)
  const finalDelta = Math.max(-MAX_DELTA, Math.min(MAX_DELTA, Math.trunc(delta)));
  const safeSource = `game:${String(source ?? 'ingame').slice(0, 40).replace(/[^a-zA-Z0-9_:-]/g, '')}`;

  const balance = dbAppendKarmaEvent({
    eventId,
    sessionId,
    karmaType: karmaType as KarmaType,
    delta: finalDelta,
    source: safeSource,
  });

  const asOf = new Date().toISOString();
  const payload = `${sessionId}:${balance.good}:${balance.neutral}:${balance.bad}:${asOf}`;
  const sig = signBalance(payload);

  return NextResponse.json(
    { ok: true, eventId, sessionId, balance, asOf, sig },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
