'use client'

// /map — the one unified Gold Country map (state→county→local zoom), the
// canonical surface for the map-unification work (2026-06-17). Reads the
// canonical town registry; additive, does not disturb /explore or the
// chapter/oregon travel maps.

import { UnifiedMap } from '@/components/UnifiedMap'
import { ProximityNpcs } from '@/components/westFace/ProximityNpcs'

export default function MapPage() {
  return (
    <main className="min-h-screen px-3 py-6">
      <h1 className="west-face-title mx-auto max-w-4xl">The one map</h1>
      <p className="west-face-body mx-auto mt-2 max-w-4xl">
        Gold Country grows as you discover it. Destination is Back of Beyond, not the Willamette.
      </p>
      <UnifiedMap />
      <ProximityNpcs />
    </main>
  )
}
