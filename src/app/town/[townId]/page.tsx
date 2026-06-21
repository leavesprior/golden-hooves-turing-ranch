// /town/[townId] — a single town as a Where-in-Time-style investigation.
// Opens the matching TownInvestigation from the registry-keyed data; 404s if a
// town has no authored case yet (only towns with depth are reachable here).

import { notFound } from 'next/navigation'
import { getInvestigation } from '@/lib/townInvestigations'
import { TownInvestigation } from '@/components/TownInvestigation'

export default async function TownInvestigationPage({ params }: { params: Promise<{ townId: string }> }) {
  const { townId } = await params
  const investigation = getInvestigation(townId)
  if (!investigation) notFound()

  return (
    <main className="min-h-screen bg-[var(--pixel-bg-dark)] text-[var(--pixel-ui-text)]">
      <TownInvestigation investigation={investigation} />
    </main>
  )
}
