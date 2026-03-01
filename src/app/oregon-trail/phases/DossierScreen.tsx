'use client'

import { useOregonTrail } from '../oregonTrailContext'
import { DossierView } from '../components/DossierView'

export function DossierScreen() {
  const { closeDossier } = useOregonTrail()

  return (
    <DossierView
      onClose={closeDossier}
    />
  )
}
