import { NextRequest, NextResponse } from 'next/server';
import { dbGetBookingById, dbHostVerifyBooking } from '@/lib/availabilityDb';
import { notifyHost } from '@/lib/hostNotify';

/**
 * POST /api/bookings/host-verify — admin-gated.
 *
 * Body: { booking_id }
 * Auth: bearer DIRECT_BOOKING_ADMIN_TOKEN (same env as /api/availability sync).
 *
 * Flips booking status to 'confirmed' AND inserts a manual block onto the local
 * availability calendar. Single transaction — no half-committed state.
 *
 * Reject path: a separate body shape {booking_id, action:'reject', reason?} is
 * accepted in this same route to keep the host dashboard simple. Rejection only
 * stamps a status change; refund mechanics stay manual on the host's side until
 * Stripe lands.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_TOKEN = process.env.DIRECT_BOOKING_ADMIN_TOKEN || '';

function extractBearer(req: NextRequest): string {
  const auth = req.headers.get('authorization') || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return req.headers.get('x-admin-token')?.trim() || '';
}

function bad(reason: string, status = 400) {
  return NextResponse.json({ ok: false, reason }, { status });
}

export async function POST(req: NextRequest) {
  if (!ADMIN_TOKEN) return bad('admin_token_not_configured', 503);
  const provided = extractBearer(req);
  if (provided !== ADMIN_TOKEN) return bad('unauthorized', 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad('invalid_json');
  }

  const bookingId = typeof body.booking_id === 'string' ? body.booking_id.trim() : '';
  if (!bookingId) return bad('booking_id_required');

  const action = typeof body.action === 'string' ? body.action : 'confirm';

  if (action === 'reject') {
    const existing = dbGetBookingById(bookingId);
    if (!existing) return bad('booking_not_found', 404);
    // Minimal reject path — no DB helper needed; this turn keeps it tight.
    // Track-of-record stays the booking row's status; refund is host-manual.
    void notifyHost({
      kind: 'booking_rejected',
      booking_id: existing.id,
      inquiry_id: existing.inquiry_id ?? undefined,
      guest_name: existing.name,
      guest_email: existing.email,
      confirmation_code: existing.confirmation_code ?? undefined,
      extra: { reason: typeof body.reason === 'string' ? body.reason : null },
    });
    return NextResponse.json({ ok: true, action: 'reject_logged', booking_id: bookingId });
  }

  const updated = dbHostVerifyBooking(bookingId);
  if (!updated) return bad('booking_not_found', 404);

  void notifyHost({
    kind: 'booking_host_verified',
    booking_id: updated.id,
    inquiry_id: updated.inquiry_id ?? undefined,
    guest_name: updated.name,
    guest_email: updated.email,
    check_in: updated.check_in,
    check_out: updated.check_out,
    guests: updated.guests,
    amount: updated.deposit_amount,
    confirmation_code: updated.confirmation_code ?? undefined,
    payment_service: updated.deposit_method ?? undefined,
  });

  return NextResponse.json({
    ok: true,
    booking_id: updated.id,
    status: updated.status,
    host_verified_at: updated.host_verified_at,
  });
}
