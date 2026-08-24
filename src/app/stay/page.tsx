'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { PixelNavigation, PixelButton } from '@/components/pixel'
import { airbnbChargeLink, classifyGuestIntent } from '@/lib/guestIntent'

/**
 * Intent fork for last-minute EV overnight vs walking the country.
 * Clear charge-tonight signals go straight to Airbnb. Everyone else chooses.
 */
export default function StayPage() {
  const intent = useMemo(() => {
    if (typeof window === 'undefined') return 'unknown' as const
    const q = new URLSearchParams(window.location.search)
    return classifyGuestIntent({
      search: window.location.search,
      referrer: document.referrer,
      utmSource: q.get('utm_source') || undefined,
      need: q.get('need') || q.get('intent') || undefined,
    })
  }, [])

  useEffect(() => {
    if (intent !== 'charge_overnight') return
    window.location.replace(airbnbChargeLink())
  }, [intent])

  if (intent === 'charge_overnight') {
    return (
      <div className="min-h-screen bg-[#0e0c0a] text-[#e8dcc4] flex items-center justify-center p-6">
        <p className="font-serif text-lg">Opening tonight&apos;s stay…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0e0c0a] text-[#e8dcc4]">
      <PixelNavigation />
      <main className="mx-auto max-w-xl px-4 py-10">
        <p className="west-face-eyebrow">West Point · Calaveras County</p>
        <h1 className="west-face-title mt-3 text-3xl">What do you need tonight?</h1>
        <p className="mt-4 font-serif text-base leading-relaxed text-[#b8a88a]">
          Solar Level 2 (220V) overnight charging — J1772, Tesla adapter on site.
          This is not a Supercharger. A full battery by morning, and a bed in Gold Country.
        </p>

        <div className="mt-8 grid gap-4">
          <a
            href={airbnbChargeLink()}
            className="block rounded-xl border border-[rgba(232,220,196,0.2)] bg-[#16130f] p-5 min-h-[72px] hover:border-[#e8dcc4]"
          >
            <p className="text-lg font-serif">Charge overnight and sleep</p>
            <p className="mt-1 text-sm text-[#b8a88a]">Straight to the listing. Level 2 by morning.</p>
          </a>
          <Link
            href="/oregon-trail"
            className="block rounded-xl border border-[rgba(232,220,196,0.2)] bg-[#16130f] p-5 min-h-[72px] hover:border-[#e8dcc4]"
          >
            <p className="text-lg font-serif">Play the Golden Frog Trail</p>
            <p className="mt-1 text-sm text-[#b8a88a]">
              First discount for new guests. Already staying? Play once for a return-stay discount.
              The porch QR opens the live map — it is not on this site.
            </p>
          </Link>
        </div>

        <p className="mt-8 text-sm leading-relaxed text-[#b8a88a]">
          Kirkwood is about 45 minutes. Bear Valley about an hour. The ranch sits in the oaks
          of West Point — a house from which those roads start.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-[#b8a88a]">
          Tesla in-car Superchargers and Destination Charging are Tesla&apos;s own maps of
          commissioned Wall Connectors. This charger is overnight Level 2 for a booked guest,
          not a public stall on that list.
        </p>
        <div className="mt-6">
          <PixelButton href="/rentals" variant="gold" size="md">
            The ranch in this country
          </PixelButton>
        </div>
      </main>
    </div>
  )
}
