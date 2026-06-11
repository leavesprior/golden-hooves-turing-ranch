/**
 * Host-notify gateway for direct-booking events.
 *
 * Phase 2 v1 — no email infra in package.json yet. This gateway is the single
 * call-site so we can drop in Resend / SES later behind one env switch. Until
 * then it console-logs structured records (server-visible to Leif during dev)
 * and returns ok.
 *
 * TODO(email): when Resend is wired, send to HOST_EMAIL with formatted body
 *   if process.env.RESEND_API_KEY is set; else preserve console fallback.
 *
 * No env reads beyond HOST_EMAIL — this is a stub gateway, intentionally tiny.
 */

const HOST_EMAIL = process.env.HOST_EMAIL || 'contact@backofbeyondranch.farm';

export interface HostNotifyEvent {
  kind:
    | 'inquiry_created'
    | 'deposit_confirmed'
    | 'booking_host_verified'
    | 'booking_rejected';
  inquiry_id?: string;
  booking_id?: string;
  guest_name?: string;
  guest_email?: string;
  check_in?: string;
  check_out?: string;
  guests?: number;
  amount?: number;
  confirmation_code?: string;
  payment_service?: string;
  extra?: Record<string, unknown>;
}

export async function notifyHost(event: HostNotifyEvent): Promise<{ ok: true; via: string }> {
  const stamped = {
    ts: new Date().toISOString(),
    to: HOST_EMAIL,
    ...event,
  };
  // Structured single-line log for grep/MB tail.
  console.log('[bobr/direct-booking notify]', JSON.stringify(stamped));
  return { ok: true, via: 'console' };
}
