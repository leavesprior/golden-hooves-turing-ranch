'use client'

import { useOregonTrail } from '../oregonTrailContext'
import { useNarrator } from '../narratorContext'
import { useReputation } from '../reputationContext'
import { useCharacter } from '../characterContext'
import { TelegraphOffice } from '../components/TelegraphOffice'
import { CrossGameStorage } from '@/lib/crossGameProgression'

export function TelegraphScreen() {
  const { closeTelegraph, state } = useOregonTrail()
  const { comment, setMood } = useNarrator()
  const { modifyReputation } = useReputation()
  const { addExperience, addInvestigationXP } = useCharacter()

  const handleWarrantIssued = (success: boolean, bounty: number, message: string) => {
    if (success) {
      setMood('impressed')
      comment("Justice has been served! Though the narrator wonders if it was truly deserved...", 'observation')
      modifyReputation('pinkerton', 15, 'Successful warrant execution', state.currentLandmark)
      addExperience(100) // OUTLAW_CAPTURED
      addInvestigationXP('suspectIdentification', 15)
      // Create a cross-game bounty for Ranch Treasure Hunt
      CrossGameStorage.addBounty({
        id: `bounty_${Date.now()}`,
        targetName: message || 'Outlaw',
        description: `Warrant executed at ${state.currentLandmark || 'unknown location'}. Bounty: $${bounty}.`,
        reward: bounty,
        originGame: 'prospectors_tale',
      })
    } else {
      setMood('amused')
      comment("Wrong suspect! The real outlaw escapes while you arrest an innocent. How embarrassing.", 'observation')
      modifyReputation('pinkerton', -20, 'Wrongful arrest', state.currentLandmark)
      addExperience(-10) // WRONG_ACCUSATION penalty
    }
    closeTelegraph()
  }

  return (
    <TelegraphOffice
      onClose={closeTelegraph}
      onWarrantIssued={handleWarrantIssued}
    />
  )
}
