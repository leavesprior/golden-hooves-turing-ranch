'use client'

import { PixelCard } from '@/components/pixel'

interface QuoteLine {
  label: string
  amount: number
  detail?: string
}

interface QuoteResult {
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

interface Props {
  code: string
  quote: QuoteResult
}

function fmt(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function QuoteDisplay({ code, quote }: Props) {
  return (
    <PixelCard title={`Quote — ${quote.nights} night${quote.nights === 1 ? '' : 's'}, ${quote.guests} guest${quote.guests === 1 ? '' : 's'}`}>
      <div style={{ marginBottom: '0.5rem' }}>
        <strong style={{ color: 'var(--pixel-gold-light)' }}>
          Confirmation code:
        </strong>{' '}
        <code
          style={{
            background: 'var(--pixel-bg-dark)',
            padding: '0.15rem 0.4rem',
            border: '1px solid var(--pixel-ui-border)',
            letterSpacing: '0.1em',
          }}
        >
          {code}
        </code>
        <p style={{ fontSize: '0.78rem', opacity: 0.75, margin: '0.25rem 0 0' }}>
          Include this code in your Venmo / PayPal / Google Pay payment note so
          we can match it up.
        </p>
      </div>

      <details style={{ marginTop: '0.75rem' }}>
        <summary style={{ cursor: 'pointer', color: 'var(--pixel-gold-light)' }}>
          See nightly breakdown
        </summary>
        <ul style={{ paddingLeft: '1rem', margin: '0.4rem 0', listStyle: 'none' }}>
          {quote.per_night.map((line, i) => (
            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>{line.label}{line.detail ? <em style={{ opacity: 0.6 }}> — {line.detail}</em> : null}</span>
              <span>{fmt(line.amount)}</span>
            </li>
          ))}
        </ul>
      </details>

      <hr style={{ borderColor: 'var(--pixel-ui-border)', margin: '0.6rem 0' }} />
      <Row label="Subtotal (gross)" value={fmt(quote.subtotal_gross)} />
      {quote.discounts.map((d, i) => (
        <Row key={i} label={d.label + (d.detail ? ` (${d.detail})` : '')} value={fmt(d.amount)} muted />
      ))}
      <Row label="After discounts" value={fmt(quote.subtotal_after_discounts)} />
      <Row label="Alpine County 14% TOT" value={fmt(quote.tot)} muted />
      {quote.cleaning_fee > 0 && <Row label="Cleaning fee" value={fmt(quote.cleaning_fee)} muted />}
      <hr style={{ borderColor: 'var(--pixel-ui-border)', margin: '0.6rem 0' }} />
      <Row label="Total" value={fmt(quote.total)} bold />

      {quote.warnings.length > 0 && (
        <div style={{ marginTop: '0.75rem', padding: '0.5rem', border: '1px dashed var(--pixel-fire-red)' }}>
          <strong style={{ color: 'var(--pixel-fire-red)' }}>Host review required:</strong>
          <ul style={{ margin: '0.25rem 0 0 1rem', fontSize: '0.8rem' }}>
            {quote.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
    </PixelCard>
  )
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        opacity: muted ? 0.8 : 1,
        fontWeight: bold ? 700 : 400,
        fontSize: bold ? '1rem' : '0.9rem',
        margin: '0.15rem 0',
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
