import { NextRequest, NextResponse } from 'next/server';
import { syncAllFeeds, getAvailabilityView } from '@/lib/availabilitySync';
import { addDays } from '@/lib/ical';

/**
 * Direct-booking availability API (Phase 1).
 *
 * GET  /api/availability?start=YYYY-MM-DD&end=YYYY-MM-DD
 *   Public, read-only. Returns merged blocked nights for the window
 *   [start, end) across all sources. Defaults to [today, today+120d).
 *
 * POST /api/availability   (admin)
 *   Triggers a READ-ONLY pull of the configured Airbnb/VRBO iCal feeds into
 *   the local store. Requires the DIRECT_BOOKING_ADMIN_TOKEN bearer — if that
 *   env is unset the endpoint is 503 (not configured), matching the saves route.
 *
 * Nothing here writes back to any channel. Availability is import-only.
 */

export const dynamic = 'force-dynamic';

const ADMIN_TOKEN = process.env.DIRECT_BOOKING_ADMIN_TOKEN || '';
const MAX_WINDOW_DAYS = 400;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const t = Date.parse(`${s}T00:00:00Z`);
  return !Number.isNaN(t);
}

// GET /api/availability — public read
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start') || todayIso();
  let end = searchParams.get('end') || addDays(start, 120);

  if (!isValidDate(start) || !isValidDate(end)) {
    return NextResponse.json({ error: 'start/end must be YYYY-MM-DD' }, { status: 400 });
  }
  if (end <= start) {
    return NextResponse.json({ error: 'end must be after start' }, { status: 400 });
  }
  // Clamp pathological windows so a query can't scan the whole table.
  if (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)
      > MAX_WINDOW_DAYS * 86_400_000) {
    end = addDays(start, MAX_WINDOW_DAYS);
  }

  try {
    const view = getAvailabilityView(start, end);
    return NextResponse.json(view);
  } catch (err) {
    console.error('availability GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/availability — admin-triggered iCal sync
export async function POST(request: NextRequest) {
  if (!ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Availability sync not configured' }, { status: 503 });
  }

  const auth = request.headers.get('authorization') || '';
  const headerToken = request.headers.get('x-admin-token') || '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  const provided = bearer || headerToken;

  if (provided !== ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const report = await syncAllFeeds();
    if (report.configured_sources === 0) {
      return NextResponse.json(
        { ...report, note: 'No feed URLs configured (AIRBNB_ICAL_URL / VRBO_ICAL_URL)' },
        { status: 200 },
      );
    }
    return NextResponse.json(report);
  } catch (err) {
    console.error('availability POST error:', err);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
