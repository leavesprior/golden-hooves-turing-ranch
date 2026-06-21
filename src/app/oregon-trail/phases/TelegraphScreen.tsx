'use client'

import { useOregonTrail } from '../oregonTrailContext'
import { useNarrator } from '../narratorContext'
import { useReputation } from '../reputationContext'
import { useCharacter } from '../characterContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { TelegraphOffice } from '../components/TelegraphOffice'
import { CrossGameStorage } from '@/lib/crossGameProgression'

export function TelegraphScreen() {
  const { closeTelegraph, state } = useOregonTrail()
  const { comment, setMood } = useNarrator()
  const { modifyReputation } = useReputation()
  const { addExperience, addInvestigationXP } = useCharacter()
  // 2026-06-17 fix: bounties must actually PAY the player into a spendable
  // balance (neutral karma — what livestock costs), and the act of justice (or
  // wrongful arrest) must move ± karma. Previously the bounty $ was computed and
  // dropped; capture credited nothing spendable.
  const { earnNeutral, recordGoodAction, recordLawfulAction, addBadKarma } = useKarmaWallet()

  const handleWarrantIssued = (success: boolean, bounty: number, message: string) => {
    if (success) {
      setMood('impressed')
      comment("Justice has been served! Though the narrator wonders if it was truly deserved...", 'observation')
      modifyReputation('pinkerton', 15, 'Successful warrant execution', state.currentLandmark)
      addExperience(100) // OUTLAW_CAPTURED
      addInvestigationXP('suspectIdentification', 15)
      // PAY THE BOUNTY into the spendable wallet (neutral karma), and credit the
      // good/lawful act of bringing a criminal to justice.
      if (bounty > 0) {
        void earnNeutral(bounty, `Bounty collected: ${message || 'outlaw'}`)
      }
      recordGoodAction()
      recordLawfulAction()
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
      // Jailing an innocent is a real moral cost — your actions earn negative karma.
      void addBadKarma(5, 'Arrested an innocent — wrongful warrant')
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
