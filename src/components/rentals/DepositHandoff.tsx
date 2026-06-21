'use client'

import { useState } from 'react'
import { PixelCard } from '@/components/pixel'
import { PAYMENT_SERVICES, getPaymentUrl } from '@/app/karma-market/data/donationConfig'

/**
 * Deposit handoff — Phase 2 of the direct-booking flow.
 *
 * Reuses karma-market's PAYMENT_SERVICES (Venmo / PayPal / Google Pay URL
 * templates). The guest pays off-site in their app, then returns here and
 * confirms the BOOK-XXXXXX code matches the payment they sent. We POST to
 * /api/bookings/confirm-deposit which writes a `bookings` row with status =
 * 'deposit_pending' (NOT 'confirmed' — host must verify the money in their
 * Venmo/PayPal inbox before the calendar is blocked).
 *
 * Low-PCI by construction: no card data ever touches .farm.
 */

interface Props {
  confirmationCode: string
  defaultAmount: number          // suggested deposit (e.g. 25% of quote)
  onConfirmed: (bookingId: string) => void
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  color: 'var(--pixel-gold-light)',
  marginBottom: '0.25rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  background: 'var(--pixel-bg-dark)',
  border: '2px solid var(--pixel-ui-border)',
  color: 'var(--pixel-ui-text)',
  font: 'inherit',
}

export default function DepositHandoff({ confirmationCode, defaultAmount, onConfirmed }: Props) {
  const [serviceId, setServiceId] = useState(PAYMENT_SERVICES[0].id)
  const [amount, setAmount] = useState(defaultAmount)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const service = PAYMENT_SERVICES.find(s => s.id === serviceId)
  const payUrl = service ? getPaymentUrl(serviceId, amount) : ''

  async function confirm() {
    setError(null)
    setSubmitting(true)
    try {
      const resp = await fetch('/api/bookings/confirm-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmation_code: confirmationCode,
          payment_service: serviceId,
          amount,
        }),
      })
      const data = await resp.json()
      if (!resp.ok || !data?.ok) {
        setError(data?.reason || `Confirm failed (HTTP ${resp.status})`)
        return
      }
      onConfirmed(data.booking_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PixelCard title="Send deposit, then confirm">
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={labelStyle}>Payment service</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {PAYMENT_SERVICES.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServiceId(s.id)}
              style={{
                padding: '0.45rem 0.75rem',
                border: `2px solid ${serviceId === s.id ? s.color : 'var(--pixel-ui-border)'}`,
                background: serviceId === s.id ? s.color : 'var(--pixel-bg-dark)',
                color: serviceId === s.id ? '#fff' : 'var(--pixel-ui-text)',
                cursor: 'pointer',
              }}
            >
              {s.emoji} {s.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label htmlFor="bf-deposit-amount" style={labelStyle}>
          Deposit amount (USD)
        </label>
        <input
          id="bf-deposit-amount"
          type="number"
          min={1}
          step={1}
          value={amount}
          onChange={e => setAmount(Math.max(1, Number(e.target.value) || 1))}
          style={inputStyle}
        />
      </div>

      <div
        style={{
          padding: '0.75rem',
          background: 'var(--pixel-bg-dark)',
          border: '2px solid var(--pixel-ui-border)',
          marginBottom: '0.75rem',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.85rem' }}>
          1. Open <strong>{service?.name}</strong> on your phone (tap the link
          below or scan from another device).
        </p>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem' }}>
          2. Include this code in the payment note:{' '}
          <code
            style={{
              background: 'var(--pixel-bg-mid)',
              padding: '0.1rem 0.35rem',
              border: '1px solid var(--pixel-ui-border)',
              letterSpacing: '0.1em',
            }}
          >
            {confirmationCode}
          </code>
        </p>
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.78rem', opacity: 0.75 }}>
          {service?.instructions}
        </p>
        {payUrl && (
          <p style={{ margin: '0.5rem 0 0' }}>
            <a
              href={payUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--pixel-gold-light)', textDecoration: 'underline' }}
            >
              Open {service?.name} for ${amount.toFixed(2)} →
            </a>
          </p>
        )}
      </div>

      {error && (
        <p style={{ color: 'var(--pixel-fire-red)', margin: '0 0 0.5rem', fontSize: '0.85rem' }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={confirm}
        disabled={submitting}
        style={{
          padding: '0.6rem 1rem',
          background: 'var(--pixel-gold-light)',
          color: 'var(--pixel-bg-mid)',
          border: 'none',
          cursor: submitting ? 'wait' : 'pointer',
          fontWeight: 600,
        }}
      >
        {submitting ? 'Recording…' : "I've sent the deposit — record it"}
      </button>
      <p style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.5rem' }}>
        Recording this does NOT block the dates yet — the host verifies the
        payment in their inbox first, then your booking is confirmed by email.
      </p>
    </PixelCard>
  )
}
