import { NextRequest, NextResponse } from 'next/server';
import {
  dbRecordMarkerProgress,
  dbGetMarkerSession,
  dbCreateMarkerSession,
  dbTouchMarkerSession,
} from '@/lib/discountCodesDb';
import { getLocationsForDifficulty } from '@/lib/locations';
import {
  issueSessionToken,
  verifySessionToken,
  rateLimitOk,
  clientIpFrom,
  timingFloorRemainingMs,
} from '@/lib/markerSession';

export const runtime = 'nodejs';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES = new Set<Difficulty>(['easy', 'medium', 'hard']);
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const TOKEN_HEADER = 'x-marker-token';

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && DIFFICULTIES.has(value as Difficulty);
}

function isAllowedMarker(markerSlug: string, difficulty: Difficulty): boolean {
  return getLocationsForDifficulty(difficulty).some(location => location.slug === markerSlug);
}

export async function POST(req: NextRequest) {
  // NEW-09 control 3: per-IP rate limit. Caps how fast sessions/markers can be sprayed.
  const ip = clientIpFrom(req.headers);
  if (!rateLimitOk(ip)) {
    return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 });
  }

  let body: { sessionId?: string; markerSlug?: string; difficulty?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: 'invalid_json' }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : '';
  const markerSlug = typeof body.markerSlug === 'string' ? body.markerSlug.trim() : '';

  if (!SESSION_ID_PATTERN.test(sessionId)) {
    return NextResponse.json({ ok: false, reason: 'invalid_session_id' }, { status: 400 });
  }

  if (!isDifficulty(body.difficulty)) {
    return NextResponse.json({ ok: false, reason: 'invalid_difficulty' }, { status: 400 });
  }
  const difficulty = body.difficulty;

  if (!isAllowedMarker(markerSlug, difficulty)) {
    return NextResponse.json({ ok: false, reason: 'invalid_marker' }, { status: 400 });
  }

  const existingSession = dbGetMarkerSession(sessionId);

  if (!existingSession) {
    // First marker for this session. The server mints the token here — the client
    // can never present a valid token for a session it has not legitimately
    // started, so a forged sessionId always starts from zero progress and must
    // then walk the timing floor for every remaining marker.
    const sessionToken = issueSessionToken(sessionId, difficulty);
    dbCreateMarkerSession({ sessionId, difficulty, sessionToken });
    const result = dbRecordMarkerProgress({ sessionId, markerSlug });
    dbTouchMarkerSession(sessionId);

    const res = NextResponse.json({
      ok: true,
      markerCount: result.markerCount,
      markerSlug,
      recordedAt: result.marker.recorded_at,
      sessionToken,
    });
    res.headers.set('X-Marker-Token', sessionToken);
    return res;
  }

  // NEW-09 control 1: subsequent markers must present the server-issued token,
  // and the difficulty must match the one the session was created with.
  if (existingSession.difficulty !== difficulty) {
    return NextResponse.json({ ok: false, reason: 'difficulty_mismatch' }, { status: 400 });
  }
  const presentedToken = (req.headers.get(TOKEN_HEADER) || '').trim();
  if (!verifySessionToken(sessionId, difficulty, presentedToken)) {
    return NextResponse.json({ ok: false, reason: 'invalid_session_token' }, { status: 403 });
  }

  // NEW-09 control 2: timing floor. You cannot reach the next marker instantly.
  const remainingMs = timingFloorRemainingMs(existingSession.last_marker_at, Date.now());
  if (remainingMs > 0) {
    return NextResponse.json(
      { ok: false, reason: 'too_fast', retryAfterMs: remainingMs },
      { status: 429 },
    );
  }

  const result = dbRecordMarkerProgress({ sessionId, markerSlug });
  dbTouchMarkerSession(sessionId);

  return NextResponse.json({
    ok: true,
    markerCount: result.markerCount,
    markerSlug,
    recordedAt: result.marker.recorded_at,
  });
}
