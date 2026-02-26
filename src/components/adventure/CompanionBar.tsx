'use client'

import React, { useState, useEffect, useRef } from 'react'
import { DOSMessage } from '@/components/ui/DOSMessage'
import { playSFX } from '@/app/oregon-trail/lib/audioManager'
import { getCompanionLine, type DialogueContext } from '@/app/adventure/data/companionDialogues'
import type { RecruitedAlly } from '@/app/adventure/data/enemyRecruitment'

interface CompanionBarProps {
  allies: RecruitedAlly[]
  context: DialogueContext
  onAllyClick?: (ally: RecruitedAlly) => void
}

export function CompanionBar({ allies, context, onAllyClick }: CompanionBarProps) {
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null)
  const [dialogue, setDialogue] = useState<string | null>(null)
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasSpokenRef = useRef(false)

  // Auto-dismiss timer
  useEffect(() => {
    if (!dialogue) return
    dismissTimerRef.current = setTimeout(() => {
      setDialogue(null)
      setActiveSpeaker(null)
    }, 4000)
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
    }
  }, [dialogue])

  // 20% chance on first render that a random ally speaks unprompted
  useEffect(() => {
    if (hasSpokenRef.current || allies.length === 0) return
    hasSpokenRef.current = true

    if (Math.random() < 0.2) {
      const randomAlly = allies[Math.floor(Math.random() * allies.length)]
      const line = getCompanionLine(randomAlly.enemyName, context)
      if (line) {
        // Small delay so the bar renders first
        const timer = setTimeout(() => {
          setActiveSpeaker(randomAlly.enemyName)
          setDialogue(line)
        }, 800)
        return () => clearTimeout(timer)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAllyClick = (ally: RecruitedAlly) => {
    // Clear any existing timer
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)

    const line = getCompanionLine(ally.enemyName, context)
    if (line) {
      setActiveSpeaker(ally.enemyName)
      setDialogue(line)
      playSFX('click')
    }

    onAllyClick?.(ally)
  }

  if (allies.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-stone-900/95 border-t border-amber-700 p-2 z-30">
      {/* Speech bubble */}
      {dialogue && activeSpeaker && (
        <div
          className="absolute bottom-full left-4 right-4 mb-2 cursor-pointer"
          onClick={() => {
            setDialogue(null)
            setActiveSpeaker(null)
            if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current)
          }}
        >
          <div className="bg-stone-900 border border-amber-600 rounded-lg p-3 max-w-md mx-auto relative">
            {/* Speaker name */}
            <p className="font-pixel text-[10px] text-amber-400/70 mb-1">
              {activeSpeaker}:
            </p>
            <DOSMessage text={dialogue} speed={20} sfxEvery={0} />
            {/* Speech bubble arrow */}
            <div className="absolute -bottom-2 left-8 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-amber-600" />
          </div>
        </div>
      )}

      {/* Ally portraits row */}
      <div className="flex items-center gap-2">
        <span className="font-pixel text-[8px] text-amber-400/40 uppercase tracking-wider mr-1">
          Party
        </span>
        {allies.map((ally) => {
          const isActive = activeSpeaker === ally.enemyName
          return (
            <button
              key={ally.enemyName}
              onClick={() => handleAllyClick(ally)}
              title={`${ally.enemyName} — ${ally.passiveEffect}`}
              className={`w-10 h-10 rounded-full bg-stone-800 border-2 flex items-center justify-center text-lg transition-all ${
                isActive
                  ? 'border-amber-400 ring-2 ring-amber-400 scale-110'
                  : 'border-amber-600 hover:ring-2 ring-amber-400 hover:scale-105'
              }`}
            >
              {ally.icon}
            </button>
          )
        })}

        {/* Compact info */}
        <div className="ml-auto flex items-center gap-2">
          <span className="font-pixel text-[8px] text-amber-400/40">
            {allies.length} companion{allies.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
