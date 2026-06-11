import { NextRequest, NextResponse } from 'next/server';
import {
  dbGetInquiryByCode,
  dbCreateBooking,
  dbGetBookings,
  nightsBetween,
} from '@/lib/availabilityDb';
import { isBookingCodeFormatValid, normalizeBookingCode } from '@/lib/bookingCodes';
import { notifyHost } from '@/lib/hostNotify';
import { quote } from '@/lib/quoteEngine';

/**
 * POST /api/bookings/confirm-deposit — public.
 *
 * Body: { confirmation_code, payment_service, amount }
 *
 * Guest path: paid off-site (Venmo/PayPal/Google Pay), pasted BOOK-XXXXXX in the
 * payment note, then returns to .farm and submits this form.
 *
 * - Validates the BOOK-XXXXXX format + looks up the inquiry.
 * - Refuses if a booking already exists for this inquiry (idempotency).
 * - Creates a `bookings` row with status='deposit_pending' (host must verify
 *   in their Venmo/PayPal inbox before status flips to 'confirmed').
 * - Notifies host.
 *
 * Status stays 'deposit_pending' until host-verify; the calendar is NOT yet
 * blocked. This keeps spam inquiries from DoS'ing availability.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_SERVICES = new Set(['venmo', 'paypal', 'googlepay']);

function bad(reason: string, status = 400) {
  return NextResponse.json({ ok: false, reason }, { status });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad('invalid_json');
  }

  const rawCode = typeof body.confirmation_code === 'string' ? body.confirmation_code : '';
  if (!isBookingCodeFormatValid(rawCode)) return bad('confirmation_code_invalid');
  const code = normalizeBookingCode(rawCode);

  const service = typeof body.payment_service === 'string' ? body.payment_service : '';
  if (!ALLOWED_SERVICES.has(service)) return bad('payment_service_invalid');

  const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount);
  if (!Number.isFinite(amount) || amount < 1 || amount > 100_000) return bad('amount_invalid');

  const inquiry = dbGetInquiryByCode(code);
  if (!inquiry) return bad('confirmation_code_not_found', 404);
  if (!inquiry.check_in || !inquiry.check_out || !inquiry.guests) {
    return bad('inquiry_missing_dates_or_guests', 409);
  }

  // Idempotency: if a booking already exists for this inquiry, return it.
  const existing = dbGetBookings()
    .find(b => b.inquiry_id === inquiry.id);
  if (existing) {
    return NextResponse.json(
      { ok: true, booking_id: existing.id, status: existing.status, already_exists: true },
      { status: 200 },
    );
  }

  const q = quote({
    check_in: inquiry.check_in,
    check_out: inquiry.check_out,
    guests: inquiry.guests,
  });
  if (!q.ok) return bad(q.reason, 500);

  const booking = dbCreateBooking({
    inquiry_id: inquiry.id,
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    check_in: inquiry.check_in,
    check_out: inquiry.check_out,
    guests: inquiry.guests,
    quote_total: q.total,
    deposit_amount: amount,
    deposit_method: service,
    status: 'deposit_pending',
    source: 'direct',
    confirmation_code: code,
  });

  void notifyHost({
    kind: 'deposit_confirmed',
    inquiry_id: inquiry.id,
    booking_id: booking.id,
    guest_name: booking.name,
    guest_email: booking.email,
    check_in: booking.check_in,
    check_out: booking.check_out,
    guests: booking.guests,
    amount,
    confirmation_code: code,
    payment_service: service,
    extra: { nights: nightsBetween(booking.check_in, booking.check_out) },
  });

  return NextResponse.json(
    { ok: true, booking_id: booking.id, status: booking.status },
    { status: 201 },
  );
}
