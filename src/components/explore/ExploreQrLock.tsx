'use client'

import { useSyncExternalStore, type ReactNode } from 'react'
import Link from 'next/link'
import { hasExploreQr } from '@/lib/exploreQrGate'

function subscribe(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  return () => window.removeEventListener('storage', onStoreChange)
}

function getOpen() {
  return hasExploreQr({ search: window.location.search, storage: window.sessionStorage })
}

/**
 * Public /explore is a ranch-house playable area, not a website menu.
 * Scan the house QR (or open /explore?qr=ranch-house). Keep GPS on.
 */
export default function ExploreQrLock({
  children,
  initialOpen = false,
}: {
  children: ReactNode
  initialOpen?: boolean
}) {
  const open = useSyncExternalStore(subscribe, getOpen, () => initialOpen)

  if (open) return <>{children}</>

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)] text-[var(--read-ink)] flex items-center justify-center px-6">
      <div className="max-w-lg text-center space-y-5">
        <p className="read-label uppercase tracking-[0.18em] text-[var(--pixel-gold-mid)]">At the ranch house</p>
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--pixel-gold-light)]">The playable area is here</h1>
        <p className="read-body">
          Scan the QR on the ranch house to walk Gold Country towns from the porch.
          Leave GPS on — nearby keepers, outfitters, and witnesses only speak when you are actually there.
          Easy clues send you back to the ranch site; the towns themselves are the rest of the map.
        </p>
        <p className="read-body">
          From the website, book a stay or play the Golden Frog Trail. This layer waits at the house.
        </p>
        <Link href="/" className="inline-block min-h-11 rounded-sm bg-[var(--pixel-gold-mid)] px-5 py-3 font-serif text-lg text-[var(--pixel-bg-dark)]">
          Back to the ranch
        </Link>
      </div>
    </div>
  )
}
