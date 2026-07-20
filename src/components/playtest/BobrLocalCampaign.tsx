'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FormEvent, ReactNode, useEffect, useReducer, useRef, useState } from 'react'
import {
  AgeMode,
  campaignReducer,
  createLocalCampaign,
  formatCampaignTime,
  getAvailableVolcanoChoices,
  getMarketQuotes,
  getSaloonOffer,
  FREE_INVESTIGATIONS,
  isBeforeCurtain,
  isBoundedNpcResponse,
  JourneyImport,
  loadLocalCampaign,
  LocalCampaignState,
  PERIL_EVENTS,
  PlayerPresentation,
  PlayerRole,
  ROLE_LABELS,
  ROLE_MARKS,
  saveLocalCampaign,
  SUSPECTS,
  TRAVEL_MODES,
  TravelMode,
  VolcanoChoiceId,
} from '@/lib/bobrLocalCampaign'
import { PLAYTEST_SYNC_ENABLED, syncPlaytestOutcome } from '@/lib/bobrPlaytestBridge'
import { readProductionJourneyImport } from '@/lib/bobrJourneyAdapter'
import { VOLCANO_THEATRE_ENCOUNTER, type EncounterActorId } from '@/lib/bobrEncounter'
import { getGoldCountryMapNodes, GOLD_COUNTRY_ROUTES, milesBetween } from '@/lib/bobrRegionalMap'
import { readKarmaMarketSignal, type KarmaMarketSignal } from '@/lib/bobrMarketSignal'

type ViewId = 'journey' | 'map' | 'casebook' | 'world' | 'test'
type NpcId = EncounterActorId

const NAV: Array<{ id: ViewId; label: string; mark: string }> = [
  { id: 'journey', label: 'Journey', mark: '>' },
  { id: 'map', label: 'Map', mark: '+' },
  { id: 'casebook', label: 'Casebook', mark: '#' },
  { id: 'world', label: 'World', mark: '$' },
  { id: 'test', label: 'Test tools', mark: '*' },
]

const NPCS = Object.fromEntries(
  VOLCANO_THEATRE_ENCOUNTER.actors.map((actor) => [actor.id, actor]),
) as Record<NpcId, (typeof VOLCANO_THEATRE_ENCOUNTER.actors)[number]>

function panelClass(extra = ''): string {
  return 'overflow-hidden rounded-lg border border-[#9a7a48]/55 bg-[#171b1b]/95 shadow-[0_18px_48px_rgba(0,0,0,0.35)] ' + extra
}

function ActionButton({ children, onClick, disabled = false, tone = 'amber' }: { children: ReactNode; onClick: () => void; disabled?: boolean; tone?: 'amber' | 'green' | 'red' }) {
  const colors = tone === 'green'
    ? 'border-emerald-500 bg-emerald-950/80 text-emerald-100 hover:bg-emerald-900'
    : tone === 'red'
      ? 'border-red-500 bg-red-950/80 text-red-100 hover:bg-red-900'
      : 'border-amber-500 bg-amber-950/80 text-amber-100 hover:bg-amber-900'
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={'min-h-14 rounded-md border px-4 py-3 text-left text-sm leading-relaxed transition-colors disabled:cursor-not-allowed disabled:opacity-40 ' + colors}>
      {children}
    </button>
  )
}

function Scene({ src, alt, eyebrow, title, children }: { src: string; alt: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="relative min-h-[620px] overflow-hidden rounded-lg border border-[#b89355] bg-black shadow-[0_24px_70px_rgba(0,0,0,.5)] sm:min-h-[680px]">
      <Image src={src} alt={alt} fill priority className="visual64-scene-image object-cover" sizes="(max-width: 900px) 100vw, 1100px" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,9,.18),rgba(7,10,9,.05)_38%,rgba(7,10,9,.45)_58%,rgba(7,10,9,.98)_88%)]" />
      <div className="absolute inset-x-0 top-0 h-1 bg-[#d4a950]" />
      <div className="relative z-10 flex min-h-[620px] flex-col justify-between p-4 sm:min-h-[680px] sm:p-6">
        <div className="max-w-3xl rounded-md border border-white/15 bg-[#111716]/90 p-4 shadow-xl backdrop-blur-md">
          <p className="mb-2 text-xs font-semibold uppercase text-[#8ed5d2]">{eyebrow}</p>
          <h2 className="text-2xl leading-snug text-[#f0d69a] sm:text-3xl">{title}</h2>
        </div>
        <div>{children}</div>
      </div>
    </section>
  )
}

type FigureRole = PlayerRole | 'actor' | 'headmistress'
type SpriteId = PlayerRole | 'actor' | 'nell' | 'headmistress'

function RoleFigure({ role, label, sprite = role }: { role: FigureRole; label: string; sprite?: SpriteId }) {
  return (
    <div className="flex w-[112px] flex-col items-center" aria-label={label}>
      <div className="visual64-character-sprite" data-sprite={sprite} aria-hidden="true" />
      <strong className="mt-1 rounded bg-black/80 px-2 py-1 text-center text-[11px] leading-tight text-[#f2dfb5]">{label}</strong>
    </div>
  )
}

function PartyStrip({ state }: { state: LocalCampaignState }) {
  return (
    <div className="mb-4 flex min-h-[142px] flex-wrap items-end gap-2 rounded-md border border-white/15 bg-black/35 px-3 pt-2 backdrop-blur-[2px]" aria-label="Player party">
      {state.player.party.map((role, index) => (
        <RoleFigure key={role} role={role} label={index === 0 ? state.player.name : ROLE_LABELS[role]} />
      ))}
    </div>
  )
}

function SetupView({ state, dispatch, productionJourney }: CampaignViewProps) {
  const [name, setName] = useState(state.player.name)
  const [role, setRole] = useState<PlayerRole>(state.player.role)
  const [ageMode, setAgeMode] = useState<AgeMode>(state.player.ageMode)
  const [presentation, setPresentation] = useState<PlayerPresentation>(state.player.presentation)

  function begin(journey?: JourneyImport | null) {
    dispatch({ type: 'START', profile: { name, role, ageMode, presentation } })
    if (journey) dispatch({ type: 'IMPORT_JOURNEY', journey })
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    begin()
  }

  return (
    <section className={panelClass('p-4 sm:p-6')}>
      <p className="mb-2 text-[8px] uppercase text-cyan-300">Local campaign setup</p>
      <h2 className="mb-3 text-[18px] leading-relaxed text-amber-200">Build the party that will enter the case.</h2>
      <p className="mb-6 max-w-3xl text-[11px] leading-6 text-stone-300">The first local build keeps D&D-style checks beneath S.A.D.D.L.E. language. Your lead role changes valid approaches; companions keep other kinds of knowledge visible without making every character interchangeable.</p>
      {productionJourney && (
        <div className="mb-6 rounded-md border border-cyan-600/70 bg-cyan-950/45 p-4">
          <p className="text-xs font-semibold uppercase text-cyan-200">Prior journey found</p>
          <h3 className="mt-2 text-lg text-[#f0d69a]">The production ledger can enter this case as evidence.</h3>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-200">
            {productionJourney.timeChaseComplete && <span className="rounded border border-cyan-700 bg-black/40 px-2 py-1">Vane warrant complete</span>}
            {productionJourney.trailComplete && <span className="rounded border border-cyan-700 bg-black/40 px-2 py-1">Trail complete</span>}
            {productionJourney.reachedGoldCountry && <span className="rounded border border-cyan-700 bg-black/40 px-2 py-1">Gold Country reached</span>}
            <span className="rounded border border-stone-600 bg-black/40 px-2 py-1">{productionJourney.sourceEventCount} ledger events read</span>
          </div>
          <p className="mt-3 text-sm text-stone-300">Continuing imports clues and bounded world effects only. It does not copy balances, issue karma, or modify the production save.</p>
        </div>
      )}
      <form onSubmit={submit} className="space-y-6">
        <label className="block max-w-xl text-[9px] text-amber-100">PLAYER NAME
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={32} className="mt-2 min-h-12 w-full border-2 border-stone-600 bg-black px-3 text-[12px] text-white" />
        </label>
        <fieldset>
          <legend className="mb-2 text-[9px] text-amber-100">LEAD ROLE</legend>
          <div className="grid gap-2 md:grid-cols-4">
            {(Object.keys(ROLE_LABELS) as PlayerRole[]).map((id) => (
              <button key={id} type="button" onClick={() => setRole(id)} aria-pressed={role === id} className={'min-h-24 border-2 p-3 text-left ' + (role === id ? 'border-cyan-300 bg-cyan-950 text-white' : 'border-stone-600 bg-black/60 text-stone-300')}>
                <span className="mb-2 block text-[13px] text-amber-300">{ROLE_MARKS[id]}</span>
                <strong className="text-[9px]">{ROLE_LABELS[id]}</strong>
              </button>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-5 md:grid-cols-2">
          <fieldset>
            <legend className="mb-2 text-[9px] text-amber-100">CONTENT MODE</legend>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setAgeMode('under18')} aria-pressed={ageMode === 'under18'} className={'min-h-12 border-2 px-3 text-[9px] ' + (ageMode === 'under18' ? 'border-cyan-300 bg-cyan-950' : 'border-stone-600 bg-black')}>UNDER 18</button>
              <button type="button" onClick={() => setAgeMode('adult')} aria-pressed={ageMode === 'adult'} className={'min-h-12 border-2 px-3 text-[9px] ' + (ageMode === 'adult' ? 'border-cyan-300 bg-cyan-950' : 'border-stone-600 bg-black')}>ADULT</button>
            </div>
          </fieldset>
          <label className="text-[9px] text-amber-100">CHARACTER PRESENTATION
            <select value={presentation} onChange={(event) => setPresentation(event.target.value as PlayerPresentation)} className="mt-2 min-h-12 w-full border-2 border-stone-600 bg-black px-3 text-[10px] text-white">
              <option value="self_described">Let actions introduce me</option>
              <option value="woman">Woman</option>
              <option value="man">Man</option>
              <option value="nonbinary">Nonbinary</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="min-h-14 rounded border-2 border-amber-300 bg-amber-700 px-5 text-[11px] text-black hover:bg-amber-500">BEGIN THE COMPLETE LOCAL CAMPAIGN</button>
          {productionJourney && (
            <button type="button" onClick={() => begin(productionJourney)} className="min-h-14 rounded border-2 border-cyan-400 bg-cyan-950 px-5 text-[11px] text-cyan-100 hover:bg-cyan-900">CONTINUE WITH PRODUCTION HISTORY</button>
          )}
        </div>
      </form>
    </section>
  )
}

function EscapeView({ state, dispatch }: CampaignViewProps) {
  return (
    <Scene src="/place-art/welcome_gate.png" alt="The Back of Beyond gate across several eras" eyebrow="Opening: Vane's escape" title="The same land changes clothes. A false presence leaves the same mark.">
      <PartyStrip state={state} />
      <div className="grid gap-2 md:grid-cols-3">
        <ActionButton onClick={() => dispatch({ type: 'ESCAPE_CHOICE', choice: 'trace_tare' })}><strong className="block text-cyan-200">TRACE THE TARE</strong>Study the shaved brass mark and carry an extra lead into 1849.</ActionButton>
        <ActionButton onClick={() => dispatch({ type: 'ESCAPE_CHOICE', choice: 'warn_post' })}><strong className="block text-cyan-200">WARN THE TRADING POST</strong>Protect the road before Vane can turn false dust into real supplies.</ActionButton>
        <ActionButton onClick={() => dispatch({ type: 'ESCAPE_CHOICE', choice: 'cut_off' })}><strong className="block text-cyan-200">CUT HIM OFF</strong>Spend supplies to reach the time breach first.</ActionButton>
      </div>
    </Scene>
  )
}

function TrailView({ state, dispatch }: CampaignViewProps) {
  return (
    <Scene src="/place-art/ch1_fort_kearny.png" alt="Oregon Trail fort and wagon road" eyebrow="1849: the road remembers" title="A freight wagon is cornered between thieves and a tense passage negotiation.">
      <PartyStrip state={state} />
      <div className="mb-3 border border-cyan-700 bg-black/80 p-3 text-[10px] leading-5 text-stone-200">This is not a morality quiz. Each choice changes downstream supply, road safety, relationships, prices, and which witnesses will talk later.</div>
      <div className="grid gap-2 md:grid-cols-3">
        <ActionButton onClick={() => dispatch({ type: 'TRAIL_CHOICE', choice: 'stop_thieves' })} tone="green"><strong className="block text-emerald-200">STOP THE THIEVES</strong>Risk two supplies; protect the freight and improve trade safety.</ActionButton>
        <ActionButton onClick={() => dispatch({ type: 'TRAIL_CHOICE', choice: 'fair_trade' })} tone="green"><strong className="block text-emerald-200">MAKE A FAIR AGREEMENT</strong>Pay fairly, respect the route, and gain trusted passage knowledge.</ActionButton>
        <ActionButton onClick={() => dispatch({ type: 'TRAIL_CHOICE', choice: 'rush' })} tone="red"><strong className="block text-red-200">KEEP MOVING</strong>Preserve your supplies while leaving the road danger unresolved.</ActionButton>
      </div>
    </Scene>
  )
}

function ArrivalView({ state, dispatch }: CampaignViewProps) {
  const prices = getMarketQuotes(state)
  return (
    <Scene src="/place-art/west_point.png" alt="West Point in Gold Country" eyebrow="Level 2 gateway" title="The trail did not end. It delivered consequences into a living region.">
      <div className="grid gap-3 md:grid-cols-[1fr_260px]">
        <div className="border border-amber-700 bg-black/85 p-4 text-[10px] leading-5 text-stone-200">
          <p className="mb-3">A theatre messenger reaches West Point: Volcano's lead actor vanished after finding a false assay ticket beneath the stage. The evening crowd arrives before dark.</p>
          <ActionButton onClick={() => dispatch({ type: 'ENTER_GOLD_COUNTRY' })} tone="green">OPEN THE REGIONAL MAP AND TAKE THE CASE</ActionButton>
        </div>
        <div className="border border-cyan-800 bg-black/85 p-3">
          <h3 className="mb-2 text-[9px] text-cyan-200">FIRST MARKET ECHO</h3>
          {prices.map((quote) => <div key={quote.id} className="flex justify-between border-t border-stone-700 py-2 text-[9px]"><span>{quote.label}</span><strong className="text-amber-200">{quote.price} nK</strong></div>)}
        </div>
      </div>
    </Scene>
  )
}

function TravelView({ dispatch }: CampaignViewProps) {
  return (
    <section className={panelClass('p-3 sm:p-5')}>
      <h2 className="mb-2 text-[15px] leading-relaxed text-amber-200">Choose how the party reaches Volcano.</h2>
      <p className="mb-4 text-[10px] leading-5 text-stone-300">Travel speed advances weather, daylight, supplies, NPC schedules, and market conditions. The schematic map is oriented north-up from curated coordinates.</p>
      <RegionalMap active="west_point" />
      <div className="mt-4 grid gap-2 md:grid-cols-4">
        {(Object.keys(TRAVEL_MODES) as TravelMode[]).map((mode) => {
          const item = TRAVEL_MODES[mode]
          return <ActionButton key={mode} onClick={() => dispatch({ type: 'TRAVEL', mode })}><strong className="block text-cyan-200">{item.label.toUpperCase()} · {item.minutes} MIN</strong>{item.note}</ActionButton>
        })}
      </div>
    </section>
  )
}

function PerilView({ state, dispatch }: CampaignViewProps) {
  const peril = state.volcano.perilId ? PERIL_EVENTS[state.volcano.perilId] : null
  if (!peril) return null
  return (
    <Scene src="/place-art/ch1_fort_kearny.png" alt="Trouble on the road to Volcano" eyebrow="On the road: the trail answers back" title={peril.title + '.'}>
      <PartyStrip state={state} />
      <div className="mb-3 border border-amber-700 bg-black/80 p-3 text-[10px] leading-5 text-stone-200">{peril.detail} Neither choice ends the journey — the road is survivable with thought. It only asks what the party will spend: goods, or daylight.</div>
      <div className="grid gap-2 md:grid-cols-2">
        {peril.options.map((option) => (
          <ActionButton key={option.id} onClick={() => dispatch({ type: 'PERIL_CHOICE', option: option.id })} tone={option.supplies > 0 ? 'amber' : 'green'}>
            <strong className="block text-cyan-200">{option.label.toUpperCase()}</strong>
            {option.detail}
            <span className="mt-1 block text-[9px] text-stone-400">
              {option.supplies > 0 ? '-' + option.supplies + ' supplies · ' : ''}+{option.minutes} min{option.leads > 0 ? ' · +1 lead' : ''}
            </span>
          </ActionButton>
        ))}
      </div>
    </Scene>
  )
}

function CurtainClock({ state }: { state: LocalCampaignState }) {
  const before = isBeforeCurtain(state)
  return (
    <div className={'mb-3 flex items-center justify-between border p-2 text-[10px] ' + (before ? 'border-cyan-700 bg-cyan-950/40 text-cyan-100' : 'border-red-800 bg-red-950/40 text-red-200')}>
      <span>{formatCampaignTime(state)}</span>
      <span>{before ? 'The curtain rises at 7:00 PM. Solve it first and the show goes on.' : 'The curtain hour has passed. The case can still close — the evening cannot be given back.'}</span>
    </div>
  )
}

function VolcanoView({ state, dispatch }: CampaignViewProps) {
  const choices = getAvailableVolcanoChoices(state.player.role, state.flags, state.player.party)
  const evidenceCount = state.volcano.evidence.length
  const nextCostsLead = evidenceCount >= FREE_INVESTIGATIONS
  const canAmend = state.flags.wrong_accusation && !state.volcano.amendsMade
  return (
    <Scene src="/place-art/volcano.png" alt="Volcano main street and theatre district" eyebrow={'Volcano, ' + VOLCANO_THEATRE_ENCOUNTER.era.year + ': ' + VOLCANO_THEATRE_ENCOUNTER.title.toLowerCase()} title="Help first, investigate second, and accuse only what the evidence can hold up.">
      <PartyStrip state={state} />
      <CurtainClock state={state} />
      <div className="mb-4 grid gap-3 rounded-md border border-[#b89355]/50 bg-[#111514]/90 p-3 sm:grid-cols-[auto_1fr_auto_1fr_auto_1fr] sm:items-center">
        {VOLCANO_THEATRE_ENCOUNTER.actors.map((actor) => (
          <div key={actor.id} className="contents">
            <RoleFigure role={actor.id} label={actor.name} sprite={actor.id === 'miner' ? 'nell' : actor.id} />
            <p className="text-sm leading-5 text-stone-300">{actor.scenePrompt}</p>
          </div>
        ))}
      </div>
      <div className="mb-3 grid gap-2 md:grid-cols-[1fr_auto]">
        <p className="border border-stone-700 bg-black/80 p-2 text-[9px] leading-4 text-stone-300">
          INVESTIGATE ({evidenceCount} evidence gathered · each takes 45 min{nextCostsLead ? ' · further digging costs 1 lead' : ' · ' + (FREE_INVESTIGATIONS - evidenceCount) + ' free remaining'})
        </p>
        {canAmend && (
          <ActionButton onClick={() => dispatch({ type: 'MAKE_AMENDS' })} tone="green"><strong className="block">MAKE AMENDS IN PUBLIC</strong>1 hour + 2 supplies. The bad mark stays; the repair joins it.</ActionButton>
        )}
      </div>
      <div className="grid max-h-56 gap-2 overflow-y-auto md:grid-cols-2">
        {choices.map((choice) => {
          const used = state.volcano.evidence.includes(choice.id as VolcanoChoiceId)
          return (
            <ActionButton key={choice.id} disabled={used} onClick={() => dispatch({ type: 'VOLCANO_CHOICE', choice: choice.id as VolcanoChoiceId })} tone={choice.risk === 'high' ? 'red' : choice.risk === 'low' ? 'green' : 'amber'}>
              <strong className="block">{used ? '✓ ' : ''}{choice.label.toUpperCase()}</strong>
              {used ? 'Recorded in the casebook.' : choice.approach + (nextCostsLead ? ' (1 lead)' : '')}
            </ActionButton>
          )
        })}
      </div>
      <div className="mt-4 border-t-2 border-[#b89355]/60 pt-3">
        <p className="mb-2 text-[9px] uppercase text-red-200">Accuse — the town is listening. Evidence gathered decides how much your word is worth.</p>
        <div className="grid gap-2 md:grid-cols-3">
          {SUSPECTS.map((suspect) => {
            const cleared = Boolean(state.flags['cleared_' + suspect.id])
            return (
              <ActionButton key={suspect.id} disabled={evidenceCount === 0 || cleared} onClick={() => dispatch({ type: 'ACCUSE', suspect: suspect.id })} tone={suspect.risk === 'high' ? 'red' : suspect.risk === 'low' ? 'green' : 'amber'}>
                <strong className="block">{cleared ? '✗ ' : ''}{suspect.label.toUpperCase()}</strong>
                {cleared ? 'Accused and cleared. The town remembers.' : evidenceCount === 0 ? 'Gather at least one piece of evidence first.' : suspect.theory}
              </ActionButton>
            )
          })}
        </div>
      </div>
    </Scene>
  )
}

function ResolvedView({ state, dispatch }: CampaignViewProps) {
  const proof = state.casebook.find((entry) => entry.id === 'volcano-proof')
  const verdict = state.volcano.accusation
  const canAmend = state.flags.wrong_accusation && !state.volcano.amendsMade
  return (
    <Scene src="/place-art/vol_st_george.png" alt="St. George Hotel in Volcano" eyebrow="Case consequence" title="The real evidence holds because somebody honestly helped and looked closer.">
      <div className="grid gap-3 md:grid-cols-[1fr_280px]">
        <div className="border border-emerald-600 bg-black/85 p-4">
          <h3 className="mb-2 text-[11px] text-emerald-200">THE FALSE ASSAY BENEATH THE STAGE</h3>
          <p className="text-[10px] leading-5 text-stone-200">{proof?.detail}</p>
          {verdict && (
            <div className="mt-3 grid gap-1 border-t border-stone-700 pt-3 text-[9px] leading-4 text-stone-300" data-testid="verdict-ceremony">
              <span>WHAT THIS VERDICT CHANGED:</span>
              <span className="text-emerald-200">· Evidence held up in public: {verdict.strength} piece{verdict.strength === 1 ? '' : 's'} — {verdict.strength >= 2 ? 'a complete case' : 'correct, but thin'}</span>
              <span className={verdict.beforeCurtain ? 'text-cyan-200' : 'text-red-300'}>· {verdict.beforeCurtain ? 'Closed before the 7 PM curtain — the show went on' : 'Closed after curtain — the evening was already lost'}</span>
              <span className="text-amber-200">· Volcano trust now {state.world.volcanoTrust}/100</span>
              {state.resources.badKarma > 0 && <span className={state.volcano.amendsMade ? 'text-emerald-200' : 'text-red-300'}>· {state.volcano.amendsMade ? 'Harm was done and amends were made — both stand in the ledger' : 'Unamended harm weighed against the town\'s welcome'}</span>}
            </div>
          )}
          <p className="mt-3 text-[9px] leading-5 text-stone-400">Good karma is recorded, never spent. Bad choices remain visible and repairable — repairing them is a choice too.</p>
        </div>
        <div className="grid content-start gap-2">
          {canAmend && (
            <ActionButton onClick={() => dispatch({ type: 'MAKE_AMENDS' })} tone="amber"><strong className="block">MAKE AMENDS IN PUBLIC</strong>1 hour + 2 supplies. The record keeps both marks.</ActionButton>
          )}
          <ActionButton onClick={() => dispatch({ type: 'REVEAL_FUTURE' })} tone="green">FOLLOW THIS VERIFIED ACTION INTO THE FUTURE</ActionButton>
        </div>
      </div>
    </Scene>
  )
}

function FutureView({ state }: { state: LocalCampaignState }) {
  return (
    <Scene src="/place-art/bobr_cabin.png" alt="Back of Beyond Ranch cabin in a future witness scene" eyebrow="Future witness" title="Another player's present contains the trustworthy trace this party left behind.">
      <div className="max-w-3xl border-2 border-cyan-500 bg-black/85 p-4">
        <p className="text-[11px] leading-6 text-stone-100">The future clue is not a review Vane could mint. It is a chain of readable consequences: road freight arrived, Volcano remembers how the party behaved, the casebook names the evidence, and no reward claims more certainty than the visit proved.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="border border-emerald-700 p-3 text-[9px] text-emerald-200">GOOD KARMA<br /><strong className="text-[18px]">{state.resources.goodKarma}</strong></div>
          <div className="border border-cyan-700 p-3 text-[9px] text-cyan-200">CASEBOOK<br /><strong className="text-[18px]">{state.casebook.length}</strong></div>
          <div className="border border-amber-700 p-3 text-[9px] text-amber-200">VOLCANO TRUST<br /><strong className="text-[18px]">{state.world.volcanoTrust}</strong></div>
        </div>
      </div>
    </Scene>
  )
}

interface CampaignViewProps {
  state: LocalCampaignState
  dispatch: React.Dispatch<Parameters<typeof campaignReducer>[1]>
  productionJourney?: JourneyImport | null
}

function JourneyView(props: CampaignViewProps) {
  switch (props.state.chapter) {
    case 'setup': return <SetupView {...props} />
    case 'escape': return <EscapeView {...props} />
    case 'trail': return <TrailView {...props} />
    case 'arrival': return <ArrivalView {...props} />
    case 'travel': return <TravelView {...props} />
    case 'peril': return <PerilView {...props} />
    case 'volcano': return <VolcanoView {...props} />
    case 'resolved': return <ResolvedView {...props} />
    case 'future': return <FutureView state={props.state} />
  }
}

function RegionalMap({ active }: { active: 'west_point' | 'volcano' }) {
  const nodes = getGoldCountryMapNodes()
  const byId = Object.fromEntries(nodes.map((node) => [node.id, node]))
  const distance = milesBetween(byId.west_point, byId.volcano)
  const status: Record<string, string> = {
    volcano: 'PILOT CASE',
    west_point: 'BOBR HQ',
    mokelumne_hill: 'CASE FILE',
    jackson: 'CASE FILE',
    san_andreas: 'COUNTY SEAT',
    angels_camp: 'TWAIN ROUTE',
    murphys: 'CASE FILE',
  }
  return (
    <div data-testid="gold-country-map" className="relative min-h-[540px] overflow-hidden rounded-md border border-[#6f5d38] bg-[#b8ad83] text-[#211d16] shadow-inner">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-label="Geographic projection of the current Amador and Calaveras County game towns">
        <rect x="0" y="0" width="100" height="100" fill="#b8ad83" />
        {[20, 40, 60, 80].map((value) => <line key={'v' + value} x1={value} y1="0" x2={value} y2="100" stroke="#71694f" strokeWidth=".25" strokeDasharray="1 2" />)}
        {[20, 40, 60, 80].map((value) => <line key={'h' + value} x1="0" y1={value} x2="100" y2={value} stroke="#71694f" strokeWidth=".25" strokeDasharray="1 2" />)}
        <path d="M78 0 C75 18 83 30 77 47 S88 72 80 100" fill="none" stroke="#6f7e72" strokeWidth="7" opacity=".3" />
        <text x="89" y="50" transform="rotate(90 89 50)" textAnchor="middle" fill="#40564c" fontSize="3.2">SIERRA NEVADA</text>
        <text x="4" y="8" fill="#5c4128" fontSize="3.2">AMADOR COUNTY</text>
        <text x="4" y="95" fill="#5c4128" fontSize="3.2">CALAVERAS COUNTY</text>
        {GOLD_COUNTRY_ROUTES.map(([from, to]) => {
          const start = byId[from]
          const end = byId[to]
          return <line key={from + '-' + to} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#6d4e2f" strokeWidth=".8" strokeDasharray="2 1" />
        })}
      </svg>
      <div className="absolute right-3 top-3 grid h-14 w-14 place-items-center rounded-full border border-[#4d442f] bg-[#e0d5ad]/95 text-center text-xs font-bold text-[#282318]">N<br />↑</div>
      <div className="absolute bottom-3 left-3 rounded border border-[#665a3d] bg-[#e0d5ad]/95 px-3 py-2 text-xs">
        West Point to Volcano: approximately {distance} miles direct. Routes and travel conditions determine game time.
      </div>
      {nodes.map((node) => (
        <div key={node.id} data-town-id={node.id} data-lat={node.lat} data-lng={node.lng} style={{ left: node.x + '%', top: node.y + '%' }} className={'absolute w-[92px] -translate-x-1/2 -translate-y-1/2 rounded border p-2 text-center shadow-md sm:w-28 ' + (node.id === active ? 'z-20 border-[#ffcf66] bg-[#75451f] text-white' : 'z-10 border-[#4f4937] bg-[#eee4bd]/95 text-[#201d17]')}>
          <strong className="block text-[11px] leading-tight">{node.id === 'west_point' ? 'West Point / BOBR' : node.label}</strong>
          <span className={'mt-1 block text-[9px] ' + (node.id === active ? 'text-[#ffe0a1]' : 'text-[#5c4a31]')}>{status[node.id]}</span>
        </div>
      ))}
    </div>
  )
}

function MapView({ state }: { state: LocalCampaignState }) {
  const unlocked = !['setup', 'escape', 'trail', 'arrival'].includes(state.chapter)
  return (
    <section className={panelClass('p-3 sm:p-5')}>
      <h2 className="mb-2 text-[15px] text-amber-200">Gold Country travel map</h2>
      <p className="mb-4 text-[9px] leading-5 text-stone-300">Town direction is stable. Actual travel uses route distance, transportation, road condition, weather, load, and daylight. Locked case files remain visible so the region feels larger than the current pilot.</p>
      {unlocked ? <RegionalMap active={state.chapter === 'travel' || state.chapter === 'peril' ? 'west_point' : 'volcano'} /> : <div className="grid min-h-80 place-items-center border-2 border-stone-700 bg-black text-center text-[10px] text-stone-400">Reach Gold Country to open the regional map.</div>}
    </section>
  )
}

function CasebookView({ state }: { state: LocalCampaignState }) {
  return (
    <section className={panelClass('p-4 sm:p-6')}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 text-[8px] text-cyan-300">PERSISTENT CASEBOOK</p><h2 className="text-[16px] text-amber-200">Evidence, relationships, and echoes</h2></div><span className="text-[9px] text-stone-400">{state.casebook.length} entries</span></div>
      {state.casebook.length === 0 ? <p className="border border-stone-700 bg-black p-6 text-[10px] leading-5 text-stone-400">The casebook is empty. Enter the chase and inspect Vane's first tell.</p> : <div className="grid gap-3 md:grid-cols-2">{state.casebook.map((entry) => <article key={entry.id} className="border-l-4 border-cyan-600 bg-black/70 p-4"><p className="mb-2 text-[7px] uppercase text-cyan-300">{entry.category} · {entry.chapter}</p><h3 className="mb-2 text-[10px] leading-4 text-amber-200">{entry.title}</h3><p className="text-[9px] leading-5 text-stone-300">{entry.detail}</p></article>)}</div>}
    </section>
  )
}

function WorldView({ state }: { state: LocalCampaignState }) {
  const [marketNow, setMarketNow] = useState(() => Date.now())
  const [karmaSignal, setKarmaSignal] = useState<KarmaMarketSignal>({
    good: 0, neutral: 0, bad: 0, bias: 0, source: 'cross_game_ledger', chainStatus: 'resolve_later',
  })
  const marketTick = Math.floor(marketNow / 15000)
  const nextPulse = 15 - (Math.floor(marketNow / 1000) % 15)
  const quotes = getMarketQuotes(state, marketTick, karmaSignal.bias)
  const saloon = getSaloonOffer(state.player.ageMode)

  useEffect(() => {
    setKarmaSignal(readKarmaMarketSignal())
    const timer = window.setInterval(() => {
      setMarketNow(Date.now())
      setKarmaSignal(readKarmaMarketSignal())
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="space-y-4">
      <section className={panelClass('p-4 sm:p-6')}>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase text-cyan-300">Live regional exchange</p><h2 className="mt-1 text-[15px] text-amber-200">Gold Country commodity market</h2></div>
          <div className="text-right text-xs text-stone-300"><span data-testid="market-tick">Next price pulse: {nextPulse}s</span><br /><span>Weather · supply · demand · route safety</span></div>
        </div>
        <div className="mb-4 grid gap-2 rounded border border-cyan-800/70 bg-cyan-950/30 p-3 md:grid-cols-[1fr_auto]">
          <div><strong className="text-sm text-cyan-100">Karma market signal: read-only CrossGame ledger</strong><p className="mt-1 text-xs text-stone-300">Good {karmaSignal.good} · Neutral {karmaSignal.neutral} · Bad {karmaSignal.bad} · Bias {karmaSignal.bias.toFixed(2)}</p></div>
          <span className="self-center rounded border border-amber-600 bg-amber-950/60 px-3 py-2 text-xs text-amber-200">Verified chain adapter: Resolve Later</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{quotes.map((quote) => (
          <article key={quote.id} data-commodity={quote.id} data-price={quote.price} className="rounded border border-stone-700 bg-black/70 p-4">
            <div className="flex items-start justify-between gap-2">
              <div><span className="text-[10px] uppercase text-stone-500">{quote.category}</span><strong className="mt-1 block text-sm text-stone-100">{quote.label}</strong></div>
              <span className={'text-lg font-bold ' + (quote.trend === 'up' ? 'text-red-300' : quote.trend === 'down' ? 'text-emerald-300' : 'text-amber-200')}>{quote.price} nK {quote.trend === 'up' ? '↑' : quote.trend === 'down' ? '↓' : '·'}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-300"><span>Supply {quote.supply}</span><span>Demand {quote.demand}</span></div>
            <div className="mt-2 h-1.5 overflow-hidden rounded bg-stone-800"><div className="h-full bg-emerald-600" style={{ width: quote.supply + '%' }} /></div>
            <div className="mt-1 h-1.5 overflow-hidden rounded bg-stone-800"><div className="h-full bg-amber-500" style={{ width: quote.demand + '%' }} /></div>
            <p className="mt-3 text-[8px] leading-4 text-stone-400">{quote.reason}</p>
          </article>
        ))}</div>
        <div className="mt-4 grid gap-2 sm:grid-cols-4"><Stat label="Trade safety" value={state.world.tradeSafety} /><Stat label="Route trust" value={state.world.nativeTrust} /><Stat label="Road condition" value={state.world.roadCondition} /><Stat label="Volcano trust" value={state.world.volcanoTrust} /></div>
      </section>
      <section className={panelClass('p-4 sm:p-6')}>
        <p className="mb-2 text-[8px] text-cyan-300">AGE-AWARE SALOON CONTRACT</p><h2 className="mb-4 text-[14px] text-amber-200">One true town, two appropriate presentations</h2>
        <div className="grid gap-3 md:grid-cols-3"><Info label="At the bar" text={saloon.drink} /><Info label="Vice and language" text={saloon.vice} /><Info label="House mistress" text={saloon.hostRole} /></div>
      </section>
      <section className={panelClass('p-4 sm:p-6')}>
        <p className="mb-2 text-[8px] text-cyan-300">LOCAL PARTNER LIFECYCLE</p><h2 className="mb-4 text-[14px] text-amber-200">St. George Hotel: historical listing first</h2>
        <div className="grid gap-3 md:grid-cols-4"><Info label="1. Listed" text="Historical location and authored game place." /><Info label="2. Verify" text="Local partner identity is not yet onboarded." /><Info label="3. Offer" text="Quest, gift, or referral terms remain locked until verified." /><Info label="4. Receipt" text="A future signed visit or helpful act can support reporting without purchasing moral karma." /></div>
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="border border-stone-700 bg-black/70 p-3"><span className="block text-[7px] text-stone-400">{label}</span><strong className="mt-2 block text-[16px] text-cyan-200">{value}</strong></div>
}

function Info({ label, text }: { label: string; text: string }) {
  return <div className="border border-stone-700 bg-black/70 p-4"><strong className="mb-2 block text-[9px] text-amber-200">{label}</strong><p className="text-[8px] leading-5 text-stone-300">{text}</p></div>
}

function createVolcanoScenario(seed: number): LocalCampaignState {
  let state = createLocalCampaign(seed)
  state = campaignReducer(state, { type: 'START', profile: { name: 'Stress Tester', role: 'sleuth', ageMode: 'adult', presentation: 'self_described' } })
  state = campaignReducer(state, { type: 'ESCAPE_CHOICE', choice: 'trace_tare' })
  state = campaignReducer(state, { type: 'TRAIL_CHOICE', choice: 'stop_thieves' })
  state = campaignReducer(state, { type: 'ENTER_GOLD_COUNTRY' })
  state = campaignReducer(state, { type: 'TRAVEL', mode: 'horse' })
  // Some seeds meet trouble on the road; the stress scenario resolves it and continues.
  if (state.chapter === 'peril') state = campaignReducer(state, { type: 'PERIL_CHOICE', option: 'a' })
  return state
}

function TestView({ state, replace }: { state: LocalCampaignState; replace: (state: LocalCampaignState) => void }) {
  const [importText, setImportText] = useState('')
  const [message, setMessage] = useState('')

  function reset() {
    replace(createLocalCampaign(Date.now() % 100000))
    setMessage('Fresh isolated campaign created.')
  }

  function jump() {
    replace(createVolcanoScenario(Date.now() % 100000))
    setMessage('Loaded the Volcano stress scenario with prior trail consequences.')
  }

  function exportState() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'bobr-local-campaign-' + state.seed + '.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setMessage('Campaign state exported.')
  }

  function importState() {
    try {
      replace(JSON.parse(importText) as LocalCampaignState)
      setMessage('Campaign state imported and normalized.')
    } catch {
      setMessage('Import failed: JSON could not be parsed.')
    }
  }

  return (
    <section className={panelClass('p-4 sm:p-6')}>
      <p className="mb-2 text-[8px] text-red-300">LOCAL PLAYTEST CONTROLS</p><h2 className="mb-3 text-[15px] text-amber-200">Stress the state without contaminating the live game saves.</h2>
      <p className="mb-5 text-[9px] leading-5 text-stone-300">This campaign uses its own versioned storage key. Reset, jump, import, and export are intentionally local to this route.</p>
      <div className="grid gap-2 sm:grid-cols-3"><ActionButton onClick={reset} tone="red">RESET WITH A NEW SEED</ActionButton><ActionButton onClick={jump}>JUMP TO VOLCANO</ActionButton><ActionButton onClick={exportState} tone="green">EXPORT CAMPAIGN JSON</ActionButton></div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="text-[8px] text-amber-200">IMPORT CAMPAIGN JSON<textarea value={importText} onChange={(event) => setImportText(event.target.value)} className="mt-2 min-h-40 w-full border-2 border-stone-700 bg-black p-3 font-mono text-[9px] text-stone-200" /></label>
        <div><button type="button" onClick={importState} className="mb-3 min-h-12 border-2 border-cyan-600 bg-cyan-950 px-4 text-[9px]">IMPORT AND NORMALIZE</button><pre className="max-h-56 overflow-auto border border-stone-700 bg-black p-3 text-[8px] leading-4 text-stone-400">{JSON.stringify({ seed: state.seed, chapter: state.chapter, flags: state.flags, resources: state.resources, world: state.world }, null, 2)}</pre></div>
      </div>
      {message && <p role="status" className="mt-4 border-l-4 border-cyan-500 bg-cyan-950/50 p-3 text-[9px] text-cyan-100">{message}</p>}
      <div className="mt-5"><h3 className="mb-2 text-[9px] text-amber-200">EVENT LOG</h3><div className="max-h-56 overflow-y-auto border border-stone-700 bg-black">{state.log.slice().reverse().map((entry) => <div key={entry.id} className="border-b border-stone-800 p-3 text-[8px] leading-4 text-stone-300"><span className="mr-2 text-cyan-400">{entry.chapter}</span>{entry.text}</div>)}</div></div>
    </section>
  )
}

function NpcConsole({ state }: { state: LocalCampaignState }) {
  const [npcId, setNpcId] = useState<NpcId>('actor')
  const [question, setQuestion] = useState('What did you notice before the actor disappeared?')
  const [answer, setAnswer] = useState('')
  const [provider, setProvider] = useState('checking')
  const [loading, setLoading] = useState(false)
  const visible = state.chapter === 'volcano' || state.chapter === 'resolved' || state.chapter === 'future'

  useEffect(() => {
    let cancelled = false
    fetch('/api/llm/health').then((response) => response.json()).then((data) => {
      if (!cancelled) {
        const active = data.activeProvider || 'none'
        setProvider(active === 'ollama' ? (data.ollama?.warm ? 'ollama ready' : 'ollama cold start') : active)
      }
    }).catch(() => { if (!cancelled) setProvider('none') })
    return () => { cancelled = true }
  }, [])

  if (!visible) return null
  const npc = NPCS[npcId]

  async function ask() {
    if (!question.trim() || loading) return
    setLoading(true)
    const ageRule = state.player.ageMode === 'under18'
      ? 'The player is under 18. Offer sarsaparilla, omit sexual content and harsh profanity, and present vice only as protected historical context.'
      : 'The player selected adult historical presentation. Avoid glamorizing exploitation or harm.'
    const system = [
      'You perform one bounded NPC in the BOBR Volcano playtest.',
      'Every factual statement must closely paraphrase one of the Known facts below. If the facts do not answer the question, say you do not know.',
      'Do not introduce any new number, name, place, date, event, relationship, motive, action, reward, price, evidence, or state change.',
      'Speak in 2 to 4 concise sentences. Distinguish rumor from known fact.',
      ageRule,
      'NPC: ' + npc.name + ', ' + npc.role + '.',
      'Known facts: ' + npc.facts.join(' '),
      'Player role: ' + ROLE_LABELS[state.player.role] + '.',
      'Volcano trust: ' + state.world.volcanoTrust + ' of 100.',
    ].join('\n')
    try {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 36000)
      const response = await fetch('/api/llm/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system, prompt: question.trim(), temperature: 0.65, maxTokens: 160 }), signal: controller.signal })
      window.clearTimeout(timeout)
      const data = await response.json()
      const accepted = isBoundedNpcResponse(data.response)
      setAnswer(accepted ? data.response.trim() : npc.fallback)
      setProvider(accepted ? (data.provider || 'fallback') + ' guarded' : data.provider === 'none' ? 'resolve later' : 'authored fallback')
    } catch {
      setAnswer(npc.fallback)
      setProvider('resolve later')
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className={panelClass('mt-4 p-4')}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-[7px] text-cyan-300">BOUNDED NPC CONSOLE</p><h2 className="mt-1 text-[11px] text-amber-200">Conversation adds depth, not authority</h2></div><span className={'rounded border px-2 py-1 text-[7px] ' + (provider.startsWith('ollama') || provider.startsWith('openrouter') ? 'border-emerald-500 text-emerald-200' : provider === 'resolve later' ? 'border-amber-500 text-amber-200' : 'border-stone-600 text-stone-400')}>MODEL: {provider.toUpperCase()}</span></div>
      <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
        <div className="space-y-2">{(Object.keys(NPCS) as NpcId[]).map((id) => <button type="button" key={id} onClick={() => { setNpcId(id); setAnswer('') }} aria-pressed={npcId === id} className={'w-full border-2 p-3 text-left ' + (npcId === id ? 'border-cyan-400 bg-cyan-950' : 'border-stone-700 bg-black')}><strong className="block text-[9px] text-amber-200">{NPCS[id].name}</strong><span className="mt-1 block text-[7px] leading-3 text-stone-400">{NPCS[id].role}</span></button>)}</div>
        <div><label className="text-[8px] text-stone-300">ASK IN YOUR OWN WORDS<textarea value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={240} className="mt-2 min-h-24 w-full border-2 border-stone-700 bg-black p-3 text-[10px] leading-5 text-white" /></label>
          <p className={'mt-2 rounded border p-2 text-xs ' + (provider === 'resolve later' || provider === 'none' ? 'border-amber-700 bg-amber-950/40 text-amber-200' : 'border-stone-700 bg-black/50 text-stone-300')}>
            {provider === 'resolve later' || provider === 'none'
              ? 'Resolve Later: the mini-LLM could not generate this answer. Your question remains valid, but the authored fallback below is finite.'
              : provider.includes('cold start')
                ? 'Local llama3.2 is connected but cold. The first unique answer can take up to thirty seconds.'
                : 'Unique questions go to the local mini-LLM. It may improvise wording only from this NPC’s canonical facts.'}
          </p>
          <button type="button" onClick={ask} disabled={loading} className="mt-2 min-h-12 border-2 border-amber-500 bg-amber-900 px-4 text-[9px] text-amber-100 disabled:opacity-50">{loading ? 'LOCAL MODEL IS THINKING...' : 'ASK ' + npc.name.toUpperCase()}</button>{answer && <div className="mt-3 border-l-4 border-cyan-500 bg-black p-4"><p className="text-[10px] leading-6 text-stone-200">{answer}</p><span className="mt-2 block text-[7px] text-cyan-400">{provider === 'resolve later' ? 'AUTHORED FALLBACK · DYNAMIC RESPONSE MARKED RESOLVE LATER' : 'IMPROVISED VOICE ONLY · CANONICAL FACTS REMAIN IN THE CASEBOOK'}</span></div>}</div>
      </div>
    </aside>
  )
}

export function BobrLocalCampaign() {
  const [state, dispatch] = useReducer(campaignReducer, undefined, () => createLocalCampaign(1849))
  const previousState = useRef(state)
  const [view, setView] = useState<ViewId>('journey')
  const [hydrated, setHydrated] = useState(false)
  const [productionJourney, setProductionJourney] = useState<JourneyImport | null>(null)

  useEffect(() => {
    const saved = loadLocalCampaign()
    if (saved) {
      previousState.current = saved
      dispatch({ type: 'REPLACE', state: saved })
    }
    setProductionJourney(readProductionJourneyImport())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) {
      saveLocalCampaign(state)
      syncPlaytestOutcome(previousState.current, state)
      previousState.current = state
    }
  }, [hydrated, state])

  function replace(next: LocalCampaignState) {
    dispatch({ type: 'REPLACE', state: next })
    setView('journey')
  }

  return (
    <main className="visual64-shell min-h-screen text-stone-100">
      <header className="border-b border-[#9a7a48]/60 bg-[#101514]/95 px-3 py-4 shadow-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase text-cyan-300">Visual64 local release candidate</p><h1 className="mt-1 text-2xl leading-tight text-[#f0d69a]">Bobr: The Honest Trail</h1></div>
          <div className="flex items-center gap-2"><Link href="/hub" className="min-h-10 rounded border border-stone-600 px-3 py-3 text-xs text-stone-300 hover:border-amber-400">Hub</Link><span className="rounded border border-emerald-700 bg-emerald-950/60 px-3 py-2 text-xs text-emerald-200">{PLAYTEST_SYNC_ENABLED ? 'Production bridge on' : 'Isolated save'}</span></div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-3 py-4 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-3">
          <section className={panelClass('p-3')}>
            <p className="text-[7px] text-cyan-300">SESSION {state.seed}</p><h2 className="mt-2 text-[10px] leading-4 text-amber-200">{state.player.name}</h2><p className="mt-1 text-[8px] text-stone-400">{ROLE_LABELS[state.player.role]}</p>
            <div className="mt-3 space-y-2 text-[8px]"><div className="flex justify-between"><span>Time</span><span className="text-cyan-200">{formatCampaignTime(state)}</span></div><div className="flex justify-between"><span>Weather</span><span className="text-cyan-200">{state.world.weather}</span></div><div className="flex justify-between"><span>Supplies</span><span className="text-amber-200">{state.resources.supplies}</span></div><div className="flex justify-between"><span>Neutral</span><span className="text-amber-200">{state.resources.neutral}</span></div><div className="flex justify-between"><span>Good karma</span><span className="text-emerald-300">{state.resources.goodKarma}</span></div><div className="flex justify-between"><span>Bad karma</span><span className="text-red-300">{state.resources.badKarma}</span></div><div className="flex justify-between"><span>Leads</span><span className="text-cyan-200">{state.resources.leads}</span></div></div>
          </section>
          <nav className={panelClass('p-2')} aria-label="Campaign views">{NAV.map((item) => <button key={item.id} type="button" onClick={() => setView(item.id)} aria-current={view === item.id ? 'page' : undefined} className={'mb-1 flex min-h-11 w-full items-center gap-3 border px-3 text-left text-[8px] last:mb-0 ' + (view === item.id ? 'border-cyan-400 bg-cyan-950 text-white' : 'border-transparent text-stone-400 hover:border-stone-600')}><span className="text-[12px] text-amber-300">{item.mark}</span>{item.label}</button>)}</nav>
          <section className={panelClass('p-3')}><p className="text-[7px] text-stone-500">CURRENT CHAPTER</p><strong className="mt-2 block text-[9px] uppercase text-amber-200">{state.chapter}</strong><div className="mt-3 h-2 bg-black"><div className="h-full bg-cyan-600" style={{ width: Math.max(5, (['setup','escape','trail','arrival','travel','peril','volcano','resolved','future'].indexOf(state.chapter) + 1) * (100 / 9)) + '%' }} /></div></section>
        </aside>

        <div className="min-w-0">
          {view === 'journey' && <JourneyView state={state} dispatch={dispatch} productionJourney={productionJourney} />}
          {view === 'map' && <MapView state={state} />}
          {view === 'casebook' && <CasebookView state={state} />}
          {view === 'world' && <WorldView state={state} />}
          {view === 'test' && <TestView state={state} replace={replace} />}
          <NpcConsole state={state} />
        </div>
      </div>
    </main>
  )
}
