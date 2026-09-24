'use client'

import { useEffect, useState } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { CrossGameStorage } from '@/lib/crossGameProgression'
import { heirFor, passingForState } from '../state/passing'
import { HEALTH_MESSAGES } from '../data/eventMessages'
import { TrailOutcomePicture } from '../components/TrailOutcomePicture'
import { useCharacter } from '../characterContext'
import { PlayerPortrait } from '../components/PlayerPortrait'
import { getPassingPlayerPortrait } from '../data/passingPlayerPortrait'

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
  const { state, continueAsHeir } = useOregonTrail()
  const { state: characterState } = useCharacter()
  const [stage, setStage] = useState<'passing' | 'legacy'>('passing')

  const passing = passingForState(state)
  const fallen = passing.fallenName
  // Stable across renders and reloads; memorial prose never consumes gameplay RNG.
  const epitaphIndex = Array.from(`${fallen}:${passing.cause}`).reduce((sum, char) => (sum + char.charCodeAt(0)) % HEALTH_MESSAGES.death.length, 0)
  const markerCaption = passing.kind === 'town'
    ? `A stone marker at ${passing.place}.`
    : passing.kind === 'river'
      ? `A wooden cross and cairn by ${passing.place}.`
      : passing.kind === 'trail'
        ? `A wooden cross and cairn along the trail. Last landmark: ${passing.place}.`
        : 'A memorial along the trail. The place of passing was not recorded.'
  // The heir continues THIS run (CONTINUE_AS_HEIR), not a fresh wagon.
  const { name: heirName, heirloomTrait } = heirFor(state)
  const playerPortrait = getPassingPlayerPortrait(state, characterState.character)
  const familyPortrait = playerPortrait ? (
    <div data-testid="passing-family-portrait" className="flex items-center justify-center gap-4 text-left mb-6">
      <PlayerPortrait background={playerPortrait.background} name={playerPortrait.name} />
      <div className="min-w-0">
        <p className="text-amber-200 text-sm break-words">Family portrait · {playerPortrait.name}</p>
        <p className="text-stone-400 text-xs mt-1">The family whose name continues.</p>
      </div>
    </div>
  ) : null

  // Fire once per mount, not once per render (the old code logged on every
  // render, flooding the cross-game event log).
  useEffect(() => {
    CrossGameStorage.logEvent(
      'prospectors_tale', 'party_member_died',
      `The trail claimed its own: ${state.message || 'the journey ended'}`,
      { detail: `Day ${state.daysOnTrail}, ${state.totalMilesTraveled} miles, heirloom ${heirloomTrait}` }
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div data-testid="passing-screen" className="min-h-screen bg-gradient-to-b from-stone-950 via-amber-950/20 to-stone-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl text-center">

        {stage === 'passing' ? (
          <>
            <h1 className="font-pixel text-amber-200 text-2xl mb-6">The Trail Claims Its Own</h1>
            <div data-testid="passing-marker" data-kind={passing.kind}>
              <TrailOutcomePicture art={passing.kind === 'town' ? 'grave-town' : 'grave-trail'} caption={markerCaption} />
              {playerPortrait?.placement === 'memorial' && (
                <PlayerPortrait background={playerPortrait.background} name={fallen} className="mb-3" data-testid="passing-memorial-portrait" />
              )}
              <h2 data-testid="passing-name" className="font-pixel text-amber-200 text-xl mb-3">{fallen}</h2>
              <p data-testid="passing-epitaph" className="text-stone-300 italic mb-2">{HEALTH_MESSAGES.death[epitaphIndex]}</p>
              <p className="text-stone-400 text-sm mb-6">Asked for a short rest. Negotiations got out of hand.</p>
            </div>
            <p data-testid="passing-cause" className="text-stone-300 mb-6 leading-relaxed">{passing.cause}</p>

            <p className="text-stone-400 text-sm mb-8 leading-relaxed">
              {fallen} went as far as the road allowed, which is as much as the road
              has ever asked of anyone. The road runs onward. The river does not
              pause. Somewhere ahead, the same country waits for whoever comes next.
            </p>

            {playerPortrait?.placement === 'legacy' && familyPortrait}

            <dl className="grid grid-cols-2 gap-3 text-left text-xs text-stone-400 mb-8 mx-auto max-w-sm">
              <div><dt className="text-stone-500">Days on the trail</dt><dd className="text-amber-200 font-pixel">{state.daysOnTrail}</dd></div>
              <div><dt className="text-stone-500">Miles traveled</dt><dd className="text-amber-200 font-pixel">{state.totalMilesTraveled}</dd></div>
              <div><dt className="text-stone-500">Rivers crossed</dt><dd className="text-amber-200 font-pixel">{state.riversCrossed}</dd></div>
              <div><dt className="text-stone-500">Last landmark</dt><dd className="text-amber-200 font-pixel">{state.currentLandmark}</dd></div>
            </dl>

            <button
              data-testid="passing-lay-to-rest"
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
            {familyPortrait}

            <p className="text-stone-300 mb-6 leading-relaxed">
              An heir takes up the reins. They carry the family name, the stories
              told about {fallen}, and the particular stubbornness that got the
              wagon this far.
            </p>

            <p className="text-xs text-stone-500 mb-8">
              Heirloom carried forward: <span className="text-amber-300 font-pixel">{heirloomTrait}</span>
            </p>

            <button
              data-testid="passing-heir"
              onClick={continueAsHeir}
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
