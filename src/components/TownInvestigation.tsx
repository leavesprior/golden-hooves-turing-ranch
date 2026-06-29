'use client'

// ============================================================================
// TOWN INVESTIGATION shell (2026-06-17) — renders any TownInvestigation in the
// "Where in Time" style: witness-narrated dual clues (free read + a harder read
// that costs leads), an evidence case file that fills as you go, a draining
// LEADS resource, and a grounded VERDICT + cited real history on the solve.
//
// Spatial sibling of /adventure/where-in-time. Self-contained: own in-memory
// state machine, PlaceBackdrop for pictures, optional cross-game milestone on
// solve (defensive — never breaks the page). Data: src/lib/townInvestigations.ts
// ============================================================================

import { useState } from 'react'
import Link from 'next/link'
import { PlaceBackdrop } from '@/components/PlaceBackdrop'
import {
  type TownInvestigation as TownCase,
  type CaseEvidence,
  START_LEADS,
  PRESS_COST,
} from '@/lib/townInvestigations'

type Phase = 'setup' | 'scene' | 'feedback' | 'solved' | 'cold'
const GOLD = 'var(--pixel-gold-light)'

export function TownInvestigation({ investigation }: { investigation: TownCase }) {
  const [phase, setPhase] = useState<Phase>('setup')
  const [sceneIndex, setSceneIndex] = useState(0)
  const [leads, setLeads] = useState(START_LEADS)
  const [pressed, setPressed] = useState(false)
  const [evidence, setEvidence] = useState<CaseEvidence[]>([])
  const [lastFeedback, setLastFeedback] = useState('')

  const scenes = investigation.scenes
  const scene = scenes[sceneIndex]

  function reset() {
    setPhase('setup'); setSceneIndex(0); setLeads(START_LEADS)
    setPressed(false); setEvidence([]); setLastFeedback('')
  }

  function press() {
    if (pressed) return
    const next = leads - PRESS_COST
    setPressed(true)
    setLeads(next)
    // Allow leads to reach exactly 0 so the hard clue (paid for by this press)
    // still renders; only go cold once leads would go negative.
    if (next < 0) setPhase('cold')
  }

  function choose(id: string) {
    if (id === scene.answer) {
      setEvidence((e) => (e.some((x) => x.label === scene.evidence.label) ? e : [...e, scene.evidence]))
      setLastFeedback(scene.feedback)
      if (sceneIndex + 1 >= scenes.length) {
        recordSolved(investigation.townId)
        setPhase('solved')
      } else {
        setPhase('feedback')
      }
    } else {
      const next = leads - 1
      setLeads(next)
      setLastFeedback(scene.wrongHint)
      if (next <= 0) setPhase('cold')
      else setPhase('feedback')
    }
  }

  function advance() {
    // After correct feedback move to next scene; after wrong feedback retry same scene.
    const wasCorrect = lastFeedback === scene.feedback
    if (wasCorrect) { setSceneIndex((i) => i + 1); setPressed(false) }
    setPhase('scene')
  }

  const leadsLow = leads <= 2

  return (
    <div className="mx-auto max-w-4xl px-3 py-4 font-[var(--font-pixel)] text-[var(--pixel-ui-text)]">
      {/* header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[14px]" style={{ color: GOLD }}>{investigation.title}</h1>
        <Link href="/map" className="text-[10px] text-[var(--pixel-ui-text)]/70 hover:text-[var(--pixel-gold-light)]">◂ map</Link>
      </div>

      {/* status bar */}
      {phase !== 'setup' && (
        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-2 border-[var(--pixel-gold-dark)] bg-black/40 px-3 py-2 text-[10px]">
          <span>QUARRY: <span style={{ color: GOLD }}>{investigation.villain}</span></span>
          <span>LEADS: <span style={{ color: leadsLow ? '#f59e0b' : GOLD }}>{leads}</span></span>
          {phase !== 'solved' && phase !== 'cold' && <span>PLACE {sceneIndex + 1}/{scenes.length}</span>}
          <span>EVIDENCE: <span style={{ color: GOLD }}>{evidence.length}</span></span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <div>
          {/* SETUP */}
          {phase === 'setup' && (
            <div className="border-2 border-[var(--pixel-gold-dark)] bg-black/30 p-4">
              {scenes[0]?.art && <PlaceBackdrop id={scenes[0].art} className="mb-3 h-44 rounded border-2 border-[#4b3a7a]" />}
              <p className="text-[11px] leading-relaxed">{investigation.setup}</p>
              <button onClick={() => setPhase('scene')} className="mt-4 border-2 border-[var(--pixel-gold-dark)] bg-[var(--pixel-gold-dark)]/20 px-4 py-2 text-[11px] hover:bg-[var(--pixel-gold-dark)]/40" style={{ color: GOLD }}>
                BEGIN THE INVESTIGATION ▶
              </button>
            </div>
          )}

          {/* SCENE */}
          {phase === 'scene' && scene && (
            <div className="border-2 border-[var(--pixel-gold-dark)] bg-black/30 p-4">
              <h2 className="mb-2 text-[12px]" style={{ color: GOLD }}>{scene.place}</h2>
              {scene.art && <PlaceBackdrop id={scene.art} className="mb-3 h-40 rounded border-2 border-[#4b3a7a]" />}
              <p className="text-[10px] text-[var(--pixel-ui-text)]/70">{scene.witness.name} · {scene.witness.role}</p>
              <p className="mt-2 text-[11px] leading-relaxed">{scene.prompt}</p>
              <div className="mt-3 border-l-2 border-[var(--pixel-gold-mid)] pl-3 text-[11px] italic leading-relaxed">{scene.clueEasy}</div>
              {pressed
                ? <div className="mt-2 border-l-2 border-[#f59e0b] pl-3 text-[11px] italic leading-relaxed text-[var(--pixel-gold-light)]">{scene.clueHard}</div>
                : <button onClick={press} className="mt-3 text-[10px] text-[#f59e0b] hover:underline">Press the witness harder… (−{PRESS_COST} leads)</button>}

              <p className="mt-4 mb-2 text-[10px] text-[var(--pixel-ui-text)]/60">Where does the trail lead?</p>
              <div className="flex flex-col gap-2">
                {scene.choices.map((c) => (
                  <button key={c.id} onClick={() => choose(c.id)} className="border border-[var(--pixel-ui-border)] bg-black/40 px-3 py-2 text-left text-[11px] hover:border-[var(--pixel-gold-mid)] hover:bg-[var(--pixel-gold-dark)]/20" style={{ color: GOLD }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FEEDBACK */}
          {phase === 'feedback' && (
            <div className="border-2 border-[var(--pixel-gold-dark)] bg-black/30 p-4">
              <p className="text-[11px] leading-relaxed">{lastFeedback}</p>
              <button onClick={advance} className="mt-4 border-2 border-[var(--pixel-gold-dark)] bg-[var(--pixel-gold-dark)]/20 px-4 py-2 text-[11px] hover:bg-[var(--pixel-gold-dark)]/40" style={{ color: GOLD }}>
                {lastFeedback === scene?.feedback ? 'FOLLOW THE TRAIL ▶' : 'TRY AGAIN ▶'}
              </button>
            </div>
          )}

          {/* SOLVED */}
          {phase === 'solved' && (
            <div className="border-2 border-[var(--pixel-gold-dark)] bg-black/30 p-4">
              <h2 className="mb-2 text-[13px]" style={{ color: GOLD }}>CASE CLOSED</h2>
              <p className="text-[11px] leading-relaxed">{investigation.verdict}</p>
              <div className="mt-4 border-2 border-[#4b3a7a] bg-black/40 p-3">
                <h3 className="mb-2 text-[10px]" style={{ color: GOLD }}>THE REAL HISTORY</h3>
                <ul className="space-y-1.5">
                  {investigation.sources.map((s, i) => (
                    <li key={i} className="text-[10px] leading-relaxed text-[var(--pixel-ui-text)]/80">• {s}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={reset} className="border-2 border-[var(--pixel-gold-dark)] px-3 py-2 text-[10px] hover:bg-[var(--pixel-gold-dark)]/20" style={{ color: GOLD }}>INVESTIGATE AGAIN</button>
                <Link href="/explore" className="border-2 border-[var(--pixel-gold-dark)] px-3 py-2 text-[10px] hover:bg-[var(--pixel-gold-dark)]/20" style={{ color: GOLD }}>EXPLORE THIS TOWN ▸</Link>
                <Link href="/map" className="border-2 border-[var(--pixel-gold-dark)] px-3 py-2 text-[10px] hover:bg-[var(--pixel-gold-dark)]/20" style={{ color: GOLD }}>BACK TO THE MAP ▸</Link>
              </div>
            </div>
          )}

          {/* COLD */}
          {phase === 'cold' && (
            <div className="border-2 border-[#7a2a2a] bg-black/30 p-4">
              <h2 className="mb-2 text-[13px] text-[#f59e0b]">THE TRAIL GOES COLD</h2>
              <p className="text-[11px] leading-relaxed">You chased too many wrong leads, and the town closes ranks. Vane is gone — for now.</p>
              <button onClick={reset} className="mt-4 border-2 border-[var(--pixel-gold-dark)] px-4 py-2 text-[11px] hover:bg-[var(--pixel-gold-dark)]/20" style={{ color: GOLD }}>PICK UP THE TRAIL AGAIN ▶</button>
            </div>
          )}
        </div>

        {/* CASE FILE sidebar */}
        <aside className="border-2 border-[var(--pixel-gold-dark)] bg-black/40 p-3">
          <h3 className="mb-2 text-[10px]" style={{ color: GOLD }}>CASE FILE</h3>
          {evidence.length === 0
            ? <p className="text-[9px] text-[var(--pixel-ui-text)]/50">No evidence yet. Read the places by their true grain.</p>
            : <ul className="space-y-2">
                {evidence.map((e, i) => (
                  <li key={i} className="border-l-2 border-[var(--pixel-gold-mid)] pl-2">
                    <div className="text-[9px] text-[var(--pixel-gold-light)]">{e.label}</div>
                    <div className="text-[9px] leading-relaxed text-[var(--pixel-ui-text)]/75">{e.value}</div>
                  </li>
                ))}
              </ul>}
        </aside>
      </div>
    </div>
  )
}

// Defensive cross-game milestone — never breaks the page if storage shape changes.
function recordSolved(townId: string) {
  try {
    if (typeof window === 'undefined') return
    const KEY = 'bobr_town_cases_solved'
    const raw = window.localStorage.getItem(KEY)
    const solved: string[] = raw ? JSON.parse(raw) : []
    if (!solved.includes(townId)) {
      solved.push(townId)
      window.localStorage.setItem(KEY, JSON.stringify(solved))
    }
  } catch {
    /* no-op: investigation never depends on persistence */
  }
}
