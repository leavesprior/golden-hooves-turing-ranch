'use client'

import { useState } from 'react'
import {
  MAX_ACCURACY_FOR_HERE_M,
  distanceLabel,
  parseSimulatedPlaceFix,
  placeTier,
  type Fix,
  type OutOfTime,
} from '@/lib/outOfTime'

/**
 * Today ⇄ Out of time for one real place. From afar it is a place to see; in
 * town it points the way; at the door its keeper speaks. Location is read on
 * the device when the guest taps, and never sent anywhere.
 */
export function OutOfTimeCard({ placeId, placeName, townName, oot }: { placeId: string; placeName: string; townName: string; oot: OutOfTime }) {
  const [era, setEra] = useState<'today' | 'then'>('today')
  const [inside, setInside] = useState(false)
  const [fix, setFix] = useState<Fix | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const locate = () => {
    const sim = parseSimulatedPlaceFix(window.location.search, placeId, oot.point, window.location.hostname)
    if (sim) {
      setFix(sim)
      setNote(null)
      return
    }
    if (!('geolocation' in navigator)) {
      setNote('This device cannot share its location. The place still shows; the keeper only speaks at the door.')
      return
    }
    setNote('Finding you…')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setFix({ lat: p.coords.latitude, lng: p.coords.longitude, accuracyM: Math.round(p.coords.accuracy) })
        setNote(null)
      },
      () => setNote('Location is off. The place still shows; the keeper only speaks at the door.'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    )
  }

  const where = fix ? placeTier(fix, oot) : null
  const tooRough = !!fix && where?.tier === 'in_town' && fix.accuracyM > MAX_ACCURACY_FOR_HERE_M && where.meters <= oot.keeper.radiusM + fix.accuracyM
  const src = era === 'today' ? oot.plateToday : inside && oot.plateThenInside ? oot.plateThenInside : oot.plateThen
  const alt =
    era === 'today'
      ? `${placeName} today, painted`
      : `${placeName} imagined ${oot.era}${inside ? ', inside' : ''} — painted interpretation`

  return (
    <div className="mt-2" data-testid={`out-of-time-${placeId}`}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="When to see it">
        <button type="button" className="west-face-pill min-h-11 text-xs" aria-pressed={era === 'today'} onClick={() => setEra('today')} data-testid="oot-today">
          Today
        </button>
        <button type="button" className="west-face-pill min-h-11 text-xs" aria-pressed={era === 'then'} onClick={() => setEra('then')} data-testid="oot-then">
          Out of time · {oot.era}
        </button>
        {era === 'then' && oot.plateThenInside && (
          <button type="button" className="west-face-pill min-h-11 text-xs" aria-pressed={inside} onClick={() => setInside((v) => !v)} data-testid="oot-inside">
            {inside ? 'Step back outside' : 'Step inside'}
          </button>
        )}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={1600} height={900} loading="lazy" className="mt-2 w-full h-auto rounded-sm" data-testid="oot-plate" />
      {era === 'then' && (
        <p className="mt-1 font-serif text-[11px] italic text-[#b8a88a]" data-testid="oot-label">{oot.interpretationLabel}</p>
      )}
      <p className="mt-1 font-serif text-[11px] text-[#e8dcc4]"><span className="text-[#b8a88a]">What’s known: </span>{oot.known}</p>

      <div className="mt-2">
        <button type="button" className="west-face-pill min-h-11 text-xs" onClick={locate} data-testid="oot-locate">
          How far am I?
        </button>
        {note && <p className="mt-1 font-serif text-[11px] text-[#b8a88a]">{note}</p>}
        {where && where.tier === 'far' && (
          <p className="mt-1 font-serif text-xs text-[#e8dcc4]" data-testid="oot-far">
            A place to see — {distanceLabel(where.meters)} away, in {townName}.
          </p>
        )}
        {where && where.tier === 'in_town' && (
          <p className="mt-1 font-serif text-xs text-[#e8dcc4]" data-testid="oot-in-town">
            {tooRough
              ? `You may be at the door, but your location is only good to ±${fix!.accuracyM} m. Step into the open and ask again.`
              : `You’re in ${townName} — ${distanceLabel(where.meters)} to the door. Walk closer; someone is waiting.`}
          </p>
        )}
        {where && where.tier === 'here' && (
          <div className="mt-2 border-l-2 border-[#8b2e2e] pl-3" data-testid="oot-keeper">
            <p className="west-face-eyebrow">{oot.keeper.name}</p>
            {oot.keeper.lines.map((line) => (
              <p key={line} className="mt-1 font-serif text-xs text-[#f3ead8]">{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
