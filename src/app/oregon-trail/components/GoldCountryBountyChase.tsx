'use client'

import { useEffect, useRef, useState } from 'react'
import type { SkillCheckResult, StatName } from '../characterContext'
import {
  ALLEY_LOOK,
  agilityDifficulty,
  alleyForFront,
  gunShotDifficulty,
  theyFireLuckDifficulty,
  calledShot,
  catchTimeout,
  chooseTool,
  fleshWalls,
  startChase,
  stepChase,
  theyFire,
  type CatchTool,
  type CalledShot,
  type ChaseOutcome,
  type ChaseState,
} from '@/lib/goldCountryAlley'
import { catchWindowMs, powderWindowMs } from '@/lib/gftAgeMode'

function wallBoards(place: ReturnType<typeof alleyForFront>): string {
  if (place === 'barrel_lane') {
    return 'repeating-linear-gradient(90deg, #5a3a1a 0 14px, #2a1208 14px 16px, #6a4420 16px 28px, #1a0c06 28px 30px)'
  }
  if (place === 'hole_drift') {
    return 'repeating-linear-gradient(90deg, #3d4a28 0 12px, #1a1610 12px 14px, #2a2418 14px 24px)'
  }
  return 'repeating-linear-gradient(0deg, #3d2818 0 18px, #2a1a10 18px 20px, #4a3018 20px 36px, #1a1008 36px 38px)'
}

export function GoldCountryBountyChase({
  frontId,
  alias,
  paperAllowsDead,
  wet = false,
  dryFlask = false,
  roll,
  onResolved,
  onStreet,
}: {
  frontId: string
  alias: string
  paperAllowsDead: boolean
  wet?: boolean
  dryFlask?: boolean
  roll: (stat: StatName, difficulty: number) => SkillCheckResult
  onResolved: (outcome: ChaseOutcome) => void
  onStreet: () => void
}) {
  const [chase, setChase] = useState<ChaseState>(() => startChase(alleyForFront(frontId), wet, dryFlask))
  const catchMs = catchWindowMs()
  const powderMs = powderWindowMs()
  const [leftMs, setLeftMs] = useState(catchMs)
  const resolvedOnce = useRef(false)
  const rollRef = useRef(roll)
  const look = ALLEY_LOOK[chase.place]

  useEffect(() => {
    rollRef.current = roll
  }, [roll])

  useEffect(() => {
    if (chase.phase !== 'catch' || chase.theyShot) return
    const t = window.setTimeout(() => {
      const hit = !rollRef.current('Luck', theyFireLuckDifficulty(chase)).success
      const disable: CatchTool = Math.random() < 0.5 ? 'gun' : 'rope'
      setChase((s) => theyFire(s, hit, disable))
    }, powderMs)
    return () => window.clearTimeout(t)
  }, [chase.phase, chase.theyShot, chase.wet, powderMs])

  useEffect(() => {
    if (chase.phase !== 'catch' || !chase.theyShot) return
    setLeftMs(catchMs)
    const started = Date.now()
    const id = window.setInterval(() => {
      const left = catchMs - (Date.now() - started)
      setLeftMs(Math.max(0, left))
      if (left <= 0) {
        window.clearInterval(id)
        setChase((s) => {
          if (s.phase !== 'catch') return s
          return catchTimeout(s)
        })
      }
    }, 50)
    return () => window.clearInterval(id)
  }, [chase.phase, chase.theyShot, catchMs])

  useEffect(() => {
    if (chase.phase !== 'resolved' || !chase.outcome || resolvedOnce.current) return
    const t = window.setTimeout(() => {
      resolvedOnce.current = true
      onResolved(chase.outcome!)
    }, 900)
    return () => window.clearTimeout(t)
  }, [chase.phase, chase.outcome, onResolved])

  const advance = () => {
    const ok = roll('Agility', agilityDifficulty(chase)).success
    setChase((s) => stepChase(s.ascii ? fleshWalls(s) : s, ok))
  }

  const pickTool = (tool: CatchTool) => {
    setChase((s) => chooseTool(s, tool, paperAllowsDead))
  }

  const pickShot = (shot: CalledShot) => {
    const stat: StatName = shot === 'hand' ? 'Expertise' : shot === 'knee' ? 'Agility' : 'Expertise'
    const ok = roll(stat, gunShotDifficulty(chase, shot)).success
    setChase((s) => calledShot(s, shot, ok, paperAllowsDead))
  }

  const leaveStreet = () => {
    if (chase.phase === 'resolved' && chase.outcome) {
      if (!resolvedOnce.current) {
        resolvedOnce.current = true
        onResolved(chase.outcome)
      }
      return
    }
    onStreet()
  }

  const depth = (chase.distance / 5) * 55 + 12

  return (
    <div className="west-face-shell min-h-screen" data-testid="bounty-chase">
      <header className="px-4 py-3 border-b border-[var(--west-line)] flex items-start justify-between gap-3">
        <div>
          <p className="west-face-eyebrow">Level 3 · the alley</p>
          <h1 className="west-face-title text-3xl">{look.title}</h1>
          <p className="west-face-body mt-1 max-w-xl">{look.wall} After {alias}.</p>
          <p className="west-face-eyebrow mt-1" data-testid="alley-paper">
            Pocket paper · {paperAllowsDead ? 'dead or alive' : 'alive'}
            {wet ? (dryFlask ? ' · flask kept dry' : ' · keep the powder dry') : ''}
          </p>
        </div>
        <button
          type="button"
          data-testid="alley-street"
          className="west-face-pill shrink-0"
          onClick={leaveStreet}
        >
          Street
        </button>
      </header>

      <div className="relative mx-auto mt-4 h-[42vh] max-w-3xl overflow-hidden border border-[var(--west-line)] bg-[#120e0a]">
        <div
          className="absolute inset-0"
          style={{
            background: chase.ascii
              ? '#0a0806'
              : chase.place === 'hole_drift'
                ? 'linear-gradient(#1a1610, #3d2818)'
                : chase.place === 'barrel_lane'
                  ? 'linear-gradient(#2a1a10, #5a3a1a)'
                  : 'linear-gradient(#24180c, #6a4a22)',
          }}
        />
        {!chase.ascii && (
          <>
            <div
              className="absolute top-0 bottom-0 left-0 origin-left"
              style={{
                width: '42%',
                transform: `perspective(420px) rotateY(38deg) translateZ(${-depth}px)`,
                backgroundImage: wallBoards(chase.place),
              }}
            />
            <div
              className="absolute top-0 bottom-0 right-0 origin-right"
              style={{
                width: '42%',
                transform: `perspective(420px) rotateY(-38deg) translateZ(${-depth}px)`,
                backgroundImage: wallBoards(chase.place),
              }}
            />
          </>
        )}
        {chase.wet && (
          <div className="pointer-events-none absolute inset-0 bg-slate-900/25" data-testid="alley-wet" />
        )}
        {chase.ascii && (
          <pre className="absolute inset-0 flex items-center justify-center font-mono text-[11px] leading-4 text-amber-100/80 whitespace-pre">
            {look.ascii}
          </pre>
        )}
        <div
          className="absolute left-1/2 -translate-x-1/2 text-5xl"
          style={{ bottom: `${8 + (5 - chase.distance) * 8}%` }}
          aria-hidden
        >
          🕯️
        </div>
        <p className="absolute bottom-2 left-0 right-0 text-center font-serif text-sm text-amber-100">
          {chase.distance} steps
        </p>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-3">
        <p className="west-face-body">{chase.log[chase.log.length - 1]}</p>

        {chase.phase === 'run' && (
          <button
            type="button"
            data-testid="alley-advance"
            className="west-face-pill west-face-pill-cream w-full justify-center min-h-11"
            onClick={advance}
          >
            Close the distance
          </button>
        )}

        {chase.phase === 'catch' && !chase.theyShot && (
          <p className="west-face-body" data-testid="powder-beat">
            He turns in the lane. Powder.
          </p>
        )}

        {chase.phase === 'catch' && chase.theyShot && (
          <div>
            <div className="h-2 mb-3 rounded bg-black/50 overflow-hidden">
              <div
                className="h-full bg-amber-400"
                style={{ width: `${(leftMs / catchMs) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                data-testid="catch-rope"
                disabled={!chase.tools.rope}
                className="west-face-pill west-face-pill-cream justify-center min-h-11 disabled:opacity-40"
                onClick={() => pickTool('rope')}
              >
                Rope
              </button>
              <button
                type="button"
                data-testid="catch-gun"
                disabled={!chase.tools.gun}
                className="west-face-pill justify-center min-h-11 disabled:opacity-40"
                onClick={() => pickTool('gun')}
              >
                Gun
              </button>
            </div>
          </div>
        )}

        {chase.phase === 'called' && (
          <div className="grid grid-cols-1 gap-2">
            <button type="button" data-testid="shot-hand" className="west-face-pill justify-center min-h-11" onClick={() => pickShot('hand')}>
              Hand — shoot the iron out
            </button>
            <button type="button" data-testid="shot-knee" className="west-face-pill justify-center min-h-11" onClick={() => pickShot('knee')}>
              Knee / ankle — complicate the run
            </button>
            {paperAllowsDead && (
              <button type="button" data-testid="shot-chest" className="west-face-pill justify-center min-h-11" onClick={() => pickShot('chest')}>
                Chest — the paper allows it
              </button>
            )}
          </div>
        )}

        {chase.phase === 'resolved' && chase.outcome && (
          <p className="west-face-body" data-testid="chase-outcome">
            {chase.outcome === 'alive' && 'Alive. The paper is satisfied.'}
            {chase.outcome === 'dead' && 'Dead. The purse is half, and heavy.'}
            {chase.outcome === 'escaped' && 'Gone. The trail is still hot.'}
          </p>
        )}
      </div>
    </div>
  )
}
