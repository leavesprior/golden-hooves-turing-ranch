'use client'

import { useEffect, useState } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { CrossGameStorage } from '@/lib/crossGameProgression'
import { successorLegacy } from '@/app/adventure/play/perilEngine'

/**
 * THE PASSING — canon rule #1: mortality is a WIN condition, never a fail-state.
 *
 * There is no "Game Over" here and there must never be one. A character's death
 * closes their chapter and opens an heir's; the world keeps turning either way.
 * The export is still named GameOverScreen because the phase router keys on it
 * (`page.tsx` -> phase 'game_over'); the *player* never sees that word.
 *
 * See: memory/project-bobr-wagontown-northstar-vision-20260719 ("mortality=win,
 * death NEVER a fail-state") and QUESTLINE_MILESTONE_SYNTHESIS_20260720 §18.
 */
export function GameOverScreen() {
  const { state, resetGame } = useOregonTrail()
  const [stage, setStage] = useState<'passing' | 'legacy'>('passing')

  const fallen = state.wagonLeader || 'the wagon leader'
  const legacy = successorLegacy(fallen, 0)
  const heirName = `${fallen.split(' ').slice(-1)[0] || 'the fallen'}'s heir`

  // Fire once per mount, not once per render (the old code logged on every
  // render, flooding the cross-game event log).
  useEffect(() => {
    CrossGameStorage.logEvent(
      'prospectors_tale', 'party_member_died',
      `The trail claimed its own: ${state.message || 'the journey ended'}`,
      { detail: `Day ${state.daysOnTrail}, ${state.totalMilesTraveled} miles, heirloom ${legacy.heirloomTrait}` }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-amber-950/20 to-stone-950 flex items-center justify-center p-4">
      <div className="max-w-xl text-center">

        {stage === 'passing' ? (
          <>
            <div className="text-5xl mb-6 opacity-70">🌾</div>
            <h1 className="font-pixel text-amber-200 text-2xl mb-6">The Trail Claims Its Own</h1>

            <p className="text-stone-300 mb-6 leading-relaxed">{state.message}</p>

            <p className="text-stone-400 text-sm mb-8 leading-relaxed">
              {fallen} went as far as the road allowed, which is as much as the road
              has ever asked of anyone. The oxen do not stop. The river does not
              pause. Somewhere ahead, the same country waits for whoever comes next.
            </p>

            <dl className="grid grid-cols-2 gap-3 text-left text-xs text-stone-400 mb-8 mx-auto max-w-sm">
              <div><dt className="text-stone-500">Days on the trail</dt><dd className="text-amber-200 font-pixel">{state.daysOnTrail}</dd></div>
              <div><dt className="text-stone-500">Miles traveled</dt><dd className="text-amber-200 font-pixel">{state.totalMilesTraveled}</dd></div>
              <div><dt className="text-stone-500">Rivers crossed</dt><dd className="text-amber-200 font-pixel">{state.riversCrossed}</dd></div>
              <div><dt className="text-stone-500">Last landmark</dt><dd className="text-amber-200 font-pixel">{state.currentLandmark}</dd></div>
            </dl>

            <button
              onClick={() => setStage('legacy')}
              className="px-6 py-3 bg-amber-800 hover:bg-amber-700 text-amber-100 font-pixel text-sm rounded border-4 border-amber-600"
            >
              Lay them to rest
            </button>
          </>
        ) : (
          <>
            <div className="text-5xl mb-6 opacity-80">🕯️</div>
            <h1 className="font-pixel text-amber-200 text-2xl mb-6">The Name Goes On</h1>

            <p className="text-stone-300 mb-6 leading-relaxed">
              An heir takes up the reins. They carry the family name, the stories
              told about {fallen}, and the particular stubbornness that got the
              wagon this far.
            </p>

            <p className="text-xs text-stone-500 mb-8">
              Heirloom carried forward: <span className="text-amber-300 font-pixel">{legacy.heirloomTrait}</span>
            </p>

            <button
              onClick={resetGame}
              className="px-6 py-3 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-pixel text-sm rounded border-4 border-emerald-600"
            >
              Continue as {heirName}
            </button>

            <p className="text-stone-600 text-xs mt-6">The world keeps turning.</p>
          </>
        )}

      </div>
    </div>
  )
}

/** Preferred name for new call sites. Same component; the canon-correct label. */
export const PassingScreen = GameOverScreen
