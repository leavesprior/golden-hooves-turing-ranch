'use client'

import { useState } from 'react'
import { PixelCard } from '@/components/pixel'

/**
 * Inquiry form — Phase 2 v1 of the direct-booking flow.
 *
 * Local-preview only. POSTs to /api/bookings/inquiry, displays the returned
 * BOOK-XXXXXX code + quote breakdown, then hands off to <DepositHandoff/>.
 *
 * Intentionally minimal styling — reuses the pixel palette from the rest of the
 * site. The host can wire this into /rentals/availability once Leif clears it.
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

interface InquirySuccess {
  inquiry_id: string
  confirmation_code: string
  quote: QuoteResult
}

interface Props {
  onSuccess: (data: InquirySuccess) => void
}

const PIXEL_GOLD = 'var(--pixel-gold-light)'
const PIXEL_BG = 'var(--pixel-bg-mid)'
const PIXEL_TEXT = 'var(--pixel-ui-text)'
const PIXEL_RED = 'var(--pixel-fire-red)'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  background: 'var(--pixel-bg-dark)',
  border: '2px solid var(--pixel-ui-border)',
  color: PIXEL_TEXT,
  font: 'inherit',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  color: PIXEL_GOLD,
  marginBottom: '0.25rem',
  letterSpacing: '0.02em',
}

export default function InquiryForm({ onSuccess }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const todayIso = new Date().toISOString().slice(0, 10)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const resp = await fetch('/api/bookings/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          check_in: checkIn,
          check_out: checkOut,
          guests,
          message: message || undefined,
        }),
      })
      const data = await resp.json()
      if (!resp.ok || !data?.ok) {
        setError(data?.reason || `Inquiry failed (HTTP ${resp.status})`)
        return
      }
      onSuccess({
        inquiry_id: data.inquiry.id,
        confirmation_code: data.inquiry.confirmation_code,
        quote: data.quote,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PixelCard title="Request to Book — Direct">
      <form onSubmit={submit} style={{ display: 'grid', gap: '0.75rem' }}>
        <div>
          <label htmlFor="bf-name" style={labelStyle}>Your name</label>
          <input
            id="bf-name"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
            autoComplete="name"
          />
        </div>
        <div>
          <label htmlFor="bf-email" style={labelStyle}>Email</label>
          <input
            id="bf-email"
            required
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="bf-phone" style={labelStyle}>Phone (optional)</label>
          <input
            id="bf-phone"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={inputStyle}
            autoComplete="tel"
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div>
            <label htmlFor="bf-checkin" style={labelStyle}>Check-in</label>
            <input
              id="bf-checkin"
              required
              type="date"
              min={todayIso}
              value={checkIn}
              onChange={e => setCheckIn(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="bf-checkout" style={labelStyle}>Check-out</label>
            <input
              id="bf-checkout"
              required
              type="date"
              min={checkIn || todayIso}
              value={checkOut}
              onChange={e => setCheckOut(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
        <div>
          <label htmlFor="bf-guests" style={labelStyle}>Guests (1–12)</label>
          <input
            id="bf-guests"
            required
            type="number"
            min={1}
            max={12}
            value={guests}
            onChange={e => setGuests(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="bf-message" style={labelStyle}>Anything we should know? (optional)</label>
          <textarea
            id="bf-message"
            rows={3}
            value={message}
            onChange={e => setMessage(e.target.value)}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>
        {error && (
          <p style={{ color: PIXEL_RED, margin: 0, fontSize: '0.85rem' }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '0.6rem',
            background: PIXEL_GOLD,
            color: PIXEL_BG,
            border: 'none',
            cursor: submitting ? 'wait' : 'pointer',
            fontWeight: 600,
            letterSpacing: '0.04em',
          }}
        >
          {submitting ? 'Sending…' : 'Get Quote'}
        </button>
        <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: 0 }}>
          Alpine County STR permit posted in footer. Direct booking via
          back of beyond ranch — no platform fees.
        </p>
      </form>
    </PixelCard>
  )
}
