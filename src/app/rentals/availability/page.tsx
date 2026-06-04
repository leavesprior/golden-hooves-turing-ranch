'use client'

import { PixelNavigation, PixelCard } from '@/components/pixel'
import AvailabilityCalendar from '@/components/rentals/AvailabilityCalendar'

/**
 * Direct-booking availability PREVIEW page (Phase 1).
 *
 * Intentionally NOT linked from the live nav/funnel. Per the build scope, the
 * direct-booking surface stays on local/preview until the Phase 5 go-live gate
 * (adversarial-review + Grok-before + ToS assessment). The production /rentals
 * page is untouched and still routes to Airbnb.
 */
export default function AvailabilityPreviewPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pixel-bg-dark)', color: 'var(--pixel-ui-text)' }}>
      <PixelNavigation />
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '1.5rem 1rem' }}>
        <h1 style={{ color: 'var(--pixel-gold-light)', textAlign: 'center', marginBottom: '0.5rem' }}>
          Back of Beyond Ranch {'—'} Open Dates
        </h1>
        <p style={{ textAlign: 'center', opacity: 0.8, marginBottom: '1.25rem' }}>
          Real-time availability for the whole 60-acre compound (sleeps 12, two private lakes).
        </p>

        <AvailabilityCalendar />

        <PixelCard title="How this works">
          <p style={{ lineHeight: 1.5 }}>
            Open dates are synced directly from our live booking calendar. Found your week?
            Reach out and book direct {'—'} no platform fees, same ranch.
          </p>
          <p style={{ marginTop: '0.6rem' }}>
            <a
              href="mailto:contact@backofbeyondranch.farm"
              style={{ color: 'var(--pixel-gold-light)', textDecoration: 'underline' }}
            >
              contact@backofbeyondranch.farm
            </a>
          </p>
        </PixelCard>
      </main>
    </div>
  )
}
