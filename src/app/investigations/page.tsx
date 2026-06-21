// /investigations — "The Tare's Trail" case-board: the front door to all the
// town investigations, with convict-Vane-across-the-Mother-Lode progression.

import { TareTrail } from '@/components/TareTrail'

export default function InvestigationsPage() {
  return (
    <main className="min-h-screen bg-[var(--pixel-bg-dark)] text-[var(--pixel-ui-text)]">
      <TareTrail />
    </main>
  )
}
