'use client'

// ============================================================================
// THE CHASE: where did Vane go? — Carmen-Sandiego-style deduction prototype.
//
// SELF-CONTAINED PROOF — NOT part of the live game. New files only, own route,
// not linked from any existing page. State lives in React + sessionStorage,
// never touching bobr_adventure_state or the live save system.
//
// This route makes docs/ADVENTURE_CLUE_REDESIGN_CARMEN_SANDIEGO.md §2 playable:
//   Rule 1 — clues point at the NEXT town's attribute, never its name.
//   Rule 2 — clues come from named, diegetic witnesses.
//   Rule 3 — difficulty = obscurity (easy vs hard phrasing of one target).
//   Rule 4 — wrong picks cost a day, never the trail; always recoverable.
// ============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CHASE,
  TOWNS,
  VANE,
  STARTING_DAYS,
  SESSION_KEY,
  type WantedTrait,
} from './chaseData'
import { ChaseMap } from './ChaseMap'
import { WantedPoster } from './WantedPoster'

type Phase = 'clue' | 'feedback' | 'won' | 'lost'

interface ChaseState {
  hopIndex: number // which hop of CHASE we're resolving (0..3)
  days: number
  routeIds: string[] // confirmed towns reached, in order
  traits: WantedTrait[]
  revealedHard: boolean // has the player pressed the witness harder this hop?
  /** When set, we're showing redirect text after a wrong pick. */
  redirect: { witnessName: string; witnessRole: string; line: string } | null
}

const TOTAL_TRAITS = CHASE.length

function initialState(): ChaseState {
  return {
    hopIndex: 0,
    days: STARTING_DAYS,
    routeIds: [CHASE[0].fromId],
    traits: [],
    revealedHard: false,
    redirect: null,
  }
}

// Deterministically order the 3 candidates so the correct answer isn't always
// in the same slot — rotate by hop index. Pure (no Math.random in render).
function candidatesFor(hopIndex: number): string[] {
  const hop = CHASE[hopIndex]
  const ids = [hop.toId, hop.distractors[0], hop.distractors[1]]
  const shift = hopIndex % 3
  return [...ids.slice(shift), ...ids.slice(0, shift)]
}

export default function ChaseDemoPage() {
  const [state, setState] = useState<ChaseState>(initialState)
  const [phase, setPhase] = useState<Phase>('clue')
  // Feedback text after a correct pick.
  const [hotMessage, setHotMessage] = useState<string | null>(null)

  // --- session persistence (never touches the live save) --------------------
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as { state: ChaseState; phase: Phase }
        if (saved?.state) {
          setState(saved.state)
          if (saved.phase) setPhase(saved.phase)
        }
      }
    } catch {
      /* ignore corrupt session blob */
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ state, phase }))
    } catch {
      /* sessionStorage may be unavailable — non-fatal for a prototype */
    }
  }, [state, phase])

  // hop may be undefined once the final hop is resolved (hopIndex === CHASE.length).
  // All hop-derived values are only read while phase === 'clue', but compute them
  // defensively so a won/lost render never dereferences an out-of-range hop.
  const hop = CHASE[state.hopIndex] ?? CHASE[CHASE.length - 1]
  const hasActiveHop = state.hopIndex < CHASE.length
  const currentId = state.routeIds[state.routeIds.length - 1]
  const candidates = useMemo(
    () => (hasActiveHop ? candidatesFor(state.hopIndex) : []),
    [hasActiveHop, state.hopIndex],
  )

  const witnessLine = useMemo(() => {
    if (state.redirect) return state.redirect.line
    return state.revealedHard ? hop.hardClue : hop.easyClue
  }, [state.redirect, state.revealedHard, hop])

  const witnessName = state.redirect ? state.redirect.witnessName : hop.witness.name
  const witnessRole = state.redirect ? state.redirect.witnessRole : hop.witness.role

  // --- actions --------------------------------------------------------------

  const pressHarder = useCallback(() => {
    setState((s) => (s.redirect ? s : { ...s, revealedHard: true }))
  }, [])

  const pick = useCallback(
    (townId: string) => {
      if (phase !== 'clue') return
      setHotMessage(null)

      if (townId === hop.toId) {
        // CORRECT — advance. All next-state computed purely, then committed.
        setState((s) => {
          const nextHop = s.hopIndex + 1
          const nextRoute = [...s.routeIds, townId]
          const nextTraits = [...s.traits, hop.trait]
          return {
            ...s,
            hopIndex: nextHop,
            routeIds: nextRoute,
            traits: nextTraits,
            revealedHard: false,
            redirect: null,
          }
        })
        const isFinal = state.hopIndex >= CHASE.length - 1
        if (isFinal) {
          setPhase('won')
        } else {
          setHotMessage(
            `The trail's hot — Vane came through ${TOWNS[townId].name} a day ago. ` +
              `A witness adds to the warrant: ${hop.trait.label} — ${hop.trait.value}.`,
          )
          setPhase('feedback')
        }
      } else {
        // WRONG — lose a day, trail cools, fresh witness redirects (Rule 4).
        const remaining = state.days - 1
        if (remaining <= 0) {
          setState((s) => ({ ...s, days: 0 }))
          setPhase('lost')
        } else {
          setState((s) => ({
            ...s,
            days: remaining,
            redirect: {
              witnessName: hop.redirect.witness.name,
              witnessRole: hop.redirect.witness.role,
              line: hop.redirect.line,
            },
          }))
          setPhase('clue')
        }
      }
    },
    [phase, hop, state.hopIndex, state.days],
  )

  const continueAfterCorrect = useCallback(() => {
    setHotMessage(null)
    setPhase('clue')
  }, [])

  const retry = useCallback(() => {
    setState(initialState())
    setPhase('clue')
    setHotMessage(null)
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* non-fatal */
    }
  }, [])

  // --- render ---------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1c2c] via-[#0f0f1b] to-black px-3 py-4 sm:px-6">
      {/* PROTOTYPE banner */}
      <div className="mx-auto mb-4 max-w-5xl border-2 border-dashed border-[var(--pixel-fire-orange)]/70 bg-[var(--pixel-fire-orange)]/10 px-3 py-2">
        <p className="font-[var(--font-pixel)] text-[10px] sm:text-[11px] leading-relaxed text-[var(--pixel-fire-orange)]">
          PROTOTYPE — not in the live game. A self-contained proof of the Carmen-Sandiego deduction chase.
        </p>
      </div>

      <div className="mx-auto max-w-5xl">
        <header className="mb-4 text-center">
          <h1 className="font-[var(--font-pixel)] text-[15px] leading-relaxed text-[var(--pixel-gold-light)] sm:text-[20px]">
            THE CHASE
          </h1>
          <p className="mt-2 font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-ui-text)] sm:text-[12px]">
            Where did Vane go?
          </p>
        </header>

        {/* status bar */}
        <div className="mb-4 flex items-center justify-between border-2 border-[var(--pixel-ui-border)] bg-black/40 px-3 py-2">
          <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">
            DAYS LEFT:{' '}
            <span
              className={
                state.days <= 2
                  ? 'text-[var(--pixel-fire-orange)]'
                  : 'text-[var(--pixel-gold-light)]'
              }
              data-testid="days-left"
            >
              {state.days}
            </span>
          </span>
          <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">
            TOWN:{' '}
            <span className="text-[var(--pixel-gold-light)]">{TOWNS[currentId].name}</span>
          </span>
          <span
            className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]"
            data-testid="hop-progress"
          >
            HOP {Math.min(state.hopIndex + 1, CHASE.length)}/{CHASE.length}
          </span>
        </div>

        {/* main grid: chase column + poster sidebar */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <ChaseMap routeIds={state.routeIds} currentId={currentId} />

            {/* WON */}
            {phase === 'won' && (
              <div
                className="border-2 border-[var(--pixel-forest-light)] bg-[var(--pixel-forest-dark)]/25 p-4 text-center"
                data-testid="won-panel"
              >
                <p className="font-[var(--font-pixel)] text-[13px] leading-relaxed text-[var(--pixel-forest-light)] sm:text-[15px]">
                  YOU&apos;VE CORNERED VANE!
                </p>
                <p className="mt-3 font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-ui-text)]">
                  At {TOWNS[currentId].name}, the road agent tips his hat, sets down his
                  dime novel, and surrenders without a fight — with{' '}
                  <span className="text-[var(--pixel-gold-light)]">{state.days}</span> day
                  {state.days === 1 ? '' : 's'} to spare. The warrant is complete.
                </p>
                <button
                  onClick={retry}
                  className="mt-4 border-2 border-[var(--pixel-gold-dark)] px-4 py-2 font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] transition-all hover:bg-[var(--pixel-gold-dark)]/20"
                >
                  CHASE AGAIN
                </button>
              </div>
            )}

            {/* LOST */}
            {phase === 'lost' && (
              <div
                className="border-2 border-[var(--pixel-fire-red)] bg-[var(--pixel-fire-red)]/15 p-4 text-center"
                data-testid="lost-panel"
              >
                <p className="font-[var(--font-pixel)] text-[13px] leading-relaxed text-[var(--pixel-fire-orange)] sm:text-[15px]">
                  VANE SLIPPED AWAY INTO THE HILLS
                </p>
                <p className="mt-3 font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-ui-text)]">
                  The trail ran cold and the days ran out. Somewhere past{' '}
                  {TOWNS[currentId].name}, the gentleman of the road walks on, free.
                </p>
                <button
                  onClick={retry}
                  data-testid="retry-button"
                  className="mt-4 border-2 border-[var(--pixel-gold-dark)] px-4 py-2 font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] transition-all hover:bg-[var(--pixel-gold-dark)]/20"
                >
                  RETRY
                </button>
              </div>
            )}

            {/* FEEDBACK after a correct pick (not final) */}
            {phase === 'feedback' && hotMessage && (
              <div
                className="border-2 border-[var(--pixel-forest-light)]/70 bg-[var(--pixel-forest-dark)]/20 p-4"
                data-testid="feedback-panel"
              >
                <p className="font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-forest-light)]">
                  {hotMessage}
                </p>
                <button
                  onClick={continueAfterCorrect}
                  data-testid="continue-button"
                  className="mt-4 border-2 border-[var(--pixel-gold-dark)] px-4 py-2 font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] transition-all hover:bg-[var(--pixel-gold-dark)]/20"
                >
                  PICK UP THE TRAIL {'▶'}
                </button>
              </div>
            )}

            {/* CLUE + candidate picker */}
            {phase === 'clue' && (
              <>
                {/* witness card */}
                <div
                  className={`border-2 p-4 ${
                    state.redirect
                      ? 'border-[var(--pixel-fire-orange)]/70 bg-[var(--pixel-fire-orange)]/10'
                      : 'border-[var(--pixel-gold-dark)] bg-black/40'
                  }`}
                  data-testid="witness-card"
                >
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)]">
                      {state.redirect ? 'A NEW WITNESS' : 'WITNESS'}: {witnessName}
                    </span>
                    <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]/60">
                      {witnessRole}
                    </span>
                  </div>
                  <p
                    className="font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-ui-text)] sm:text-[12px]"
                    data-testid="clue-text"
                  >
                    &ldquo;{witnessLine}&rdquo;
                  </p>

                  {state.redirect && (
                    <p className="mt-2 font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-fire-orange)]">
                      No sign of him here. You&apos;ve lost a day — the trail&apos;s gone cold,
                      but this witness points the way.
                    </p>
                  )}

                  {!state.redirect && !state.revealedHard && (
                    <button
                      onClick={pressHarder}
                      data-testid="press-harder"
                      className="mt-3 font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]/70 underline transition-colors hover:text-[var(--pixel-gold-light)]"
                    >
                      Press {witnessName.split(' ')[0]} for a sharper detail...
                    </button>
                  )}
                </div>

                {/* candidate destinations */}
                <div>
                  <p className="mb-2 font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]/70">
                    WHICH ROAD DO YOU TAKE?
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {candidates.map((id) => {
                      const town = TOWNS[id]
                      return (
                        <button
                          key={id}
                          onClick={() => pick(id)}
                          data-testid="candidate"
                          data-town={id}
                          className="flex h-full flex-col border-2 border-[var(--pixel-ui-border)] bg-black/30 p-3 text-left transition-all hover:border-[var(--pixel-gold-mid)] hover:bg-[var(--pixel-gold-dark)]/15"
                        >
                          <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)]">
                            {town.name}
                          </span>
                          <span className="mt-2 font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)]/70">
                            {town.descriptor}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Wanted Poster sidebar */}
          <aside>
            <WantedPoster
              traits={state.traits}
              totalTraits={TOTAL_TRAITS}
              complete={phase === 'won'}
            />
            <p className="mt-3 px-1 font-[var(--font-pixel)] text-[9px] leading-relaxed text-[var(--pixel-ui-text)]/40">
              {VANE.charge}. Real Gold Country towns; clues describe each town&apos;s true
              history without naming it.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
