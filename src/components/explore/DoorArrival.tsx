'use client'

import { useState, useSyncExternalStore } from 'react'
import { localPlacesFor } from '@/lib/localPlaces'
import { atDoor } from '@/lib/outOfTime'
import { OutOfTimeCard } from './OutOfTimeCard'

const noSubscribe = () => () => {}

/**
 * A guest who scanned the card at a real door lands here first: the place,
 * its keeper, then the way into the game. Full screen, because in town the
 * guest layer is a short strip under the 1849 street.
 */
export function DoorArrival({ townId, townName }: { townId: string; townName: string }) {
  const placeId = useSyncExternalStore(
    noSubscribe,
    () => localPlacesFor(townId).find((p) => p.outOfTime && atDoor(window.location.search, p.outOfTime))?.id ?? '',
    () => '',
  )
  const [dismissed, setDismissed] = useState(false)
  const place = placeId ? localPlacesFor(townId).find((p) => p.id === placeId) : undefined
  if (!place?.outOfTime || dismissed) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0e0c0a] px-4 py-5" role="dialog" aria-label={`At the door of ${place.name}`} data-testid="door-arrival">
      <p className="west-face-eyebrow">At the door · {townName}</p>
      <h1 className="west-face-title text-2xl">{place.name}</h1>
      <p className="font-serif text-xs text-[#e8dcc4]">{place.address}</p>
      <p className="mt-1 font-serif text-xs text-[#e8dcc4]">{place.today}</p>
      <OutOfTimeCard placeId={place.id} placeName={place.name} townName={townName} oot={place.outOfTime} />
      <button type="button" className="west-face-pill mt-4 min-h-11 w-full text-sm" onClick={() => setDismissed(true)} data-testid="door-arrival-enter">
        Walk {townName} in 1849 →
      </button>
    </div>
  )
}
