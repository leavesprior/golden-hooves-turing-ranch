'use client'

import { useEffect } from 'react'
import { useCharacter, type StatName } from '../characterContext'
import {
  BETWEEN_LEVEL_XP,
  grantBetweenLevelXp,
  type ArcadeLevel,
} from '@/lib/goldCountryLevelRewards'
import { CAPTURE_XP, grantCaptureXp } from '@/lib/goldCountryHunt'

const STATS: StatName[] = ['Shrewdness', 'Agility', 'Durability', 'Diplomacy', 'Luck', 'Expertise']

export function GoldCountryXpGain({
  gained,
  level,
  pending,
  current,
  toNext,
  onSpend,
  eyebrow = 'Between levels · S.A.D.D.L.E.',
}: {
  gained: number
  level: number
  pending: number
  current: number
  toNext: number
  onSpend: (stat: StatName) => void
  eyebrow?: string
}) {
  return (
    <div className="west-face-paper" data-testid="xp-gain">
      <p className="west-face-eyebrow">{eyebrow}</p>
      <p className="west-face-title text-2xl mt-1">XP gained</p>
      <p className="west-face-body mt-2">
        +{gained} experience. Level {level}. {current}/{toNext} toward the next.
      </p>
      {pending > 0 ? (
        <>
          <p className="west-face-body text-sm mt-3">
            {pending} point{pending === 1 ? '' : 's'} to put on a stat. These rolls follow you into the alley.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {STATS.map((stat) => (
              <button
                key={stat}
                type="button"
                data-testid={`xp-spend-${stat}`}
                className="west-face-pill justify-center min-h-11"
                onClick={() => onSpend(stat)}
              >
                +1 {stat}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="west-face-body text-sm mt-3">No points waiting. The trail already spent them, or none came due.</p>
      )}
    </div>
  )
}

export function CaptureXp({ npcId }: { npcId: string }) {
  const { state: charState, addExperience, allocateLevelUpPoints } = useCharacter()
  const hasCharacter = !!charState.character

  useEffect(() => {
    if (!hasCharacter) return
    grantCaptureXp(npcId, addExperience)
  }, [npcId, addExperience, hasCharacter])

  if (!charState.character) return null
  const ch = charState.character
  return (
    <div className="mb-6">
      <GoldCountryXpGain
        gained={CAPTURE_XP}
        level={ch.level}
        pending={ch.pendingStatPoints}
        current={ch.experience}
        toNext={ch.experienceToNextLevel}
        onSpend={(stat) => allocateLevelUpPoints(stat, 1)}
        eyebrow="The paper · S.A.D.D.L.E."
      />
    </div>
  )
}

export function BetweenLevelXp({ level }: { level: ArcadeLevel }) {
  const { state: charState, addExperience, allocateLevelUpPoints } = useCharacter()
  const hasCharacter = !!charState.character

  useEffect(() => {
    if (!hasCharacter) return
    grantBetweenLevelXp(level, addExperience)
  }, [level, addExperience, hasCharacter])

  if (!charState.character) return null
  const ch = charState.character
  return (
    <div className="mb-6">
      <GoldCountryXpGain
        gained={BETWEEN_LEVEL_XP[level].amount}
        level={ch.level}
        pending={ch.pendingStatPoints}
        current={ch.experience}
        toNext={ch.experienceToNextLevel}
        onSpend={(stat) => allocateLevelUpPoints(stat, 1)}
      />
    </div>
  )
}
