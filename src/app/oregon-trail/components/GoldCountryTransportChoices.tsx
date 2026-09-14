'use client'

import { useState } from 'react'
import { useOregonTrail } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useCharacter } from '../characterContext'
import { GOLD_COUNTRY_LOCATIONS } from '../data/goldCountryLocations'
import { LEVEL2_CASE_IDS } from '@/lib/goldCountryLevel2'
import { getGoldCountryCalendar, quoteGoldCountryTransport, type GoldCountryTransportMode } from '@/lib/goldCountryTransport'
import { isActiveGoldCountryTrip } from '../state/goldCountryTrip'

export function formatTravelMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return `${hours ? `${hours}h` : ''}${hours && remainder ? ' ' : ''}${remainder ? `${remainder}m` : ''}` || '0m'
}

export function GoldCountryCalendar() {
  const { state } = useOregonTrail()
  const calendar = getGoldCountryCalendar(state)
  return <p className="west-face-body text-sm mt-2" data-testid="gold-country-calendar">
    {calendar ? `Year ${calendar.year} · day ${calendar.dayOfYear} of 360 · ${String(Math.floor(calendar.goldCountryMinute / 60)).padStart(2, '0')}:${String(calendar.goldCountryMinute % 60).padStart(2, '0')}` : 'Calendar unavailable: load a valid trail save to resume travel.'}
    <span className="block text-xs opacity-80">Simulation calendar · starts in 1849 · trail days and Gold Country days both count.</span>
  </p>
}

export function GoldCountryTransportChoices({ toLocationId, onDepart }: { toLocationId: string; onDepart?: () => void }) {
  const { state, startGoldCountryTravel } = useOregonTrail()
  const { balance, isInitialized } = useKarmaWallet()
  const { getStat } = useCharacter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const current = state.currentGoldCountryLocation || 'bobr_cabin'
  const luck = getStat('Luck')
  const busy = pending || isActiveGoldCountryTrip(state.goldCountryTrip)
  const calendar = getGoldCountryCalendar(state)

  const depart = async (mode: GoldCountryTransportMode) => {
    if (pending) return
    setPending(true)
    setError('')
    const result = await startGoldCountryTravel(toLocationId, mode, luck)
    if (result.ok) onDepart?.()
    else setError(result.reason === 'storage' ? 'The journey could not be saved. Free some browser storage, then try again.'
      : result.reason === 'funds' ? 'There are not enough tacos for this fare.' : 'The road is unavailable. Check your calendar or resume the current journey.')
    setPending(false)
  }

  return <div className="space-y-2" data-testid="gold-country-transport-choices">
    <p className="west-face-eyebrow">Choose your road</p>
    <div className="flex flex-col gap-2">
      {(['wagon', 'stage', 'rail'] as const).map(mode => {
        const best = quoteGoldCountryTransport({ fromId: current, toId: toLocationId, mode, clock: state, luck, roll: mode === 'wagon' ? undefined : 0.99 })
        const worst = quoteGoldCountryTransport({ fromId: current, toId: toLocationId, mode, clock: state, luck, roll: mode === 'wagon' ? undefined : 0 })
        const label = mode === 'wagon' ? (state.oxen > 0 ? 'Wagon' : 'On foot') : mode === 'stage' ? 'Stage' : 'Rail'
        const affordable = best.ok && balance.neutral >= best.quote.fare
        const unavailable = !best.ok ? mode === 'stage' && (calendar?.year ?? 1849) < 1852 ? 'opens in 1852'
          : mode === 'rail' && (calendar?.year ?? 1849) < 1869 ? 'opens in 1869'
            : mode === 'rail' ? 'Sacramento–Roseville only' : 'calendar or route unavailable'
          : !affordable ? `need ${best.quote.fare} tacos` : ''
        return <button key={mode} type="button" data-testid={`transport-mode-${mode}`}
          disabled={busy || !best.ok || (mode !== 'wagon' && (!isInitialized || !affordable))}
          onClick={() => void depart(mode)}
          className="west-face-pill min-h-11 justify-center disabled:opacity-50 disabled:cursor-not-allowed">
          {label} · {best.ok ? `${best.quote.fare ? `${best.quote.fare} tacos` : 'no fare'} · ${formatTravelMinutes(best.quote.durationMinutes)}${worst.ok && worst.quote.durationMinutes !== best.quote.durationMinutes ? `–${formatTravelMinutes(worst.quote.durationMinutes)}` : ''}` : unavailable}
          {best.ok && unavailable ? ` · ${unavailable}` : ''}
        </button>
      })}
    </div>
    <p className="west-face-body text-xs">Local stage charters are fictional game services from 1852. Luck affects paid delays; fares use game tacos.</p>
    {error && <p role="alert" className="text-amber-200 text-sm">{error}</p>}
  </div>
}

/** The regional gateways are outside the painted map; this list is not a GPS pin. */
export function GoldCountryRoutePicker() {
  const { state } = useOregonTrail()
  const [destination, setDestination] = useState('')
  const year = getGoldCountryCalendar(state)?.year ?? 1849
  const known = new Set([...state.discoveredGoldLocations, ...LEVEL2_CASE_IDS])
  const destinations = GOLD_COUNTRY_LOCATIONS.filter(location => location.id !== state.currentGoldCountryLocation
    && (location.transportGateway ? year >= location.transportGateway.availableFromYear : known.has(location.id)))
  return <section className="west-face-paper space-y-3" data-testid="gold-country-route-picker">
    <label className="block west-face-eyebrow" htmlFor="gold-country-road-destination">Travel from this town</label>
    <select id="gold-country-road-destination" className="min-h-11 w-full rounded border border-[var(--west-line)] bg-[#201c14] p-2 text-[#e8dcc4]"
      value={destination} onChange={event => setDestination(event.target.value)}>
      <option value="">Choose a destination</option>
      {destinations.map(location => <option key={location.id} value={location.id}>{location.shortName}</option>)}
    </select>
    {destination && destinations.some(location => location.id === destination) && <GoldCountryTransportChoices toLocationId={destination} />}
  </section>
}
