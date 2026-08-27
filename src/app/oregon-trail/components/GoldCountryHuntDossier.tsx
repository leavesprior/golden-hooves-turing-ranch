'use client'

import { getGoldCountryLocation } from '../data/goldCountryLocations'
import { STREET_POSTERS, type TakenWarrant } from '@/lib/goldCountryStreet'
import { activeHuntStatuses, trailForPoster } from '@/lib/goldCountryHunt'

export function GoldCountryHuntDossier({
  takenWarrants,
  arrests,
  collected,
}: {
  takenWarrants: TakenWarrant[]
  arrests: string[]
  collected: string[]
}) {
  const takenIds = takenWarrants.map((t) => t.id)
  const hunts = activeHuntStatuses(takenIds, arrests, collected)
  if (hunts.length === 0) return null

  return (
    <div className="west-face-paper" data-testid="l3-hunt-dossier">
      <p className="west-face-eyebrow">Level 3 · the hunt</p>
      <p className="west-face-body text-sm mt-1">
        The paper is not the man. Show it. Follow the street. He is in the wind until the cards run hot.
      </p>
      <ul className="mt-3 space-y-3">
        {hunts.map((hunt) => {
          const poster = STREET_POSTERS.find((p) => p.id === hunt.posterId)
          const trail = trailForPoster(hunt.posterId)
          const next = hunt.nextLocationId ? getGoldCountryLocation(hunt.nextLocationId) : undefined
          const paper = takenWarrants.find((t) => t.id === hunt.posterId)
          return (
            <li key={hunt.posterId} data-testid={`l3-hunt-${hunt.posterId}`}>
              <p className="font-serif text-[#e8dcc4]">
                {poster?.alias ?? hunt.posterId}
                {paper ? ` · ${paper.approach === 'alive' ? 'alive' : 'dead or alive'} · ${paper.bountyAtTake}🌮` : ''}
              </p>
              <p className="text-sm text-[#b8a88a] font-serif">
                {hunt.served
                  ? 'Served. The poster is satisfied.'
                  : hunt.hot
                    ? `The trail is hot. He is back at ${trail ? getGoldCountryLocation(trail.hideLocationId)?.name : 'the last door'}.`
                    : `In the wind · ${hunt.have}/${hunt.need} cards`}
              </p>
              {hunt.cards.map((card) => (
                <p key={card.id} className="mt-1 font-serif text-[11px] tracking-wide text-[#cbbfa6]">
                  {card.card}
                </p>
              ))}
              {!hunt.served && next && (
                <p className="mt-1 font-serif text-sm text-amber-200/90">
                  Next: {next.name}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
