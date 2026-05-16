import { NextRequest, NextResponse } from 'next/server';
import { dbRecordMarkerProgress } from '@/lib/discountCodesDb';
import { getLocationsForDifficulty } from '@/lib/locations';

export const runtime = 'nodejs';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES = new Set<Difficulty>(['easy', 'medium', 'hard']);
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && DIFFICULTIES.has(value as Difficulty);
}

function isAllowedMarker(markerSlug: string, difficulty: Difficulty): boolean {
  return getLocationsForDifficulty(difficulty).some(location => location.slug === markerSlug);
}

export async function POST(req: NextRequest) {
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

  if (!isAllowedMarker(markerSlug, body.difficulty)) {
    return NextResponse.json({ ok: false, reason: 'invalid_marker' }, { status: 400 });
  }

  const result = dbRecordMarkerProgress({ sessionId, markerSlug });

  return NextResponse.json({
    ok: true,
    markerCount: result.markerCount,
    markerSlug,
    recordedAt: result.marker.recorded_at,
  });
}
