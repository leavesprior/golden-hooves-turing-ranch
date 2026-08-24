'use client'

// ============================================================================
// THE BOUNTY TRAIL — a Carmen-Sandiego deduction chase across the Mother Lode.
//
// A self-contained side-quest, surfaced from the live /adventure hub. Its own
// route + own state in React + sessionStorage, never touching bobr_adventure_state
// or the live save system. The chase ends in a RECKONING (the court at San Andreas)
// where the player decides the quarry's fate, EARNS a visible reward (karma +
// recorded bounty), and "TAKE A NEW TRAIL" rotates to the NEXT uncaught case.
//
// 2026-06-16 BUGFIX (Leif playtest): (1) capture used to show NO reward — now the
// verdict screen surfaces the earned karma + a server-gated bounty record; (2)
// "next investigation" used to restart Vane forever — now there is a CASE ROSTER
// (CASES) and the trail rotates to a new quarry (Rattlesnake Dick, Tom Bell, ...).
//
// Clue grammar (docs/ADVENTURE_CLUE_REDESIGN_CARMEN_SANDIEGO.md §2):
//   Rule 1 — clues point at the NEXT town's attribute, never its name.
//   Rule 2 — clues come from named, diegetic witnesses.
//   Rule 3 — difficulty = obscurity (easy vs hard phrasing of one target).
//   Rule 4 — wrong picks cost a day, never the trail; always recoverable.
// v2 ACCELERATION beats (warming trail, near-miss distractors, costed harder clue)
// are unchanged and now per-case.
// ============================================================================

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CASES,
  TOWNS,
  PRESS_COST,
  SESSION_KEY,
  CAUGHT_KEY,
  HUME_FRAME,
  type CaseFile,
  type ClueHop,
  type WantedTrait,
} from './chaseData'
import { ChaseMap } from './ChaseMap'
import { WantedPoster } from './WantedPoster'
import { readCarriedBoon, recordVerdict, type VerdictReward } from './chaseLedger'
import { editorialForExplorePlace } from '@/lib/goldCountryEditorial'
import { ChaseArt, VerdictEmblem, WitnessSprite } from './ChaseArt'

type Phase = 'clue' | 'feedback' | 'won' | 'lost' | 'reckoning' | 'verdict'

/** What the player decides becomes of the quarry once he is cornered. */
type VerdictKind = 'gallows' | 'prison' | 'mercy'

interface ChaseState {
  caseIndex: number // which case in CASES is being chased
  hopIndex: number // which hop of the active chain we're resolving (0..3)
  days: number // may hold .5 (Beat 3 — pressing costs a half-day)
  routeIds: string[] // confirmed towns reached, in order
  traits: WantedTrait[]
  revealedHard: boolean // has the player paid to press harder this hop?
  redirect: { witnessName: string; witnessRole: string; line: string } | null
  verdict: VerdictKind | null
  freePresses: number // continuity boon carried from other games
}

// Villain-driven reckoning copy so each case reads correctly (not Vane-locked).
function verdictsFor(v: CaseFile['villain']): Record<VerdictKind, { title: string; body: string }> {
  return {
    gallows: {
      title: 'THE GALLOWS',
      body: `At dawn, behind the San Andreas courthouse, ${v.shortName} meets the rope for ${v.crimeShort}. The counties he wronged send no flowers — justice, hard and final.`,
    },
    prison: {
      title: 'THE TERRITORIAL PRISON',
      body: `The judge sends ${v.shortName} down the river to San Quentin — years of hard labor, every count of ${v.crimeShort} entered in the ledger. No road but the prison yard for a long while, and what he stole is counted back to its owners.`,
    },
    mercy: {
      title: 'MERCY & RESTITUTION',
      body: `You ask the court for mercy. ${v.shortName} makes restitution for ${v.crimeShort} and takes his sentence quietly — alive, and bound to make the wronged whole. Word travels the Mother Lode: the one who ran him down chose to let him live. Kindness, witnessed, has a way of coming back to you.`,
    },
  }
}

// Pick the first not-yet-caught case (fresh start / after rotation). Falls back
// to a given index if every case is already closed (a full cycle).
function firstUncaughtIndex(caught: string[], fallback = 0): number {
  for (let i = 0; i < CASES.length; i++) {
    if (!caught.includes(CASES[i].id)) return i
  }
  return fallback
}

function readCaught(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(CAUGHT_KEY) || '[]') as string[]
  } catch {
    return []
  }
}

function initialState(caseIndex: number): ChaseState {
  const c = CASES[caseIndex]
  return {
    caseIndex,
    hopIndex: 0,
    days: c.startingDays,
    routeIds: [c.chain[0].fromId],
    traits: [],
    revealedHard: false,
    redirect: null,
    verdict: null,
    freePresses: 0,
  }
}

// Deterministically order the 3 candidates so the correct answer isn't always in
// the same slot — rotate by hop index. Pure (no Math.random in render).
function candidatesFor(chain: ClueHop[], hopIndex: number): string[] {
  const hop = chain[hopIndex]
  const ids = [hop.toId, hop.distractors[0].townId, hop.distractors[1].townId]
  const shift = hopIndex % 3
  return [...ids.slice(shift), ...ids.slice(0, shift)]
}

function fmtDays(d: number): string {
  return Number.isInteger(d) ? String(d) : d.toFixed(1)
}

export default function ChaseDemoPage() {
  const [state, setState] = useState<ChaseState>(() => initialState(0))
  const [phase, setPhase] = useState<Phase>('clue')
  const [hotMessage, setHotMessage] = useState<string | null>(null)
  const [verdictReward, setVerdictReward] = useState<VerdictReward | null>(null)
  const [inited, setInited] = useState(false)

  // --- session persistence (never touches the live save) --------------------
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (raw) {
        const saved = JSON.parse(raw) as { state: ChaseState; phase: Phase }
        if (saved?.state && typeof saved.state.caseIndex === 'number') {
          setState(saved.state)
          if (saved.phase) setPhase(saved.phase)
          setInited(true)
          return
        }
      }
    } catch {
      /* ignore corrupt session blob */
    }
    // Fresh chase — start at the first uncaught case, and read the carried boon once.
    const startIdx = firstUncaughtIndex(readCaught(), 0)
    const boon = readCarriedBoon()
    setState({ ...initialState(startIdx), freePresses: boon.freePresses })
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

  // --- active case + derived hop values -------------------------------------
  const activeCase = CASES[state.caseIndex] ?? CASES[0]
  const chain = activeCase.chain
  const villain = activeCase.villain
  const villainUpper = villain.shortName.toUpperCase()
  const totalTraits = chain.length

  const hop = chain[state.hopIndex] ?? chain[chain.length - 1]
  const hasActiveHop = state.hopIndex < chain.length
  const currentId = state.routeIds[state.routeIds.length - 1]
  const candidates = useMemo(
    () => (hasActiveHop ? candidatesFor(chain, state.hopIndex) : []),
    [hasActiveHop, chain, state.hopIndex],
  )

  const lead = hop.lead
  const quarryMark = activeCase.marks[Math.min(state.hopIndex, activeCase.marks.length - 1)]
  const isFinalHop = state.hopIndex === chain.length - 1
  const captured = phase === 'won' || phase === 'reckoning' || phase === 'verdict'
  const VERDICTS = useMemo(() => verdictsFor(villain), [villain])

  const witnessLine = useMemo(() => {
    if (state.redirect) return state.redirect.line
    return state.revealedHard ? hop.hardClue : hop.easyClue
  }, [state.redirect, state.revealedHard, hop])

  const witnessName = state.redirect ? state.redirect.witnessName : hop.witness.name
  const witnessRole = state.redirect ? state.redirect.witnessRole : hop.witness.role

  // --- actions --------------------------------------------------------------

  const pressHarder = useCallback(() => {
    if (phase !== 'clue') return
    if (state.redirect || state.revealedHard) return
    if (state.freePresses > 0) {
      setState((s) =>
        s.redirect || s.revealedHard ? s : { ...s, revealedHard: true, freePresses: s.freePresses - 1 },
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
      s.redirect || s.revealedHard ? s : { ...s, days: s.days - PRESS_COST, revealedHard: true },
    )
  }, [phase, state.redirect, state.revealedHard, state.days, state.freePresses])

  const pick = useCallback(
    (townId: string) => {
      if (phase !== 'clue') return
      setHotMessage(null)

      if (townId === hop.toId) {
        setState((s) => {
          const nextHop = s.hopIndex + 1
          const nextRoute = [...s.routeIds, townId]
          const alreadyHas = s.traits.some(
            (t) => t.label === hop.trait.label && t.value === hop.trait.value,
          )
          const nextTraits = alreadyHas ? s.traits : [...s.traits, hop.trait]
          return { ...s, hopIndex: nextHop, routeIds: nextRoute, traits: nextTraits, revealedHard: false, redirect: null }
        })
        if (isFinalHop) {
          setPhase('won')
        } else {
          setHotMessage(
            `The trail's hot — ${villain.shortName} came through ${TOWNS[townId].name}, ${lead.label.toLowerCase()}. ` +
              `A witness adds to the warrant: ${hop.trait.label} — ${hop.trait.value}.`,
          )
          setPhase('feedback')
        }
      } else {
        const distractor = hop.distractors.find((d) => d.townId === townId) ?? hop.distractors[0]
        const remaining = state.days - 1
        if (remaining <= 0) {
          setState((s) => ({ ...s, days: 0 }))
          setPhase('lost')
          return
        }
        setState((s) => {
          let nextTraits = s.traits
          if (distractor.kind === 'near-miss' && distractor.tease) {
            const tease = distractor.tease
            const has = s.traits.some((t) => t.label === tease.label && t.value === tease.value)
            if (!has) nextTraits = [...s.traits, tease]
          }
          return {
            ...s,
            days: remaining,
            traits: nextTraits,
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
    [phase, hop, isFinalHop, lead.label, state.days, villain.shortName],
  )

  const continueAfterCorrect = useCallback(() => {
    setHotMessage(null)
    setPhase('clue')
  }, [])

  const bringToCourt = useCallback(() => {
    if (phase !== 'won') return
    setPhase('reckoning')
  }, [phase])

  // The player decides the quarry's fate. recordVerdict writes ONE ledger event
  // and RETURNS the earned (visible) reward — surfaced on the verdict panel.
  const passSentence = useCallback(
    (kind: VerdictKind) => {
      if (phase !== 'reckoning') return
      setState((s) => (s.verdict ? s : { ...s, verdict: kind }))
      const reward = recordVerdict(kind, villain.name)
      setVerdictReward(reward)
      setPhase('verdict')
    },
    [phase, villain.name],
  )

  // "TAKE A NEW TRAIL" — rotate to the NEXT uncaught case (bugfix: no longer
  // restarts the same quarry). A LOST chase retries the SAME case. When every
  // case is closed, the roster cycles fresh.
  const startNextTrail = useCallback(() => {
    let caught = readCaught()
    const curId = CASES[state.caseIndex].id
    let nextIdx: number
    if (phase === 'verdict') {
      if (!caught.includes(curId)) caught = [...caught, curId]
      if (caught.length >= CASES.length) {
        caught = [] // full cycle — every quarry brought in; start the roster over
        nextIdx = (state.caseIndex + 1) % CASES.length
      } else {
        nextIdx = firstUncaughtIndex(caught, (state.caseIndex + 1) % CASES.length)
      }
    } else {
      nextIdx = state.caseIndex // lost → retry the same case
    }
    try {
      sessionStorage.setItem(CAUGHT_KEY, JSON.stringify(caught))
      sessionStorage.removeItem(SESSION_KEY)
    } catch {
      /* non-fatal */
    }
    const boon = readCarriedBoon()
    setState({ ...initialState(nextIdx), freePresses: boon.freePresses })
    setVerdictReward(null)
    setPhase('clue')
    setHotMessage(null)
  }, [phase, state.caseIndex])

  const redirectIsNearMiss = useMemo(() => {
    if (!state.redirect) return false
    return hop.distractors.some(
      (d) => d.kind === 'near-miss' && d.witness.name === state.redirect!.witnessName,
    )
  }, [state.redirect, hop])

  // Case progress for the header chip.
  const caughtCount = useMemo(() => {
    if (typeof window === 'undefined') return 0
    return readCaught().length
  }, [state.caseIndex])

  // --- render ---------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1c2c] via-[#0f0f1b] to-black px-3 py-4 sm:px-6">
      <div className="mx-auto mb-4 max-w-5xl border-2 border-dashed border-[var(--pixel-fire-orange)]/70 bg-[var(--pixel-fire-orange)]/10 px-3 py-2">
        <p className="font-[var(--font-pixel)] text-[10px] sm:text-[11px] leading-relaxed text-[var(--pixel-fire-orange)]">
          A SIDE-QUEST set in the real Mother Lode — read each witness, follow each town&apos;s true history, and run down {villain.shortName} before the trail goes cold.
        </p>
      </div>

      <div className="mx-auto max-w-5xl">
        <header className="mb-4 text-center">
          <h1 className="font-[var(--font-pixel)] text-[15px] leading-relaxed text-[var(--pixel-gold-light)] sm:text-[20px]">
            THE BOUNTY TRAIL
          </h1>
          <p className="mt-2 font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-ui-text)] sm:text-[12px]">
            Where is {villain.shortName}?
          </p>
          <p className="mt-1 font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)]/50">
            CASE {Math.min(caughtCount + 1, CASES.length)} OF {CASES.length}
          </p>
          <p className="mt-1 font-[var(--font-pixel)] text-[8px] tracking-widest text-[var(--pixel-gold-dark)]/80">
            {HUME_FRAME}
          </p>
        </header>

        <div className="mb-4 flex items-center justify-between border-2 border-[var(--pixel-ui-border)] bg-black/40 px-3 py-2">
          <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">
            DAYS LEFT:{' '}
            <span
              className={state.days <= 2 ? 'text-[var(--pixel-fire-orange)]' : 'text-[var(--pixel-gold-light)]'}
              data-testid="days-left"
            >
              {fmtDays(state.days)}
            </span>
          </span>
          <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">
            TOWN: <span className="text-[var(--pixel-gold-light)]">{TOWNS[currentId].name}</span>
          </span>
          <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]" data-testid="hop-progress">
            HOP {Math.min(state.hopIndex + 1, chain.length)}/{chain.length}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <ChaseArt
              src={editorialForExplorePlace(currentId) || `/chase/town-${currentId}.png`}
              alt={`${TOWNS[currentId].name} — period view`}
              className="w-full border-2 border-[var(--pixel-gold-dark)] object-cover"
              fallback={<></>}
            />
            <ChaseMap
              routeIds={state.routeIds}
              currentId={currentId}
              vaneMark={captured ? activeCase.marks[activeCase.marks.length - 1] : hasActiveHop ? quarryMark : null}
              leadLabel={captured ? 'CORNERED' : hasActiveHop ? lead.label : null}
              proximity={hasActiveHop ? lead.proximity : 1}
              cornered={captured}
            />

            {/* WON */}
            {phase === 'won' && (
              <div className="border-2 border-[var(--pixel-forest-light)] bg-[var(--pixel-forest-dark)]/25 p-4 text-center" data-testid="won-panel">
                <p className="font-[var(--font-pixel)] text-[13px] leading-relaxed text-[var(--pixel-forest-light)] sm:text-[15px]">
                  YOU&apos;VE CORNERED {villainUpper}!
                </p>
                <p className="mt-3 font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-ui-text)]">
                  He was only <span className="text-[var(--pixel-fire-orange)]">hours ahead</span> — and you closed the gap. At {TOWNS[currentId].name}, {villain.shortName} surrenders with{' '}
                  <span className="text-[var(--pixel-gold-light)]">{fmtDays(state.days)}</span> day{state.days === 1 ? '' : 's'} to spare. The warrant is complete.
                </p>
                <p className="mt-3 font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)]/70">
                  But catching him is only half the trail — he must answer for it.
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

            {/* RECKONING */}
            {phase === 'reckoning' && (
              <div className="border-2 border-[var(--pixel-gold-mid)] bg-black/40 p-4" data-testid="reckoning-panel">
                <p className="font-[var(--font-pixel)] text-[12px] leading-relaxed text-[var(--pixel-gold-light)] sm:text-[14px]">
                  THE RECKONING — THE COURT AT SAN ANDREAS
                </p>
                <p className="mt-3 font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-ui-text)]">
                  In the same stone courthouse where a gentleman bandit once faced a judge, {villain.name} stands before the circuit court. The wanted poster — every trait you wrote into it on the trail — is read into evidence, and he is convicted of {villain.crimeShort}. The judge turns to you, who ran him down, and asks what justice you would see done.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button onClick={() => passSentence('gallows')} data-testid="sentence-gallows" className="flex flex-col border-2 border-[var(--pixel-fire-red)]/70 bg-[var(--pixel-fire-red)]/10 p-3 text-left transition-all hover:bg-[var(--pixel-fire-red)]/20">
                    <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-fire-orange)]">The Gallows</span>
                    <span className="mt-2 font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)]/70">Hang him at dawn. Hard, final frontier justice.</span>
                  </button>
                  <button onClick={() => passSentence('prison')} data-testid="sentence-prison" className="flex flex-col border-2 border-[var(--pixel-ui-border)] bg-black/30 p-3 text-left transition-all hover:border-[var(--pixel-gold-mid)] hover:bg-[var(--pixel-gold-dark)]/15">
                    <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)]">The Prison</span>
                    <span className="mt-2 font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)]/70">Years of hard labor at San Quentin. The law&apos;s measured hand.</span>
                  </button>
                  <button onClick={() => passSentence('mercy')} data-testid="sentence-mercy" className="flex flex-col border-2 border-[var(--pixel-forest-light)]/70 bg-[var(--pixel-forest-dark)]/15 p-3 text-left transition-all hover:bg-[var(--pixel-forest-dark)]/30">
                    <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-forest-light)]">Mercy &amp; Restitution</span>
                    <span className="mt-2 font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)]/70">Spare his life; make him return the gold and right the wronged.</span>
                  </button>
                </div>
              </div>
            )}

            {/* VERDICT — chosen fate + the EARNED REWARD (bugfix) */}
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

                {/* EARNED REWARD — the payoff the player was missing. Karma is real
                    (earn-only); the bounty is RECORDED, server-minted at booking. */}
                {verdictReward && (
                  <div className="mx-auto mt-4 max-w-md border-2 border-[var(--pixel-gold-mid)] bg-black/50 p-3 text-left" data-testid="reward-panel">
                    <p className="font-[var(--font-pixel)] text-[10px] tracking-widest text-[var(--pixel-gold-light)]">
                      ⚖ BOUNTY CLAIMED — {villainUpper} IN CUSTODY
                    </p>
                    <p className="mt-2 font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-forest-light)]" data-testid="reward-karma">
                      {verdictReward.karmaLabel}
                    </p>
                    <p className="mt-2 font-[var(--font-pixel)] text-[9px] leading-relaxed text-[var(--pixel-ui-text)]/70" data-testid="reward-bounty">
                      {verdictReward.bountyNote}
                    </p>
                  </div>
                )}

                <p className="mt-3 font-[var(--font-pixel)] text-[9px] leading-relaxed text-[var(--pixel-ui-text)]/50">
                  This judgment is remembered — it travels with you to the rest of the Trail.
                </p>
                <button
                  onClick={startNextTrail}
                  data-testid="new-trail-button"
                  className="mt-4 border-2 border-[var(--pixel-gold-dark)] px-4 py-2 font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] transition-all hover:bg-[var(--pixel-gold-dark)]/20"
                >
                  TAKE A NEW TRAIL {'▶'}
                </button>
              </div>
            )}

            {/* LOST */}
            {phase === 'lost' && (
              <div className="border-2 border-[var(--pixel-fire-red)] bg-[var(--pixel-fire-red)]/15 p-4 text-center" data-testid="lost-panel">
                <p className="font-[var(--font-pixel)] text-[13px] leading-relaxed text-[var(--pixel-fire-orange)] sm:text-[15px]">
                  {villainUpper} SLIPPED AWAY INTO THE HILLS
                </p>
                <p className="mt-3 font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-ui-text)]">
                  The trail ran cold and the days ran out. Somewhere past {TOWNS[currentId].name}, {villain.shortName} walks on, free.
                </p>
                <button
                  onClick={startNextTrail}
                  data-testid="retry-button"
                  className="mt-4 border-2 border-[var(--pixel-gold-dark)] px-4 py-2 font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] transition-all hover:bg-[var(--pixel-gold-dark)]/20"
                >
                  RETRY THIS CASE
                </button>
              </div>
            )}

            {/* FEEDBACK */}
            {phase === 'feedback' && hotMessage && (
              <div className="border-2 border-[var(--pixel-forest-light)]/70 bg-[var(--pixel-forest-dark)]/20 p-4" data-testid="feedback-panel">
                <p className="font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-forest-light)]">{hotMessage}</p>
                <button onClick={continueAfterCorrect} data-testid="continue-button" className="mt-4 border-2 border-[var(--pixel-gold-dark)] px-4 py-2 font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] transition-all hover:bg-[var(--pixel-gold-dark)]/20">
                  PICK UP THE TRAIL {'▶'}
                </button>
              </div>
            )}

            {/* CLUE + candidate picker */}
            {phase === 'clue' && (
              <>
                {state.routeIds.length === 1 && !state.redirect && (
                  <div className="border-2 border-[var(--pixel-gold-dark)] bg-black/30 p-3" data-testid="story-intro">
                    <p className="font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)]/80">{activeCase.intro}</p>
                  </div>
                )}

                {state.freePresses > 0 && (
                  <div className="border-2 border-[var(--pixel-forest-light)]/50 bg-[var(--pixel-forest-dark)]/15 px-3 py-2" data-testid="carried-boon">
                    <span className="font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-forest-light)]">
                      CARRIED BOON — what you earned elsewhere travels with you: {state.freePresses} free witness press{state.freePresses === 1 ? '' : 'es'}.
                    </span>
                  </div>
                )}

                <div
                  className={`flex items-center justify-between border-2 px-3 py-2 ${
                    isFinalHop ? 'border-[var(--pixel-fire-orange)] bg-[var(--pixel-fire-orange)]/15' : 'border-[var(--pixel-gold-dark)]/60 bg-black/30'
                  }`}
                  data-testid="lead-readout"
                >
                  <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]/70">THE TRAIL</span>
                  <span
                    className={`font-[var(--font-pixel)] text-[11px] ${isFinalHop ? 'text-[var(--pixel-fire-orange)]' : 'text-[var(--pixel-gold-light)]'}`}
                    data-testid="lead-label"
                  >
                    {villainUpper} IS {lead.label}
                    {isFinalHop ? ' — CORNER HIM' : ''}
                  </span>
                </div>

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
                  <div className="flex gap-3">
                    <WitnessSprite npcKey={witnessName.toLowerCase().split(' ')[0]} />
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-baseline justify-between gap-2">
                        <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)]">
                          {state.redirect ? 'A NEW WITNESS' : 'WITNESS'}: {witnessName}
                        </span>
                        <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]/60">{witnessRole}</span>
                      </div>
                      <p className="font-[var(--font-pixel)] text-[11px] leading-relaxed text-[var(--pixel-ui-text)] sm:text-[12px]" data-testid="clue-text">
                        &ldquo;{witnessLine}&rdquo;
                      </p>
                    </div>
                  </div>

                  {!state.redirect && (
                    <p className="mt-2 font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)]/55" data-testid="lead-flavor">{lead.flavor}</p>
                  )}

                  {state.redirect && (
                    <p
                      className={`mt-2 font-[var(--font-pixel)] text-[10px] leading-relaxed ${redirectIsNearMiss ? 'text-[var(--pixel-gold-light)]' : 'text-[var(--pixel-fire-orange)]'}`}
                      data-testid="redirect-note"
                    >
                      {redirectIsNearMiss
                        ? 'A near-miss — you cost yourself a day, but you caught his scent. Check the poster.'
                        : "Cold trail. You've wasted a day here — but this witness points the way."}
                    </p>
                  )}

                  {!state.redirect && !state.revealedHard && (
                    <button onClick={pressHarder} data-testid="press-harder" className="mt-3 font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]/70 underline transition-colors hover:text-[var(--pixel-gold-light)]">
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

                <div>
                  <p className="mb-2 font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]/70">WHICH ROAD DO YOU TAKE?</p>
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
                          <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)]">{town.name}</span>
                          <span className="mt-2 font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)]/70">{town.descriptor}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Wanted Poster sidebar — now per-case */}
          <aside>
            <WantedPoster
              traits={state.traits}
              totalTraits={totalTraits}
              complete={captured}
              villainName={villain.name}
              villainDescription={villain.baseDescription}
              villainCharge={villain.charge}
              posterArt={`/chase/poster-${activeCase.id}.png`}
            />
            <p className="mt-3 px-1 font-[var(--font-pixel)] text-[9px] leading-relaxed text-[var(--pixel-ui-text)]/40">
              {villain.charge}. Real Gold Country towns; clues describe each town&apos;s true history without naming it.
            </p>
          </aside>
        </div>
      </div>
    </div>
  )
}
