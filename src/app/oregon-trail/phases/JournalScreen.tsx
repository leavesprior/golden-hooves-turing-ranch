'use client'

import { useState } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { ClueJournal } from '../components/ClueJournal'
import { JournalSouvenir } from '../components/JournalSouvenir'

export function JournalScreen() {
  const { closeJournal, openDossier, openTelegraph } = useOregonTrail()
  const [showSouvenir, setShowSouvenir] = useState(false)

  return (
    <>
      <ClueJournal
        onClose={closeJournal}
        onOpenDossier={openDossier}
        onOpenTelegraph={openTelegraph}
      />
      {/* Export Journal / Souvenir button — fixed bottom-right */}
      <button
        onClick={() => setShowSouvenir(true)}
        className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-amber-900 text-amber-300 rounded-lg hover:bg-amber-800 active:bg-amber-700 text-sm font-bold shadow-lg border border-amber-700"
      >
        Export Journal
      </button>
      {showSouvenir && (
        <JournalSouvenir onClose={() => setShowSouvenir(false)} />
      )}
    </>
  )
}
