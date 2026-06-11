'use client'

import { useState } from 'react'
import { PixelNavigation, PixelCard } from '@/components/pixel'
import AvailabilityCalendar from '@/components/rentals/AvailabilityCalendar'
import InquiryForm from '@/components/rentals/InquiryForm'
import QuoteDisplay from '@/components/rentals/QuoteDisplay'
import DepositHandoff from '@/components/rentals/DepositHandoff'

/**
 * Direct-booking availability + inquiry PREVIEW page (Phases 1 + 2).
 *
 * Intentionally NOT linked from the live nav/funnel. Per the build scope, the
 * direct-booking surface stays on local/preview until the Phase 5 go-live gate
 * (adversarial-review + Grok-before + ToS assessment). The production /rentals
 * page is untouched and still routes to Airbnb.
 *
 * Flow on this page:
 *   1. Guest sees real open dates (AvailabilityCalendar — Phase 1).
 *   2. Fills InquiryForm → server-mints BOOK-XXXXXX + returns a live quote.
 *   3. QuoteDisplay shows line items + warnings (floor-discipline, min-night).
 *   4. DepositHandoff opens Venmo/PayPal/Google Pay; guest pastes code in note.
 *   5. Guest clicks "I've sent the deposit" → booking row, status=deposit_pending.
 *   6. Host verifies via /api/bookings/host-verify (admin-token gated; later
 *      a small dashboard UI). Status flips to 'confirmed' + a manual block
 *      lands on the calendar.
 */

interface QuoteLine {
  label: string
  amount: number
  detail?: string
}
interface QuoteResult {
  ok: true
  nights: number
  guests: number
  per_night: QuoteLine[]
  subtotal_gross: number
  discounts: QuoteLine[]
  subtotal_after_discounts: number
  tot: number
  cleaning_fee: number
  total: number
  warnings: string[]
}

type Phase =
  | { kind: 'inquiry' }
  | { kind: 'quote'; confirmationCode: string; quote: QuoteResult }
  | { kind: 'deposit_recorded'; bookingId: string }

export default function AvailabilityPreviewPage() {
  const [phase, setPhase] = useState<Phase>({ kind: 'inquiry' })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pixel-bg-dark)', color: 'var(--pixel-ui-text)' }}>
      <PixelNavigation />
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '1.5rem 1rem' }}>
        <h1 style={{ color: 'var(--pixel-gold-light)', textAlign: 'center', marginBottom: '0.5rem' }}>
          Back of Beyond Ranch {'—'} Open Dates
        </h1>
        <p style={{ textAlign: 'center', opacity: 0.8, marginBottom: '1.25rem' }}>
          Real-time availability for the whole 60-acre compound (sleeps 12, two private lakes).
        </p>

        <AvailabilityCalendar />

        <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
          {phase.kind === 'inquiry' && (
            <InquiryForm
              onSuccess={data =>
                setPhase({
                  kind: 'quote',
                  confirmationCode: data.confirmation_code,
                  quote: data.quote,
                })
              }
            />
          )}

          {phase.kind === 'quote' && (
            <>
              <QuoteDisplay code={phase.confirmationCode} quote={phase.quote} />
              <DepositHandoff
                confirmationCode={phase.confirmationCode}
                defaultAmount={Math.max(100, Math.round(phase.quote.total * 0.25))}
                onConfirmed={bookingId => setPhase({ kind: 'deposit_recorded', bookingId })}
              />
              <p style={{ textAlign: 'center', fontSize: '0.8rem' }}>
                <button
                  type="button"
                  onClick={() => setPhase({ kind: 'inquiry' })}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--pixel-gold-light)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                  }}
                >
                  Start a new inquiry
                </button>
              </p>
            </>
          )}

          {phase.kind === 'deposit_recorded' && (
            <PixelCard title="Deposit recorded — host will confirm">
              <p style={{ lineHeight: 1.55 }}>
                Thanks. We received the deposit-pending record (booking{' '}
                <code>{phase.bookingId}</code>). Once Leif sees the payment in
                his Venmo / PayPal / Google Pay inbox, he'll verify the booking
                and you'll get a confirmation email. The dates are{' '}
                <strong>not blocked yet</strong> — only verification locks them.
              </p>
              <p style={{ marginTop: '0.75rem' }}>
                Questions:{' '}
                <a
                  href="mailto:contact@backofbeyondranch.farm"
                  style={{ color: 'var(--pixel-gold-light)', textDecoration: 'underline' }}
                >
                  contact@backofbeyondranch.farm
                </a>
              </p>
            </PixelCard>
          )}
        </div>

        <PixelCard title="How direct booking works">
          <p style={{ lineHeight: 1.5 }}>
            Open dates are synced from our live booking calendar. We accept
            Venmo, PayPal, or Google Pay deposits — no platform fees.
            Alpine County 14% TOT is included in your quote.
          </p>
        </PixelCard>
      </main>
    </div>
  )
}
