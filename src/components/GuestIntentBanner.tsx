'use client'

import { useEffect, useState } from 'react'
import { airbnbChargeLink, classifyGuestIntent } from '@/lib/guestIntent'

/** Quiet bar for EV/Tesla/PlugShare arrivals on any page. */
export function GuestIntentBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search)
      const intent = classifyGuestIntent({
        search: window.location.search,
        referrer: document.referrer,
        utmSource: q.get('utm_source') || undefined,
        need: q.get('need') || q.get('intent') || undefined,
      })
      setShow(intent === 'charge_overnight' && !window.location.pathname.startsWith('/stay'))
    } catch {
      setShow(false)
    }
  }, [])

  if (!show) return null

  return (
    <div className="sticky top-0 z-[60] border-b border-[#6f5d38] bg-[#16130f] px-4 py-3 text-center">
      <p className="font-serif text-sm text-[#e8dcc4]">
        Overnight Level 2 charge in West Point — a bed, not a Supercharger.
        {' '}
        <a href={airbnbChargeLink()} className="underline underline-offset-4">
          Open tonight&apos;s stay
        </a>
        {' · '}
        <a href="/stay" className="opacity-80 hover:opacity-100">
          Choose
        </a>
      </p>
    </div>
  )
}
