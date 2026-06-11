import { NextRequest, NextResponse } from 'next/server';
import { dbCreateInquiry, dbGetBlocksInRange } from '@/lib/availabilityDb';
import { quote, nightsBetween } from '@/lib/quoteEngine';
import { notifyHost } from '@/lib/hostNotify';

/**
 * POST /api/bookings/inquiry — public.
 *
 * Body: { name, email, check_in, check_out, guests, phone?, message? }
 *
 * - Validates dates + guests
 * - Checks the local availability store for overlapping blocks (read-only;
 *   import-only via /api/availability sync). Returns 409 if window collides.
 * - Computes a quote (pure function — no DB).
 * - Creates an `inquiries` row + mints a server-side BOOK-XXXXXX code.
 * - Notifies host (console-log gateway for now; Resend later).
 *
 * Returns the inquiry id, confirmation code, and the quote breakdown so the
 * client can immediately present the deposit handoff.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : null;
  const check_in = typeof body.check_in === 'string' ? body.check_in.trim() : '';
  const check_out = typeof body.check_out === 'string' ? body.check_out.trim() : '';
  const guests = typeof body.guests === 'number' ? body.guests : Number(body.guests);
  const message =
    typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : null;

  if (!name || name.length > 200) return bad('name_required');
  if (!EMAIL_RE.test(email)) return bad('email_invalid');
  if (!DATE_RE.test(check_in)) return bad('check_in_invalid');
  if (!DATE_RE.test(check_out)) return bad('check_out_invalid');
  if (check_out <= check_in) return bad('check_out_must_follow_check_in');
  if (!Number.isInteger(guests) || guests < 1 || guests > 12) return bad('guests_out_of_range');

  // The window [check_in, check_out) must not overlap any imported/manual block.
  const conflicts = dbGetBlocksInRange(check_in, check_out);
  if (conflicts.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'dates_unavailable',
        conflicts: conflicts.map(c => ({
          source: c.source,
          start_date: c.start_date,
          end_date: c.end_date,
          summary: c.summary,
        })),
      },
      { status: 409 },
    );
  }

  const q = quote({ check_in, check_out, guests });
  if (!q.ok) return bad(q.reason);

  const inquiry = dbCreateInquiry({
    name,
    email,
    phone,
    check_in,
    check_out,
    guests,
    message,
  });

  // Fire-and-forget host notify; never block the response on it.
  void notifyHost({
    kind: 'inquiry_created',
    inquiry_id: inquiry.id,
    guest_name: name,
    guest_email: email,
    check_in,
    check_out,
    guests,
    confirmation_code: inquiry.confirmation_code ?? undefined,
    extra: {
      nights: nightsBetween(check_in, check_out),
      quote_total: q.total,
      warnings: q.warnings,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      inquiry: {
        id: inquiry.id,
        confirmation_code: inquiry.confirmation_code,
        created_at: inquiry.created_at,
      },
      quote: q,
    },
    { status: 201 },
  );
}
