'use client'

// ============================================================================
// THE TARE'S TRAIL: where did Cyrus Vane go? — a Carmen-Sandiego deduction chase.
//
// A self-contained side-quest, now surfaced from the live /adventure hub. Its own
// route + own state in React + sessionStorage, never touching bobr_adventure_state
// or the live save system. The chase ends in a RECKONING (the court at San Andreas)
// where the player decides Vane's fate — narrative-only; any real karma/reward must
// be SERVER-minted with a signed grant (no client-mint).
//
// This route makes docs/ADVENTURE_CLUE_REDESIGN_CARMEN_SANDIEGO.md §2 playable:
//   Rule 1 — clues point at the NEXT town's attribute, never its name.
//   Rule 2 — clues come from named, diegetic witnesses.
//   Rule 3 — difficulty = obscurity (easy vs hard phrasing of one target).
//   Rule 4 — wrong picks cost a day, never the trail; always recoverable.
//
// v2 ACCELERATION — the loop now TIGHTENS as it closes:
//   Beat 1 WARMING TRAIL — the witness card shows how far ahead Vane is
//          (days → hours), and the map paints his shrinking lead. The final
//          arrival reads as CORNERING him.
//   Beat 2 NEAR-MISS DISTRACTORS — each wrong town is COLD (wasted day, no
//          tell) or a NEAR-MISS (wasted day, but a Wanted-Poster trait teased).
//          Always recoverable.
//   Beat 3 COSTED HARDER CLUE — pressing for the obscure clue costs a HALF-DAY
//          (days hold .5). The easy clue is free; obscurity is a gamble.
//          Recovery clues after a wrong pick stay free.
// ============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CHASE,
  TOWNS,
  VANE,
  VANE_MARKS,
  STARTING_DAYS,
  PRESS_COST,
  SESSION_KEY,
  STORY_INTRO,
  type WantedTrait,
} from './chaseData'
import { ChaseMap } from './ChaseMap'
import { WantedPoster } from './WantedPoster'
import { readCarriedBoon, recordVerdict } from './chaseLedger'
import { ChaseArt, VerdictEmblem, WitnessSprite } from './ChaseArt'

type Phase = 'clue' | 'feedback' | 'won' | 'lost' | 'reckoning' | 'verdict'

/** What the player decides becomes of the Tare once he is cornered. */
type VerdictKind = 'gallows' | 'prison' | 'mercy'

interface ChaseState {
  hopIndex: number // which hop of CHASE we're resolving (0..3)
  days: number // may hold .5 (Beat 3 — pressing costs a half-day)
  routeIds: string[] // confirmed towns reached, in order
  traits: WantedTrait[]
  revealedHard: boolean // has the player paid to press harder this hop?
  /** When set, we're showing redirect text after a wrong pick. */
  redirect: { witnessName: string; witnessRole: string; line: string } | null
  /** The fate the player chose for Vane at the reckoning (null until sentenced). */
  verdict: VerdictKind | null
  /** Free witness presses carried in from other games (continuity boon). */
  freePresses: number
}

const TOTAL_TRAITS = CHASE.length

// The three endings of the reckoning. Narrative-only: NO karma/reward is minted
// on the client here. If the mercy path should ever grant real good-karma
// reputation or a booking reward, that must be SERVER-minted with a signed grant
// (the no-client-mint rule the trust-audit skill guards) — never written here.
const VERDICTS: Record<VerdictKind, { title: string; body: string }> = {
  gallows: {
    title: 'THE GALLOWS',
    body:
      'At dawn, behind the San Andreas courthouse, the Tare meets the rope. He tips his hat one last time and sets down his dime novel for good. The four counties he wronged send no flowers — justice, hard and final.',
  },
  prison: {
    title: 'THE TERRITORIAL PRISON',
    body:
      "The judge sends Cyrus Vane down the river to San Quentin — years of hard labor, every salted claim entered in the ledger against him. He'll see no road but the prison yard for a long while, and the gold he counterfeited is counted back to its owners.",
  },
  mercy: {
    title: 'MERCY & RESTITUTION',
    body:
      'You ask the court for mercy. Vane signs over every counterfeit grant, returns what gold remains, and takes his sentence quietly — alive, and bound to make the wronged whole. Word travels the Mother Lode: the one who caught the Tare chose to let him live. Kindness, witnessed, has a way of coming back to you.',
  },
}

function initialState(): ChaseState {
  return {
    hopIndex: 0,
    days: STARTING_DAYS,
    routeIds: [CHASE[0].fromId],
    traits: [],
    revealedHard: false,
    redirect: null,
    verdict: null,
    freePresses: 0,
  }
}

// Deterministically order the 3 candidates so the correct answer isn't always
// in the same slot — rotate by hop index. Pure (no Math.random in render).
function candidatesFor(hopIndex: number): string[] {
  const hop = CHASE[hopIndex]
  const ids = [hop.toId, hop.distractors[0].townId, hop.distractors[1].townId]
  const shift = hopIndex % 3
  return [...ids.slice(shift), ...ids.slice(0, shift)]
}

// Format days so .5 renders cleanly (6, 5.5, 5 ...). Pure helper.
function fmtDays(d: number): string {
  return Number.isInteger(d) ? String(d) : d.toFixed(1)
}

export default function ChaseDemoPage() {
  const [state, setState] = useState<ChaseState>(initialState)
  const [phase, setPhase] = useState<Phase>('clue')
  // Feedback text after a correct pick.
  const [hotMessage, setHotMessage] = useState<string | null>(null)
  // Gate persistence until init has run — otherwise the save effect can write the
  // default state (freePresses:0) before the carried-boon read commits, and a
  // StrictMode double-invoke would then restore that 0 over the boon.
  const [inited, setInited] = useState(false)

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
        setInited(true)
        return // restored an in-progress chase; carried boon already baked in
      }
    } catch {
      /* ignore corrupt session blob */
    }
    // Fresh chase — read carried assets from the cross-game ledger ONCE (read-only).
    // What you earned in other games (Shrewdness/Diplomacy, a good name) travels in
    // as free witness presses. Never throws — readCarriedBoon is fully defensive.
    const boon = readCarriedBoon()
    if (boon.freePresses > 0) {
      setState((s) => ({ ...s, freePresses: boon.freePresses }))
    }
    setInited(true)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !inited) return
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ state, phase }))
    } catch {
      /* sessionStorage may be unavailable — non-fatal for a prototype */
    }
  }, [state, phase, inited])

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

  // Beat 1 — the warming trail: how far ahead Vane is, and his shrinking mark.
  const lead = hop.lead
  const vaneMark = VANE_MARKS[Math.min(state.hopIndex, VANE_MARKS.length - 1)]
  const isFinalHop = state.hopIndex === CHASE.length - 1
  // Terminal "Vane is caught" phases — the map stays cornered, poster complete.
  const captured = phase === 'won' || phase === 'reckoning' || phase === 'verdict'

  const witnessLine = useMemo(() => {
    if (state.redirect) return state.redirect.line
    return state.revealedHard ? hop.hardClue : hop.easyClue
  }, [state.redirect, state.revealedHard, hop])

  const witnessName = state.redirect ? state.redirect.witnessName : hop.witness.name
  const witnessRole = state.redirect ? state.redirect.witnessRole : hop.witness.role

  // --- actions --------------------------------------------------------------

  // Beat 3 — pressing the witness costs a half-day. Free during recovery (a
  // redirect already gave the easy clue, so there's nothing to press). Charged
  // only once per hop (revealedHard guards a double-charge). Pure updater; the
  // lose-on-overpress transition is decided from the post-decrement value.
  const pressHarder = useCallback(() => {
    if (phase !== 'clue') return
    if (state.redirect || state.revealedHard) return
    // A carried boon (sharp eye / silver tongue / good name) spends no day.
    if (state.freePresses > 0) {
      setState((s) =>
        s.redirect || s.revealedHard
          ? s
          : { ...s, revealedHard: true, freePresses: s.freePresses - 1 },
      )
      return
    }
    const remaining = state.days - PRESS_COST
    if (remaining <= 0) {
      setState((s) => ({ ...s, days: 0 }))
      setPhase('lost')
      return
    }
    setState((s) =>
      s.redirect || s.revealedHard
        ? s
        : { ...s, days: s.days - PRESS_COST, revealedHard: true },
    )
  }, [phase, state.redirect, state.revealedHard, state.days, state.freePresses])

  const pick = useCallback(
    (townId: string) => {
      if (phase !== 'clue') return
      setHotMessage(null)

      if (townId === hop.toId) {
        // CORRECT — advance. All next-state computed purely, then committed.
        setState((s) => {
          const nextHop = s.hopIndex + 1
          const nextRoute = [...s.routeIds, townId]
          const alreadyHas = s.traits.some(
            (t) => t.label === hop.trait.label && t.value === hop.trait.value,
          )
          const nextTraits = alreadyHas ? s.traits : [...s.traits, hop.trait]
          return {
            ...s,
            hopIndex: nextHop,
            routeIds: nextRoute,
            traits: nextTraits,
            revealedHard: false,
            redirect: null,
          }
        })
        if (isFinalHop) {
          setPhase('won')
        } else {
          setHotMessage(
            `The trail's hot — Vane came through ${TOWNS[townId].name}, ${lead.label.toLowerCase()}. ` +
              `A witness adds to the warrant: ${hop.trait.label} — ${hop.trait.value}.`,
          )
          setPhase('feedback')
        }
      } else {
        // WRONG — find which distractor was picked (cold vs near-miss, Beat 2).
        const distractor =
          hop.distractors.find((d) => d.townId === townId) ?? hop.distractors[0]
        const remaining = state.days - 1
        if (remaining <= 0) {
          setState((s) => ({ ...s, days: 0 }))
          setPhase('lost')
          return
        }
        // A near-miss banks its teased trait early (only if genuinely new).
        setState((s) => {
          let nextTraits = s.traits
          if (distractor.kind === 'near-miss' && distractor.tease) {
            const tease = distractor.tease
            const has = s.traits.some(
              (t) => t.label === tease.label && t.value === tease.value,
            )
            if (!has) nextTraits = [...s.traits, tease]
          }
          return {
            ...s,
            days: remaining,
            traits: nextTraits,
            // Recovery clue is free: drop any paid hard-clue state on redirect.
            revealedHard: false,
            redirect: {
              witnessName: distractor.witness.name,
              witnessRole: distractor.witness.role,
              line: distractor.line,
            },
          }
        })
        setPhase('clue')
      }
    },
    [phase, hop, isFinalHop, lead.label, state.days],
  )

  const continueAfterCorrect = useCallback(() => {
    setHotMessage(null)
    setPhase('clue')
  }, [])

  // After cornering Vane, take him to the circuit court at San Andreas — the
  // chase resolves in a reckoning, not another chase. Pure phase transition.
  const bringToCourt = useCallback(() => {
    if (phase !== 'won') return
    setPhase('reckoning')
  }, [phase])

  // The player decides the Tare's fate: the gallows, the prison, or mercy +
  // restitution. Narrative-only (see VERDICTS) — nothing is minted client-side.
  const passSentence = useCallback(
    (kind: VerdictKind) => {
      if (phase !== 'reckoning') return
      setState((s) => (s.verdict ? s : { ...s, verdict: kind }))
      // CONTRIBUTE to the shared ledger — one intentional write at the verdict.
      // Mercy nudges Good karma; best-effort (never throws). Fires once: phase
      // moves to 'verdict' below, so a repeat call returns at the guard above.
      recordVerdict(kind)
      setPhase('verdict')
    },
    [phase],
  )

  const retry = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* non-fatal */
    }
    // Re-read the carried boon so a replay keeps its continuity advantage.
    const boon = readCarriedBoon()
    setState({ ...initialState(), freePresses: boon.freePresses })
    setPhase('clue')
    setHotMessage(null)
  }, [])

  // Is the active redirect a near-miss (warm) vs cold? Drives the redirect copy.
  const redirectIsNearMiss = useMemo(() => {
    if (!state.redirect) return false
    return hop.distractors.some(
      (d) => d.kind === 'near-miss' && d.witness.name === state.redirect!.witnessName,
    )
  }, [state.redirect, hop])

  // --- render ---------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1c2c] via-[#0f0f1b] to-black px-3 py-4 sm:px-6">
      {/* Side-quest banner */}
      <div className="mx-auto mb-4 max-w-5xl border-2 border-dashed border-[var(--pixel-fire-orange)]/70 bg-[var(--pixel-fire-orange)]/10 px-3 py-2">
        <p className="font-[var(--font-pixel)] text-[10px] sm:text-[11px] leading-relaxed text-[var(--pixel-fire-orange)]">
          A SIDE-QUEST set in the real Mother Lode — read each witness, follow each town&apos;s true history, and corner Cyrus Vane before the trail goes cold.
        </p>
      </div>

      <div className="mx-auto max-w-5xl">
        <header className="mb-4 text-center">
          <h1 className="font-[var(--font-pixel)] text-[15px] leading-relaxed text-[var(--pixel-gold-light)] sm:text-[20px]">
            THE TARE&apos;S TRAIL
          </h1>
          <p className="mt-2 font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-ui-text)] sm:text-[12px]">
            Where did Cyrus Vane go?
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
              {fmtDays(state.days)}
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
            {/* Town-backdrop slot — the 64-bit period picture of the current town
                drops in at /chase/town-{id}.png (researched from Street View +
                history, verified same-place). Renders nothing until it lands. */}
            <ChaseArt
              src={`/chase/town-${currentId}.png`}
              alt={`${TOWNS[currentId].name} — period view`}
              className="w-full border-2 border-[var(--pixel-gold-dark)] object-cover"
              fallback={<></>}
            />
            <ChaseMap
              routeIds={state.routeIds}
              currentId={currentId}
              vaneMark={
                captured
                  ? VANE_MARKS[VANE_MARKS.length - 1]
                  : hasActiveHop
                    ? vaneMark
                    : null
              }
              leadLabel={captured ? 'CORNERED' : hasActiveHop ? lead.label : null}
              proximity={hasActiveHop ? lead.proximity : 1}
              cornered={captured}
            />

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
                  He was only <span className="text-[var(--pixel-fire-orange)]">hours ahead</span> —
                  and you closed the gap. At {TOWNS[currentId].name}, the road agent tips his hat,
                  sets down his dime novel, and surrenders without a fight — with{' '}
                  <span className="text-[var(--pixel-gold-light)]">{fmtDays(state.days)}</span> day
                  {state.days === 1 ? '' : 's'} to spare. The warrant is complete.
                </p>
                <p className="mt-3 font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)]/70">
                  But catching the Tare is only half the trail — he must answer for it.
                </p>
                <button
                  onClick={bringToCourt}
                  data-testid="to-court-button"
                  className="mt-4 border-2 border-[var(--pixel-gold-dark)] px-4 py-2 font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] transition-all hover:bg-[var(--pixel-gold-dark)]/20"
                >
                  BRING HIM TO COURT {'▶'}
                </button>
              </div>
            )}

            {/* RECKONING — the court at San Andreas; the player decides his fate */}
            {phase === 'reckoning' && (
              <div
                className="border-2 border-[var(--pixel-gold-mid)] bg-black/40 p-4"
                data-testid="reckoning-panel"
              >
                <p className="font-[var(--font-pixel)] text-[12px] leading-relaxed text-[var(--pixel-gold-light)] sm:text-[14px]">
                  THE RECKONING — THE COURT AT SAN ANDREAS
                </p>
                <p className="mt-3 font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-ui-text)]">
                  In the same stone courthouse where a gentleman bandit once faced a judge,
                  Cyrus Vane stands before the circuit court. The wanted poster — every trait
                  you wrote into it on the trail — is read into evidence, and the Tare is
                  convicted of salting claims and passing false assay across four counties.
                  The judge turns to you, who ran him down, and asks what justice you would see
                  done.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    onClick={() => passSentence('gallows')}
                    data-testid="sentence-gallows"
                    className="flex flex-col border-2 border-[var(--pixel-fire-red)]/70 bg-[var(--pixel-fire-red)]/10 p-3 text-left transition-all hover:bg-[var(--pixel-fire-red)]/20"
                  >
                    <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-fire-orange)]">
                      The Gallows
                    </span>
                    <span className="mt-2 font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)]/70">
                      Hang him at dawn. Hard, final frontier justice.
                    </span>
                  </button>
                  <button
                    onClick={() => passSentence('prison')}
                    data-testid="sentence-prison"
                    className="flex flex-col border-2 border-[var(--pixel-ui-border)] bg-black/30 p-3 text-left transition-all hover:border-[var(--pixel-gold-mid)] hover:bg-[var(--pixel-gold-dark)]/15"
                  >
                    <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)]">
                      The Prison
                    </span>
                    <span className="mt-2 font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)]/70">
                      Years of hard labor at San Quentin. The law&apos;s measured hand.
                    </span>
                  </button>
                  <button
                    onClick={() => passSentence('mercy')}
                    data-testid="sentence-mercy"
                    className="flex flex-col border-2 border-[var(--pixel-forest-light)]/70 bg-[var(--pixel-forest-dark)]/15 p-3 text-left transition-all hover:bg-[var(--pixel-forest-dark)]/30"
                  >
                    <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-forest-light)]">
                      Mercy &amp; Restitution
                    </span>
                    <span className="mt-2 font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)]/70">
                      Spare his life; make him return the gold and right the wronged.
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* VERDICT — the chosen fate plays out; the trail ends here */}
            {phase === 'verdict' && state.verdict && (
              <div
                className={`border-2 p-4 text-center ${
                  state.verdict === 'mercy'
                    ? 'border-[var(--pixel-forest-light)] bg-[var(--pixel-forest-dark)]/25'
                    : state.verdict === 'gallows'
                      ? 'border-[var(--pixel-fire-red)] bg-[var(--pixel-fire-red)]/15'
                      : 'border-[var(--pixel-gold-mid)] bg-black/40'
                }`}
                data-testid="verdict-panel"
                data-verdict={state.verdict}
              >
                {/* Storybook register — the narrative beat. Real art at
                    /chase/verdict-{kind}.png replaces the emblem when it lands. */}
                <div className="mb-3">
                  <ChaseArt
                    src={`/chase/verdict-${state.verdict}.png`}
                    alt={`The reckoning: ${VERDICTS[state.verdict].title}`}
                    fallback={<VerdictEmblem kind={state.verdict} />}
                    className="mx-auto h-28 w-full border-2 border-[var(--pixel-gold-dark)] object-cover sm:h-36"
                  />
                </div>
                <p className="font-[var(--font-pixel)] text-[12px] leading-relaxed text-[var(--pixel-gold-light)] sm:text-[14px]">
                  {VERDICTS[state.verdict].title}
                </p>
                <p className="mt-3 font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-ui-text)]">
                  {VERDICTS[state.verdict].body}
                </p>
                <p className="mt-3 font-[var(--font-pixel)] text-[9px] leading-relaxed text-[var(--pixel-ui-text)]/50">
                  This judgment is remembered — it travels with you to the rest of the Trail.
                </p>
                <button
                  onClick={retry}
                  data-testid="new-trail-button"
                  className="mt-4 border-2 border-[var(--pixel-gold-dark)] px-4 py-2 font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] transition-all hover:bg-[var(--pixel-gold-dark)]/20"
                >
                  TAKE A NEW TRAIL
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
                {/* Diegetic opening — shown only at the very start, rooted in the real
                    West Point country (the land that becomes Back of Beyond Ranch). */}
                {state.routeIds.length === 1 && !state.redirect && (
                  <div
                    className="border-2 border-[var(--pixel-gold-dark)] bg-black/30 p-3"
                    data-testid="story-intro"
                  >
                    <p className="font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)]/80">
                      {STORY_INTRO}
                    </p>
                  </div>
                )}

                {/* Continuity — carried boon earned in other games (read once at start) */}
                {state.freePresses > 0 && (
                  <div
                    className="border-2 border-[var(--pixel-forest-light)]/50 bg-[var(--pixel-forest-dark)]/15 px-3 py-2"
                    data-testid="carried-boon"
                  >
                    <span className="font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-forest-light)]">
                      CARRIED BOON — what you earned elsewhere travels with you:{' '}
                      {state.freePresses} free witness press{state.freePresses === 1 ? '' : 'es'}.
                    </span>
                  </div>
                )}

                {/* Beat 1 — warming-trail lead readout */}
                <div
                  className={`flex items-center justify-between border-2 px-3 py-2 ${
                    isFinalHop
                      ? 'border-[var(--pixel-fire-orange)] bg-[var(--pixel-fire-orange)]/15'
                      : 'border-[var(--pixel-gold-dark)]/60 bg-black/30'
                  }`}
                  data-testid="lead-readout"
                >
                  <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]/70">
                    THE TRAIL
                  </span>
                  <span
                    className={`font-[var(--font-pixel)] text-[11px] ${
                      isFinalHop
                        ? 'text-[var(--pixel-fire-orange)]'
                        : 'text-[var(--pixel-gold-light)]'
                    }`}
                    data-testid="lead-label"
                  >
                    VANE IS {lead.label}
                    {isFinalHop ? ' — CORNER HIM' : ''}
                  </span>
                </div>

                {/* witness card */}
                <div
                  className={`border-2 p-4 ${
                    state.redirect
                      ? redirectIsNearMiss
                        ? 'border-[var(--pixel-gold-mid)]/80 bg-[var(--pixel-gold-dark)]/15'
                        : 'border-[var(--pixel-fire-orange)]/70 bg-[var(--pixel-fire-orange)]/10'
                      : 'border-[var(--pixel-gold-dark)] bg-black/40'
                  }`}
                  data-testid="witness-card"
                >
                  {/* JRPG dialogue composition — old-style pixel NPC + the witness's words */}
                  <div className="flex gap-3">
                    <WitnessSprite npcKey={witnessName.toLowerCase().split(' ')[0]} />
                    <div className="min-w-0 flex-1">
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
                    </div>
                  </div>

                  {/* Beat 1 — fresh-trail flavor on the primary witness clue */}
                  {!state.redirect && (
                    <p
                      className="mt-2 font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)]/55"
                      data-testid="lead-flavor"
                    >
                      {lead.flavor}
                    </p>
                  )}

                  {/* Beat 2 — distinct near-miss vs cold redirect copy */}
                  {state.redirect && (
                    <p
                      className={`mt-2 font-[var(--font-pixel)] text-[10px] leading-relaxed ${
                        redirectIsNearMiss
                          ? 'text-[var(--pixel-gold-light)]'
                          : 'text-[var(--pixel-fire-orange)]'
                      }`}
                      data-testid="redirect-note"
                    >
                      {redirectIsNearMiss
                        ? "A near-miss — you cost yourself a day, but you caught his scent. Check the poster."
                        : "Cold trail. You've wasted a day here — but this witness points the way."}
                    </p>
                  )}

                  {/* Beat 3 — pressing harder costs a half-day (free in recovery) */}
                  {!state.redirect && !state.revealedHard && (
                    <button
                      onClick={pressHarder}
                      data-testid="press-harder"
                      className="mt-3 font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]/70 underline transition-colors hover:text-[var(--pixel-gold-light)]"
                    >
                      {state.freePresses > 0
                        ? `Press ${witnessName.split(' ')[0]} for a sharper detail... (free — ${state.freePresses} boon${state.freePresses === 1 ? '' : 's'} left)`
                        : `Press ${witnessName.split(' ')[0]} for a sharper detail... (costs ½ day)`}
                    </button>
                  )}
                  {!state.redirect && state.revealedHard && (
                    <p className="mt-3 font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]/50 italic">
                      You leaned on {witnessName.split(' ')[0]} — half a day spent for the sharper word.
                    </p>
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
              complete={captured}
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
