'use client'

// WHERE IN TIME IS CYRUS VANE? — a Carmen-Sandiego chase across the ERAS of one
// piece of land. Read each era by its true grain; chase the Tare forward through
// time before causality runs out; the Guide narrates with Douglas-Adams temporal
// vertigo. Self-contained prototype — own route + sessionStorage, never touches
// the live save. See docs/WHERE_IN_TIME_DESIGN_20260615.md.

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ERAS, CHASE, VANE, RECKONING, GUIDE_INTRO,
  STARTING_CAUSALITY, OBSERVE_COST, SESSION_KEY,
  type TimeTrait,
} from './whereInTimeData'
import { PlaceBackdrop } from '@/components/PlaceBackdrop'

type Phase = 'clue' | 'feedback' | 'won' | 'lost'

interface State {
  hopIndex: number
  causality: number // may hold .5 (observing the hard clue costs a half-unit)
  eraRoute: string[]
  traits: TimeTrait[]
  observed: boolean
  redirect: { witness: string; line: string } | null
}

const TOTAL = CHASE.length

function initialState(): State {
  return { hopIndex: 0, causality: STARTING_CAUSALITY, eraRoute: [CHASE[0].fromEra], traits: [], observed: false, redirect: null }
}

// Deterministic 3-era candidate order (no Math.random in render); rotate by hop.
function candidatesFor(hopIndex: number): string[] {
  const hop = CHASE[hopIndex]
  const ids = [hop.toEra, hop.distractors[0], hop.distractors[1]]
  const s = hopIndex % 3
  return [...ids.slice(s), ...ids.slice(0, s)]
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1))

export default function WhereInTimePage() {
  const [state, setState] = useState<State>(initialState)
  const [phase, setPhase] = useState<Phase>('clue')
  const [hot, setHot] = useState<string | null>(null)
  const [inited, setInited] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as { state: State; phase: Phase }
        if (saved?.state) { setState(saved.state); if (saved.phase) setPhase(saved.phase) }
        setInited(true); return
      }
    } catch { /* ignore */ }
    setInited(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !inited) return
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ state, phase })) } catch { /* non-fatal */ }
  }, [state, phase, inited])

  const hop = CHASE[state.hopIndex] ?? CHASE[CHASE.length - 1]
  const hasActive = state.hopIndex < CHASE.length
  const currentEra = state.eraRoute[state.eraRoute.length - 1]
  const isFinal = state.hopIndex === CHASE.length - 1
  const candidates = useMemo(() => (hasActive ? candidatesFor(state.hopIndex) : []), [hasActive, state.hopIndex])

  const clueText = state.redirect ? state.redirect.line : state.observed ? hop.guideHard : hop.guideEasy
  const witnessName = state.redirect ? state.redirect.witness : hop.witness.name

  // Observe the sharper read — costs a half-unit of causality. Pure updater; the
  // lose-on-overspend transition is decided from the post-decrement value.
  const observe = useCallback(() => {
    if (phase !== 'clue' || state.redirect || state.observed) return
    if (state.causality - OBSERVE_COST <= 0) { setState((s) => ({ ...s, causality: 0 })); setPhase('lost'); return }
    setState((s) => (s.redirect || s.observed ? s : { ...s, causality: s.causality - OBSERVE_COST, observed: true }))
  }, [phase, state.redirect, state.observed, state.causality])

  const pick = useCallback((eraId: string) => {
    if (phase !== 'clue') return
    setHot(null)
    if (eraId === hop.toEra) {
      setState((s) => {
        const has = s.traits.some((t) => t.label === hop.trait.label && t.value === hop.trait.value)
        return { ...s, hopIndex: s.hopIndex + 1, eraRoute: [...s.eraRoute, eraId], traits: has ? s.traits : [...s.traits, hop.trait], observed: false, redirect: null }
      })
      if (isFinal) { setPhase('won') }
      else { setHot(hop.paradox); setPhase('feedback') }
    } else {
      const remaining = state.causality - 1
      if (remaining <= 0) { setState((s) => ({ ...s, causality: 0 })); setPhase('lost'); return }
      setState((s) => ({
        ...s, causality: remaining, observed: false,
        redirect: { witness: 'a confused bystander', line: `No sign of him in ${ERAS[eraId].name} (${ERAS[eraId].year}). A paradox ripples through; you lose a unit of causality. The Guide reads the grain again and points you on.` },
      }))
      setPhase('clue')
    }
  }, [phase, hop, isFinal, state.causality])

  const next = useCallback(() => { setHot(null); setPhase('clue') }, [])
  const retry = useCallback(() => {
    try { sessionStorage.removeItem(SESSION_KEY) } catch { /* */ }
    setState(initialState()); setPhase('clue'); setHot(null)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1030] via-[#0e0a1f] to-black px-3 py-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-3 text-center">
          <h1 className="font-[var(--font-pixel)] text-[15px] leading-relaxed text-[var(--pixel-gold-light)] sm:text-[20px]">
            WHERE IN TIME IS CYRUS VANE?
          </h1>
          <p className="mt-2 font-[var(--font-pixel)] text-[11px] leading-relaxed text-[#b9a7e0] sm:text-[12px]">
            One piece of land. Every era. Chase the Tare forward before causality runs out.
          </p>
        </header>

        {/* status bar */}
        <div className="mb-4 flex items-center justify-between border-2 border-[#4b3a7a] bg-black/40 px-3 py-2">
          <span className="font-[var(--font-pixel)] text-[11px] text-[#b9a7e0]">
            CAUSALITY:{' '}
            <span className={state.causality <= 2 ? 'text-[var(--pixel-fire-orange)]' : 'text-[var(--pixel-gold-light)]'} data-testid="causality">{fmt(state.causality)}</span>
          </span>
          <span className="font-[var(--font-pixel)] text-[11px] text-[#b9a7e0]">
            ERA: <span className="text-[var(--pixel-gold-light)]">{ERAS[currentEra].name}</span>{' '}<span className="text-[#8a78b8]">({ERAS[currentEra].year})</span>
          </span>
          <span className="font-[var(--font-pixel)] text-[11px] text-[#b9a7e0]" data-testid="hop-progress">
            JUMP {Math.min(state.hopIndex + 1, TOTAL)}/{TOTAL}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_290px]">
          <div className="space-y-4">
            {/* era backdrop */}
            {ERAS[currentEra].art && (
              <div className="border-2 border-[#4b3a7a] bg-black/40">
                <PlaceBackdrop id={ERAS[currentEra].art!} className="mx-auto h-40 max-w-md object-top" />
              </div>
            )}

            {/* WON */}
            {phase === 'won' && (
              <div className="border-2 border-[var(--pixel-forest-light)] bg-[var(--pixel-forest-dark)]/25 p-4" data-testid="won-panel">
                <p className="font-[var(--font-pixel)] text-[13px] leading-relaxed text-[var(--pixel-forest-light)] sm:text-[15px]">YOU CORNERED VANE — OUTSIDE TIME</p>
                <p className="mt-3 font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-ui-text)]">{RECKONING}</p>
                <button onClick={retry} className="mt-4 border-2 border-[var(--pixel-gold-dark)] px-4 py-2 font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] transition-all hover:bg-[var(--pixel-gold-dark)]/20">CHASE AGAIN</button>
              </div>
            )}

            {/* LOST */}
            {phase === 'lost' && (
              <div className="border-2 border-[var(--pixel-fire-red)] bg-[var(--pixel-fire-red)]/15 p-4 text-center" data-testid="lost-panel">
                <p className="font-[var(--font-pixel)] text-[13px] leading-relaxed text-[var(--pixel-fire-orange)] sm:text-[15px]">CAUSALITY COLLAPSED</p>
                <p className="mt-3 font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-ui-text)]">The timeline frays and Vane steps sideways into a year you can no longer reach. Somewhere — somewhen — he is forging a presence he never kept.</p>
                <button onClick={retry} data-testid="retry-button" className="mt-4 border-2 border-[var(--pixel-gold-dark)] px-4 py-2 font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] transition-all hover:bg-[var(--pixel-gold-dark)]/20">RETRY</button>
              </div>
            )}

            {/* FEEDBACK — the Guide's paradox on arrival */}
            {phase === 'feedback' && hot && (
              <div className="border-2 border-[#6b5aa0]/70 bg-[#2a1f4a]/40 p-4" data-testid="feedback-panel">
                <p className="font-[var(--font-pixel)] text-[10px] text-[#b9a7e0]/70">THE GUIDE:</p>
                <p className="mt-2 font-[var(--font-pixel)] text-[11px] leading-relaxed text-[#cbbbf0]">{hot}</p>
                <button onClick={next} data-testid="continue-button" className="mt-4 border-2 border-[var(--pixel-gold-dark)] px-4 py-2 font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] transition-all hover:bg-[var(--pixel-gold-dark)]/20">FOLLOW HIM ON {'▶'}</button>
              </div>
            )}

            {/* CLUE + era picker */}
            {phase === 'clue' && (
              <>
                {state.hopIndex === 0 && state.eraRoute.length === 1 && !state.redirect && (
                  <div className="border-2 border-[#4b3a7a] bg-black/30 p-3" data-testid="guide-intro">
                    <p className="font-[var(--font-pixel)] text-[10px] leading-relaxed text-[#b9a7e0]/85">{GUIDE_INTRO}</p>
                  </div>
                )}

                <div className={`border-2 p-4 ${state.redirect ? 'border-[var(--pixel-fire-orange)]/70 bg-[var(--pixel-fire-orange)]/10' : 'border-[#6b5aa0] bg-black/40'}`} data-testid="clue-card">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)]">{state.redirect ? 'A PARADOX' : 'THE GUIDE reads the grain'} — {witnessName}</span>
                    <span className="font-[var(--font-pixel)] text-[10px] text-[#8a78b8]">{state.redirect ? '' : hop.witness.role}</span>
                  </div>
                  <p className="font-[var(--font-pixel)] text-[11px] leading-relaxed text-[#cbbbf0] sm:text-[12px]" data-testid="clue-text">&ldquo;{clueText}&rdquo;</p>
                  {!state.redirect && !state.observed && (
                    <button onClick={observe} data-testid="observe" className="mt-3 font-[var(--font-pixel)] text-[10px] text-[#b9a7e0]/70 underline transition-colors hover:text-[var(--pixel-gold-light)]">
                      Observe the sharper read... (collapses the timeline — costs ½ causality)
                    </button>
                  )}
                  {!state.redirect && state.observed && (
                    <p className="mt-3 font-[var(--font-pixel)] text-[10px] italic text-[#b9a7e0]/50">You observed it; the timeline collapsed a little to let you. Half a unit spent.</p>
                  )}
                </div>

                <div>
                  <p className="mb-2 font-[var(--font-pixel)] text-[10px] text-[#b9a7e0]/70">WHEN DO YOU JUMP TO?</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {candidates.map((id) => {
                      const era = ERAS[id]
                      return (
                        <button key={id} onClick={() => pick(id)} data-testid="candidate" data-era={id}
                          className="flex h-full flex-col border-2 border-[#4b3a7a] bg-black/30 p-3 text-left transition-all hover:border-[var(--pixel-gold-mid)] hover:bg-[#2a1f4a]/40">
                          <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)]">{era.name} <span className="text-[#8a78b8]">{era.year}</span></span>
                          <span className="mt-2 font-[var(--font-pixel)] text-[10px] leading-relaxed text-[#b9a7e0]/70">{era.descriptor}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Wanted Poster — fills with what Vane forged in each age */}
          <aside>
            <div className="border-4 border-[var(--pixel-earth-dark)] bg-[#e9dcc0] p-3 text-[#3b2a1f]">
              <p className="text-center font-[var(--font-pixel)] text-[13px] tracking-widest text-[#7a1f10]">WANTED — IN EVERY ERA</p>
              <p className="mt-1 text-center font-[var(--font-pixel)] text-[10px] text-[#5c3d2e]">{phase === 'won' ? 'OUT OF TIME' : 'ACROSS ALL TIME'}</p>
              <p className="mt-3 text-center font-[var(--font-pixel)] text-[11px] text-[#3b2a1f]">{VANE.name}</p>
              <p className="mt-2 font-[var(--font-pixel)] text-[10px] leading-relaxed text-[#5c3d2e]">{VANE.baseDescription}</p>
              <div className="my-3 border-t-2 border-dashed border-[var(--pixel-earth-dark)]/50" />
              <p className="font-[var(--font-pixel)] text-[10px] text-[#7a1f10]">FORGERIES, BY THE AGE:</p>
              <ul className="mt-2 space-y-2">
                {Array.from({ length: TOTAL }).map((_, i) => {
                  const t = state.traits[i]
                  return (
                    <li key={i} className="font-[var(--font-pixel)] text-[10px] leading-relaxed">
                      {t ? <span className="text-[#3b2a1f]"><span className="text-[#7a1f10]">{t.label}: </span>{t.value}</span> : <span className="italic text-[#5c3d2e]/40">?: not yet uncovered...</span>}
                    </li>
                  )
                })}
              </ul>
              <div className="my-3 border-t-2 border-dashed border-[var(--pixel-earth-dark)]/50" />
              <p className="font-[var(--font-pixel)] text-[9px] leading-relaxed text-[#5c3d2e]">CHARGE: {VANE.charge}</p>
            </div>
            <p className="mt-3 px-1 font-[var(--font-pixel)] text-[9px] leading-relaxed text-[#b9a7e0]/40">
              Real eras of one real place — West Point becoming Back of Beyond Ranch. The land&apos;s honest history is the one thing Vane can&apos;t forge.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
