'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  CAMP_ACTIVITIES,
  CAMP_DAYS,
  canPerformActivity,
  getActivity,
  type CampActivity,
  type ActivityResult,
} from '@/app/adventure/data/campActivities'
import type { StatName, SkillCheckResult } from '@/app/oregon-trail/characterContext'

interface CampManagementProps {
  chapter: number
  playerStats: Record<StatName, number>
  onSkillCheck: (stat: StatName, difficulty: number) => SkillCheckResult
  onApplyResult: (result: ActivityResult) => void
  onComplete: () => void
}

interface DayLog {
  day: number
  activity: CampActivity
  result: ActivityResult
  success: boolean
}

export function CampManagement({
  chapter,
  playerStats,
  onSkillCheck,
  onApplyResult,
  onComplete,
}: CampManagementProps) {
  const [daysRemaining, setDaysRemaining] = useState(CAMP_DAYS)
  const [dayLog, setDayLog] = useState<DayLog[]>([])
  const [activeResult, setActiveResult] = useState<{ activity: CampActivity; result: ActivityResult; success: boolean } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const daysPassed = CAMP_DAYS - daysRemaining

  const handleActivity = useCallback((activity: CampActivity) => {
    if (isProcessing) return
    const check = canPerformActivity(activity, daysRemaining, playerStats)
    if (!check.canDo) return

    setIsProcessing(true)

    // Simulate activity with delay for feel
    setTimeout(() => {
      const skillResult = onSkillCheck(activity.stat, activity.difficulty)
      const result = skillResult.success ? activity.successResult : activity.failureResult

      // Apply results
      onApplyResult(result)

      const logEntry: DayLog = {
        day: daysPassed + 1,
        activity,
        result,
        success: skillResult.success,
      }

      setDayLog(prev => [...prev, logEntry])
      setDaysRemaining(prev => prev - activity.daysCost)
      setActiveResult({ activity, result, success: skillResult.success })
      setIsProcessing(false)
    }, 800)
  }, [daysRemaining, playerStats, daysPassed, isProcessing, onSkillCheck, onApplyResult])

  const dismissResult = useCallback(() => {
    setActiveResult(null)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--pixel-bg-dark)] border-4 border-[var(--pixel-gold-mid)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[var(--pixel-bg-mid)] border-b-4 border-[var(--pixel-ui-border)] p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-gold-light)]">
                CAMP BETWEEN CHAPTERS
              </h2>
              <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-60">
                Rest and prepare before Chapter {chapter + 1}
              </p>
            </div>
            <div className="text-right">
              <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)]">
                {daysRemaining} DAYS LEFT
              </p>
              {/* Day progress bar */}
              <div className="flex gap-1 mt-1">
                {Array.from({ length: CAMP_DAYS }).map((_, i) => (
                  <div
                    key={i}
                    className="w-4 h-2"
                    style={{
                      backgroundColor: i < daysPassed ? 'var(--pixel-gold-mid)' : 'var(--pixel-bg-dark)',
                      border: '1px solid var(--pixel-ui-border)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Active Result Overlay */}
        {activeResult && (
          <div className="p-4 border-b-2 border-[var(--pixel-ui-border)]">
            <div className={`p-3 border-2 ${
              activeResult.success
                ? 'bg-[var(--pixel-forest-dark)]/20 border-[var(--pixel-forest-mid)]'
                : 'bg-[var(--pixel-fire-red)]/10 border-[var(--pixel-fire-orange)]/50'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{activeResult.activity.icon}</span>
                <span className={`font-[var(--font-pixel)] text-[11px] ${
                  activeResult.success ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-orange)]'
                }`}>
                  {activeResult.success ? 'SUCCESS' : 'PARTIAL'}  — {activeResult.activity.name}
                </span>
              </div>
              <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)]">
                {activeResult.result.text}
              </p>
              {/* Result details */}
              <div className="flex flex-wrap gap-2 mt-2">
                {activeResult.result.xpGain && (
                  <span className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)]">
                    +{activeResult.result.xpGain} XP
                  </span>
                )}
                {activeResult.result.healthChange && (
                  <span className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-forest-light)]">
                    +{activeResult.result.healthChange} Health
                  </span>
                )}
                {activeResult.result.karmaGain && (
                  <span className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)]">
                    +{activeResult.result.karmaGain} Karma
                  </span>
                )}
                {activeResult.result.revealLocations && (
                  <span className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-earth-light)]">
                    {activeResult.result.revealLocations} location(s) revealed
                  </span>
                )}
              </div>
              <button
                onClick={dismissResult}
                className="mt-2 font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)]"
              >
                DISMISS
              </button>
            </div>
          </div>
        )}

        {/* Activities Grid */}
        {daysRemaining > 0 ? (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CAMP_ACTIVITIES.map(activity => {
              const check = canPerformActivity(activity, daysRemaining, playerStats)
              return (
                <button
                  key={activity.id}
                  onClick={() => check.canDo && !isProcessing && !activeResult && handleActivity(activity)}
                  disabled={!check.canDo || isProcessing || !!activeResult}
                  className={`text-left p-3 border-2 transition-all ${
                    check.canDo && !isProcessing && !activeResult
                      ? 'bg-[var(--pixel-bg-mid)] border-[var(--pixel-ui-border)] hover:border-[var(--pixel-gold-dark)] cursor-pointer'
                      : 'bg-[var(--pixel-bg-dark)] border-[var(--pixel-ui-border)] opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{activity.icon}</span>
                    <div>
                      <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">
                        {activity.name}
                      </span>
                      <span className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-50 ml-2">
                        ({activity.daysCost} day{activity.daysCost > 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                  <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-60">
                    {activity.description}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-40">
                      {activity.stat} DC {activity.difficulty}
                    </span>
                    {!check.canDo && check.reason && (
                      <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-fire-orange)]">
                        {check.reason}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          /* Camp Complete */
          <div className="p-6 text-center">
            <h3 className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)] mb-4">
              CAMP COMPLETE
            </h3>
            <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] mb-4">
              {CAMP_DAYS} days have passed. Time to move on.
            </p>
          </div>
        )}

        {/* Activity Log */}
        {dayLog.length > 0 && (
          <div className="p-4 border-t-2 border-[var(--pixel-ui-border)]">
            <h4 className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] mb-2 opacity-60">
              CAMP LOG
            </h4>
            <div className="space-y-1 max-h-[120px] overflow-y-auto">
              {dayLog.map((entry, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-40">
                    Day {entry.day}:
                  </span>
                  <span className="text-xs">{entry.activity.icon}</span>
                  <span className={`font-[var(--font-pixel)] text-[8px] ${
                    entry.success ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-orange)]'
                  }`}>
                    {entry.activity.name} — {entry.success ? 'Success' : 'Partial'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div className="p-4 border-t-2 border-[var(--pixel-ui-border)]">
          <button
            onClick={onComplete}
            className={`w-full py-3 font-[var(--font-pixel)] text-[11px] border-2 transition-all ${
              daysRemaining === 0
                ? 'bg-[var(--pixel-gold-dark)] border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)] hover:bg-[var(--pixel-gold-mid)]'
                : 'bg-[var(--pixel-bg-mid)] border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] hover:border-[var(--pixel-gold-dark)]'
            }`}
          >
            {daysRemaining === 0
              ? 'CONTINUE TO CHAPTER ' + (chapter + 1) + ' \u25B6'
              : 'SKIP REMAINING DAYS \u25B6'
            }
          </button>
          {daysRemaining > 0 && (
            <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] text-center mt-1 opacity-40">
              You have {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining. Unused days are lost.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
