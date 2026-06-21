'use client'

// /map — the one unified Gold Country map (state→county→local zoom), the
// canonical surface for the map-unification work (2026-06-17). Reads the
// canonical town registry; additive, does not disturb /explore or the
// chapter/oregon travel maps.

import { UnifiedMap } from '@/components/UnifiedMap'

export default function MapPage() {
  return (
    <main className="min-h-screen bg-[var(--pixel-bg-dark)] text-[var(--pixel-ui-text)]">
      <UnifiedMap />
    </main>
  )
}
