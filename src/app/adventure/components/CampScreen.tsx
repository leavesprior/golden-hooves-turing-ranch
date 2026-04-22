'use client'

/**
 * CampScreen — inline camp view rendered when phase === 'camp'.
 *
 * Wires the orphaned src/app/adventure/data/campActivities.ts logic into the
 * main content column so players aren't staring at a blank panel between
 * chapters. The CampManagement modal can still float over this when
 * showCamp === true; CampScreen exists so the underlying UI is never empty
 * and the player always has a "Leave Camp" escape hatch.
 *
 * Uses the unified pixel aesthetic (Press Start 2P, --pixel-* CSS vars).
 */

import React, { useCallback, useMemo, useState } from 'react'
import {
  CAMP_ACTIVITIES,
  CAMP_DAYS,
  canPerformActivity,
  type CampActivity,
  type ActivityResult,
} from '@/app/adventure/data/campActivities'
import type { StatName, SkillCheckResult } from '@/app/oregon-trail/characterContext'

interface CampScreenProps {
  chapter: number
  playerStats: Record<StatName, number>
  onSkillCheck: (stat: StatName, difficulty: number) => SkillCheckResult
  onApplyResult: (result: ActivityResult) => void
  onLeaveCamp: () => void
}

interface FloatingToast {
  id: number
  text: string
  tone: 'gain' | 'loss' | 'neutral'
}

interface LogEntry {
  day: number
  icon: string
  name: string
  success: boolean
  text: string
}

let toastIdCounter = 0

function summarizeResult(result: ActivityResult, success: boolean): string[] {
  const out: string[] = []
  if (result.xpGain) out.push(`+${result.xpGain} XP`)
  if (result.healthChange && result.healthChange > 0) out.push(`+${result.healthChange} Health`)
  if (result.healthChange && result.healthChange < 0) out.push(`${result.healthChange} Health`)
  if (result.karmaGain) out.push(`+${result.karmaGain} Karma`)
  if (result.statChange) out.push(`+${result.statChange.amount} ${result.statChange.stat}`)
  if (result.reputationChange) {
    const sign = result.reputationChange.amount >= 0 ? '+' : ''
    out.push(`${sign}${result.reputationChange.amount} ${result.reputationChange.faction}`)
  }
  if (result.revealLocations) out.push(`${result.revealLocations} location(s) revealed`)
  if (result.itemFound) out.push(`Found: ${result.itemFound}`)
  if (out.length === 0) out.push(success ? 'Success' : 'Partial')
  return out
}

export function CampScreen({
  chapter,
  playerStats,
  onSkillCheck,
  onApplyResult,
  onLeaveCamp,
}: CampScreenProps) {
  const [daysRemaining, setDaysRemaining] = useState(CAMP_DAYS)
  const [log, setLog] = useState<LogEntry[]>([])
  const [toasts, setToasts] = useState<FloatingToast[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const daysPassed = CAMP_DAYS - daysRemaining

  const pushToast = useCallback((text: string, tone: FloatingToast['tone']) => {
    toastIdCounter += 1
    const id = toastIdCounter
    setToasts(prev => [...prev, { id, text, tone }])
    // Auto-clear after the CSS fade-up finishes.
    window.setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 1800)
  }, [])

  const handleActivity = useCallback((activity: CampActivity) => {
    if (isProcessing) return
    const gate = canPerformActivity(activity, daysRemaining, playerStats)
    if (!gate.canDo) return

    setIsProcessing(true)
    window.setTimeout(() => {
      const check = onSkillCheck(activity.stat, activity.difficulty)
      const result = check.success ? activity.successResult : activity.failureResult

      onApplyResult(result)

      const summary = summarizeResult(result, check.success)
      summary.forEach((line, i) => {
        const tone: FloatingToast['tone'] =
          line.startsWith('-') ? 'loss' : line.startsWith('+') ? 'gain' : 'neutral'
        // Stagger so multiple outcomes don't stack on top of each other.
        window.setTimeout(() => pushToast(line, tone), i * 140)
      })

      setLog(prev => [
        ...prev,
        {
          day: daysPassed + 1,
          icon: activity.icon,
          name: activity.name,
          success: check.success,
          text: result.text,
        },
      ])
      setDaysRemaining(prev => Math.max(0, prev - activity.daysCost))
      setIsProcessing(false)
    }, 600)
  }, [isProcessing, daysRemaining, playerStats, onSkillCheck, onApplyResult, pushToast, daysPassed])

  const segments = useMemo(
    () => Array.from({ length: CAMP_DAYS }, (_, i) => i < daysPassed),
    [daysPassed]
  )

  return (
    <div className="relative">
      {/* Floating toasts — fade up and out. */}
      <div className="pointer-events-none absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
        {toasts.map(t => (
          <span
            key={t.id}
            className={`font-[var(--font-pixel)] text-[9px] px-2 py-1 border-2 camp-toast-rise ${
              t.tone === 'gain'
                ? 'bg-[var(--pixel-bg-dark)] border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)]'
                : t.tone === 'loss'
                ? 'bg-[var(--pixel-bg-dark)] border-[var(--pixel-fire-orange)] text-[var(--pixel-fire-orange)]'
                : 'bg-[var(--pixel-bg-dark)] border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)]'
            }`}
          >
            {t.text}
          </span>
        ))}
      </div>

      <style jsx>{`
        @keyframes camp-toast-rise {
          0% { opacity: 0; transform: translateY(8px); }
          15% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(-2px); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .camp-toast-rise {
          animation: camp-toast-rise 1.8s ease-out forwards;
        }
      `}</style>

      <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)]">
        {/* Header */}
        <div className="border-b-4 border-[var(--pixel-ui-border)] p-3 flex flex-wrap justify-between items-center gap-2">
          <div>
            <h2 className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)]">
              CAMP  — CHAPTER {chapter}
            </h2>
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-60 mt-1">
              Rest, train, and prepare. Unused days are lost.
            </p>
          </div>
          <div className="text-right">
            <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
              {daysRemaining} / {CAMP_DAYS} DAYS
            </p>
            <div className="flex gap-1 mt-1 justify-end">
              {segments.map((spent, i) => (
                <div
                  key={i}
                  className="w-3 h-2 border border-[var(--pixel-ui-border)]"
                  style={{
                    backgroundColor: spent
                      ? 'var(--pixel-gold-mid)'
                      : 'var(--pixel-bg-dark)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Activity grid */}
        {daysRemaining > 0 ? (
          <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CAMP_ACTIVITIES.map(activity => {
              const gate = canPerformActivity(activity, daysRemaining, playerStats)
              const disabled = !gate.canDo || isProcessing
              const outcomeHint = activity.successResult
              const hintBits: string[] = []
              if (outcomeHint.xpGain) hintBits.push(`+${outcomeHint.xpGain} XP`)
              if (outcomeHint.healthChange)
                hintBits.push(`${outcomeHint.healthChange > 0 ? '+' : ''}${outcomeHint.healthChange} HP`)
              if (outcomeHint.karmaGain) hintBits.push(`+${outcomeHint.karmaGain} Karma`)
              if (outcomeHint.revealLocations) hintBits.push('Reveals map')

              return (
                <button
                  key={activity.id}
                  onClick={() => handleActivity(activity)}
                  disabled={disabled}
                  className={`text-left p-2 border-2 transition-all ${
                    disabled
                      ? 'bg-[var(--pixel-bg-dark)] border-[var(--pixel-ui-border)] opacity-40 cursor-not-allowed'
                      : 'bg-[var(--pixel-bg-dark)] border-[var(--pixel-ui-border)] hover:border-[var(--pixel-gold-mid)] cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base" aria-hidden>{activity.icon}</span>
                    <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">
                      {activity.name}
                    </span>
                    <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-50 ml-auto">
                      {activity.daysCost}d
                    </span>
                  </div>
                  <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-60 mt-1 leading-relaxed">
                    {activity.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1 items-center">
                    <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-40">
                      {activity.stat} DC {activity.difficulty}
                    </span>
                    {hintBits.length > 0 && (
                      <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-gold-light)] opacity-80">
                        {hintBits.join(' / ')}
                      </span>
                    )}
                    {!gate.canDo && gate.reason && (
                      <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-fire-orange)] ml-auto">
                        {gate.reason}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] mb-2">
              CAMP COMPLETE
            </p>
            <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-70">
              {CAMP_DAYS} days have passed. Strike the tents and move on.
            </p>
          </div>
        )}

        {/* Activity log */}
        {log.length > 0 && (
          <div className="border-t-2 border-[var(--pixel-ui-border)] p-3">
            <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-60 mb-2">
              CAMP LOG
            </p>
            <div className="space-y-1 max-h-[110px] overflow-y-auto pr-1">
              {log.map((entry, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-40 pt-0.5">
                    D{entry.day}
                  </span>
                  <span className="text-xs" aria-hidden>{entry.icon}</span>
                  <div className="flex-1">
                    <span className={`font-[var(--font-pixel)] text-[8px] ${
                      entry.success ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-orange)]'
                    }`}>
                      {entry.name}  — {entry.success ? 'Success' : 'Partial'}
                    </span>
                    <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-60 mt-0.5 leading-relaxed">
                      {entry.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leave camp */}
        <div className="border-t-2 border-[var(--pixel-ui-border)] p-3">
          <button
            onClick={onLeaveCamp}
            className={`w-full py-2 font-[var(--font-pixel)] text-[10px] border-2 transition-all ${
              daysRemaining === 0
                ? 'bg-[var(--pixel-gold-dark)] border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)] hover:bg-[var(--pixel-gold-mid)]'
                : 'bg-[var(--pixel-bg-dark)] border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] hover:border-[var(--pixel-gold-mid)]'
            }`}
          >
            {daysRemaining === 0
              ? `BREAK CAMP  — CONTINUE TO CHAPTER ${chapter + 1} ▶`
              : `LEAVE CAMP (${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} unused) ▶`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CampScreen
