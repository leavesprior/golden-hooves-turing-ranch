'use client'

import { useEffect, useRef, useState } from 'react'
import { FROG_SWEET_MAX, FROG_SWEET_MIN, frogJumpOutcome, frogPowerAt, type FrogJumpOutcome } from '@/lib/frogJump'

/**
 * One-button frog jump for the Angels Camp wager (2026-09-23). Press once when the
 * needle sits in the gold band. Enter/Space work because it is a real <button>.
 */
export default function FrogJumpMicrogame({ onDone }: { onDone: (outcome: FrogJumpOutcome) => void }) {
  const [power, setPower] = useState(0)
  const [result, setResult] = useState<FrogJumpOutcome | null>(null)
  const startRef = useRef<number>(0)
  const frameRef = useRef<number>(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const backRef = useRef<HTMLButtonElement>(null)
  const finishingRef = useRef(false)
  const [finishing, setFinishing] = useState(false)

  useEffect(() => {
    // The quest view it replaces is often scrolled down; start the game at the top.
    window.scrollTo(0, 0)
    startRef.current = performance.now()
    buttonRef.current?.focus({ preventScroll: true })
    const tick = () => {
      setPower(frogPowerAt(performance.now() - startRef.current))
      frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [])

  const jump = () => {
    if (result) return
    cancelAnimationFrame(frameRef.current)
    const p = frogPowerAt(performance.now() - startRef.current)
    setPower(p)
    setResult(frogJumpOutcome(p))
  }

  useEffect(() => {
    if (result) backRef.current?.focus()
  }, [result])

  const finish = () => {
    if (!result || finishingRef.current) return // one payout per jump, however fast the clicks
    finishingRef.current = true
    setFinishing(true)
    onDone(result)
  }

  return (
    <div className="west-face-shell min-h-screen">
      <div className="max-w-2xl mx-auto p-4 pt-8">
        <div className="west-face-paper" data-testid="frog-jump">
          <p className="west-face-eyebrow mb-2">🐸 The frog jump · Angell’s canvas bar</p>
          <h2 className="west-face-title text-2xl mb-2">Fair and square</h2>
          <p className="west-face-body mb-4">
            Chalk line on the plank floor. Press once when the needle is in the gold band — push too hard and the frog flops.
          </p>

          <div className="relative h-6 rounded-sm border border-[var(--west-line)] bg-black/60 mb-2" aria-hidden="true">
            <div
              className="absolute inset-y-0 bg-amber-400/40"
              style={{ left: `${FROG_SWEET_MIN}%`, width: `${FROG_SWEET_MAX - FROG_SWEET_MIN}%` }}
            />
            <div className="absolute inset-y-0 w-1 bg-[#e8dcc4]" style={{ left: `calc(${power}% - 2px)` }} />
          </div>
          <p className="west-face-body text-xs mb-4" aria-live="polite">Power {power}</p>

          {!result ? (
            <button
              ref={buttonRef}
              type="button"
              onClick={jump}
              className="west-face-pill west-face-pill-cream w-full justify-center"
              data-testid="frog-jump-press"
            >
              Jump!
            </button>
          ) : (
            <>
              <p className="west-face-body mb-4" data-testid="frog-jump-result">{result.line}</p>
              <button
                ref={backRef}
                type="button"
                onClick={finish}
                disabled={finishing}
                className="west-face-pill west-face-pill-cream w-full justify-center"
                data-testid="frog-jump-back"
              >
                Back to the bar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
