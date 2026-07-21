/**
 * DM directive state transforms — pure functions applied by the reducer's
 * APPLY_DM_DIRECTIVE case (DM Layer P1, NEOMA_DM_LAYER_20260715.md §3).
 *
 * Every directive is re-validated here (defense in depth — the queue already
 * validated on write and read; a directive that arrives invalid is DROPPED,
 * never partially applied). No new state fields are introduced: directives
 * bend EXISTING systems (weather, supplies, the random-event stage), so
 * old saves need no migration for this feature.
 *
 * FICTION GUARD: directive-spawned events carry NO karma deltas in any
 * outcome — karma flows only through the game's existing earn paths (P1 rule,
 * see src/lib/dmDirectives.ts header).
 */

import type { OregonTrailState, RandomEvent, GamePhase } from './types'
import { validateDmDirective, ITEM_GRANT_CAPS, type DmDirective } from '@/lib/dmDirectives'
import { getOutlaw, type Outlaw } from '../data/outlaws'

/**
 * Phases where a boss encounter can honestly interrupt play — TravelScreen
 * renders EventScreen for phase 'event', which it only does from the trail
 * sub-phases. A boss directive arriving in any other phase is dropped
 * (the queue poller only runs in these phases, so this is belt-and-suspenders).
 */
const BOSS_SPAWNABLE_PHASES: ReadonlySet<GamePhase> = new Set(['traveling', 'town'])

/**
 * Build the boss confrontation as a standard RandomEvent.
 *
 * SMALLEST HONEST PATH (documented per the P1 build order): oregon-trail has
 * no boss/combat screen — its confrontation surfaces are the RandomEvent
 * stage (EventScreen) and the warrant/telegraph mystery flow. Adventure
 * mode's ConfrontationView is a different app tree and porting it is P2+.
 * So `encounter.boss` spawns a hostile ENCOUNTER event through the existing
 * event system, named and flavored by the referenced outlaw.
 */
export function buildBossEncounterEvent(outlaw: Outlaw, reason?: string): RandomEvent {
  return {
    id: `dm_boss_${outlaw.id}`,
    title: `${outlaw.alias} Rides In!`,
    description:
      `${reason ? reason + ' ' : ''}${outlaw.alias} blocks the trail ahead. ` +
      `${outlaw.description} "${outlaw.catchphrase}"`,
    choices: [
      {
        id: 'stand_ground',
        text: `Stand your ground against ${outlaw.alias}`,
        outcome: {
          message: `Shots crack the air. You hold the line and ${outlaw.alias} breaks off — but it cost you.`,
          ammoDelta: -20,
          healthDelta: -10,
        },
      },
      {
        id: 'hand_over',
        text: 'Hand over supplies to buy safe passage',
        outcome: {
          message: `${outlaw.alias} picks through your stores and leaves you the rest. You keep your hide.`,
          foodDelta: -40,
        },
      },
      {
        id: 'flee',
        text: 'Scatter into the brush and circle wide',
        outcome: {
          message: 'You lose a day doubling back through rough country, nursing scrapes and pride.',
          daysLost: 1,
          healthDelta: -5,
        },
      },
    ],
  }
}

/**
 * Apply one validated DM directive to game state. Invalid or inapplicable
 * directives return `prev` unchanged (drop, never partial-apply). The caller
 * (context wrapper) owns logging side effects.
 */
export function applyDmDirectiveState(
  prev: OregonTrailState,
  raw: DmDirective,
): OregonTrailState {
  const v = validateDmDirective(raw)
  if (!v.ok) return prev
  const directive = v.directive

  switch (directive.kind) {
    case 'weather.set': {
      if (prev.weather === directive.weather) return prev
      return {
        ...prev,
        weather: directive.weather,
        message: directive.reason
          ? `${directive.reason} The weather turns to ${directive.weather}.`
          : `An improbable shift in the sky — the weather turns to ${directive.weather}.`,
      }
    }

    case 'item.grant': {
      // Validator already rejected over-cap; clamp again anyway (last boundary).
      const qty = Math.min(directive.qty, ITEM_GRANT_CAPS[directive.resource])
      const label = directive.reason ?? 'A gift finds its way into your wagon.'
      switch (directive.resource) {
        case 'food':
          return { ...prev, food: prev.food + qty, message: `${label} (+${qty} lbs food)` }
        case 'ammunition':
          return { ...prev, ammunition: prev.ammunition + qty, message: `${label} (+${qty} rounds)` }
        case 'medicine':
          return { ...prev, medicine: prev.medicine + qty, message: `${label} (+${qty} medicine)` }
        case 'spareParts':
          return { ...prev, spareParts: prev.spareParts + qty, message: `${label} (+${qty} spare parts)` }
        case 'clothing':
          return { ...prev, clothing: prev.clothing + qty, message: `${label} (+${qty} clothing)` }
        case 'oxen':
          return { ...prev, oxen: prev.oxen + qty, message: `${label} (+${qty} oxen)` }
      }
      return prev
    }

    case 'encounter.boss': {
      if (!BOSS_SPAWNABLE_PHASES.has(prev.phase)) return prev
      if (prev.currentEvent) return prev // never clobber an in-flight event
      const outlaw = getOutlaw(directive.enemyId)
      if (!outlaw) return prev // validator guarantees this, but never trust one gate
      return {
        ...prev,
        currentEvent: buildBossEncounterEvent(outlaw, directive.reason),
        phase: 'event',
        previousPhase: prev.phase,
      }
    }

    default:
      return prev
  }
}
