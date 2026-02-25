'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { StatName } from '@/app/oregon-trail/characterContext'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DialogueNode {
  id: string
  text: string
  speaker?: string
  options: DialogueOption[]
}

export interface DialogueOption {
  text: string
  nextNodeId?: string
  requirement?: { stat: StatName; dc: number }
  effects?: {
    karma?: { lawful?: number; good?: number }
    xp?: number
    reputation?: { faction: string; amount: number }
    gold?: number
    questStart?: string
    questAdvance?: string
    setFlag?: string
  }
  failNodeId?: string
  lockedText?: string
  // Low-stat variant text — shown when player's Shrewdness is <= 3
  // Inspired by Fallout's low-INT dialogue: funnier, blunter, but still functional
  lowShrewdnessText?: string
}

interface DialogueViewProps {
  npcName: string
  npcIcon: string
  npcRole: string
  nodes: DialogueNode[]
  startNodeId?: string
  playerStats: Record<StatName, number>
  onClose: () => void
  onEffect: (effects: DialogueOption['effects']) => void
  onSkillCheck: (stat: StatName, dc: number) => { success: boolean; roll: number; modifier: number; total: number }
  onGameStateChanged?: () => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'bobr_npc_conversations'

const KARMA_TAG_COLORS: Record<string, string> = {
  LAWFUL: 'text-blue-400 border-blue-600',
  CHAOTIC: 'text-purple-400 border-purple-600',
  GOOD: 'text-[var(--pixel-forest-light)] border-green-700',
  EVIL: 'text-[var(--pixel-fire-red)] border-red-700',
}

const TYPEWRITER_SPEED = 28 // ms per character

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadConversationHistory(): Record<string, string[]> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveConversationHistory(history: Record<string, string[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch { /* quota exceeded — silently ignore */ }
}

function getKarmaTags(effects: DialogueOption['effects']): string[] {
  if (!effects?.karma) return []
  const tags: string[] = []
  const { lawful, good } = effects.karma
  if (lawful !== undefined) {
    tags.push(lawful > 0 ? 'LAWFUL' : 'CHAOTIC')
  }
  if (good !== undefined) {
    tags.push(good > 0 ? 'GOOD' : 'EVIL')
  }
  return tags
}

// ---------------------------------------------------------------------------
// D20 Roll Animation Component
// ---------------------------------------------------------------------------

interface DiceRollDisplayProps {
  finalRoll: number
  modifier: number
  total: number
  dc: number
  stat: StatName
  success: boolean
  onDone: () => void
}

function DiceRollDisplay({ finalRoll, modifier, total, dc, stat, success, onDone }: DiceRollDisplayProps) {
  const [displayNumber, setDisplayNumber] = useState(1)
  const [phase, setPhase] = useState<'rolling' | 'landed' | 'result'>('rolling')
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Phase 1: rapid random numbers
    let ticks = 0
    const maxTicks = 14
    tickRef.current = setInterval(() => {
      ticks++
      setDisplayNumber(Math.floor(Math.random() * 20) + 1)
      if (ticks >= maxTicks) {
        if (tickRef.current) clearInterval(tickRef.current)
        setDisplayNumber(finalRoll)
        setPhase('landed')
      }
    }, 60)

    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [finalRoll])

  useEffect(() => {
    if (phase === 'landed') {
      const t = setTimeout(() => setPhase('result'), 600)
      return () => clearTimeout(t)
    }
    if (phase === 'result') {
      const t = setTimeout(onDone, 1800)
      return () => clearTimeout(t)
    }
  }, [phase, onDone])

  const isCrit = finalRoll === 20
  const isFumble = finalRoll === 1

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {/* Die face */}
      <div
        className={`
          w-16 h-16 flex items-center justify-center border-4
          font-[var(--font-pixel)] text-[24px] transition-all duration-200
          ${phase === 'rolling'
            ? 'border-[var(--pixel-ui-border)] bg-[var(--pixel-bg-dark)] text-[var(--pixel-ui-text)] animate-pulse'
            : isCrit
              ? 'border-[var(--pixel-gold-mid)] bg-[var(--pixel-gold-dark)] text-[var(--pixel-gold-light)] scale-110'
              : isFumble
                ? 'border-[var(--pixel-fire-red)] bg-red-950 text-[var(--pixel-fire-red)] scale-110'
                : success
                  ? 'border-[var(--pixel-forest-light)] bg-green-950 text-[var(--pixel-forest-light)]'
                  : 'border-[var(--pixel-fire-red)] bg-red-950 text-[var(--pixel-fire-red)]'
          }
        `}
        style={{ transform: phase === 'rolling' ? `rotate(${displayNumber * 18}deg)` : 'rotate(0deg)' }}
      >
        {displayNumber}
      </div>

      {/* Label */}
      <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-60">
        {phase === 'rolling' ? 'Rolling D20...' : `D20 ${'\u2192'} ${finalRoll}`}
      </p>

      {/* Breakdown — after landing */}
      {phase !== 'rolling' && (
        <div className="flex flex-col items-center gap-1 animate-[fadeIn_300ms_ease-out]">
          <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">
            <span className="text-[var(--pixel-gold-light)]">{finalRoll}</span>
            {' + '}
            <span className="text-[var(--pixel-gold-light)]">{modifier}</span>
            <span className="opacity-50"> ({stat})</span>
            {' = '}
            <span className={success ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-red)]'}>
              {total}
            </span>
            {' vs DC '}
            <span className="text-[var(--pixel-gold-light)]">{dc}</span>
          </p>
        </div>
      )}

      {/* Result label */}
      {phase === 'result' && (
        <p className={`font-[var(--font-pixel)] text-[14px] animate-[fadeIn_200ms_ease-out] ${
          isCrit ? 'text-[var(--pixel-gold-light)]' :
          success ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-red)]'
        }`}>
          {isCrit ? 'CRITICAL SUCCESS!' : isFumble ? 'CRITICAL FAILURE!' : success ? 'SUCCESS!' : 'FAILED!'}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Effects Toast
// ---------------------------------------------------------------------------

interface EffectsToastProps {
  effects: DialogueOption['effects']
}

function EffectsToast({ effects }: EffectsToastProps) {
  if (!effects) return null
  const lines: { text: string; color: string }[] = []

  if (effects.xp) {
    lines.push({ text: `+${effects.xp} XP`, color: 'text-[var(--pixel-gold-light)]' })
  }
  if (effects.gold) {
    lines.push({
      text: effects.gold > 0 ? `+${effects.gold} Gold` : `${effects.gold} Gold`,
      color: effects.gold > 0 ? 'text-[var(--pixel-gold-light)]' : 'text-[var(--pixel-fire-red)]',
    })
  }
  if (effects.karma) {
    if (effects.karma.lawful) {
      const val = effects.karma.lawful
      lines.push({
        text: val > 0 ? `+${val} Lawful` : `${val} Lawful`,
        color: val > 0 ? 'text-blue-400' : 'text-purple-400',
      })
    }
    if (effects.karma.good) {
      const val = effects.karma.good
      lines.push({
        text: val > 0 ? `+${val} Good` : `${val} Good`,
        color: val > 0 ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-red)]',
      })
    }
  }
  if (effects.reputation) {
    const r = effects.reputation
    lines.push({
      text: `${r.amount > 0 ? '+' : ''}${r.amount} ${r.faction} rep`,
      color: r.amount > 0 ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-red)]',
    })
  }
  if (effects.questStart) {
    lines.push({ text: `Quest started: ${effects.questStart}`, color: 'text-[var(--pixel-gold-light)]' })
  }
  if (effects.questAdvance) {
    lines.push({ text: `Quest advanced: ${effects.questAdvance}`, color: 'text-[var(--pixel-gold-light)]' })
  }

  if (lines.length === 0) return null

  return (
    <div className="mt-2 p-2 bg-black/50 border border-[var(--pixel-ui-border)] animate-[fadeIn_300ms_ease-out]">
      {lines.map((line, i) => (
        <p key={i} className={`font-[var(--font-pixel)] text-[9px] ${line.color}`}>
          {line.text}
        </p>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Typewriter Hook
// ---------------------------------------------------------------------------

function useTypewriter(text: string, speed: number = TYPEWRITER_SPEED) {
  const [displayed, setDisplayed] = useState('')
  const [isDone, setIsDone] = useState(false)
  const indexRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Reset on new text
    setDisplayed('')
    setIsDone(false)
    indexRef.current = 0

    if (!text) {
      setIsDone(true)
      return
    }

    timerRef.current = setInterval(() => {
      indexRef.current++
      if (indexRef.current >= text.length) {
        setDisplayed(text)
        setIsDone(true)
        if (timerRef.current) clearInterval(timerRef.current)
      } else {
        setDisplayed(text.slice(0, indexRef.current))
      }
    }, speed)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [text, speed])

  const skip = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setDisplayed(text)
    setIsDone(true)
  }, [text])

  return { displayed, isDone, skip }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DialogueView({
  npcName,
  npcIcon,
  npcRole,
  nodes,
  startNodeId,
  playerStats,
  onClose,
  onEffect,
  onSkillCheck,
  onGameStateChanged,
}: DialogueViewProps) {
  // Resolve the starting node
  const getNode = useCallback((id: string): DialogueNode | undefined => {
    return nodes.find(n => n.id === id)
  }, [nodes])

  const firstNodeId = startNodeId ?? nodes[0]?.id ?? ''
  const [currentNodeId, setCurrentNodeId] = useState(firstNodeId)
  const [rollState, setRollState] = useState<{
    rolling: boolean
    result: { success: boolean; roll: number; modifier: number; total: number } | null
    option: DialogueOption | null
  }>({ rolling: false, result: null, option: null })
  const [pendingEffects, setPendingEffects] = useState<DialogueOption['effects'] | null>(null)
  const [visitedNodeIds, setVisitedNodeIds] = useState<Set<string>>(() => new Set([firstNodeId]))

  // Persist conversation history
  useEffect(() => {
    const history = loadConversationHistory()
    const visited = history[npcName] ?? []
    const merged = new Set([...visited, ...visitedNodeIds])
    history[npcName] = Array.from(merged)
    saveConversationHistory(history)
  }, [visitedNodeIds, npcName])

  // Load previous conversation nodes on mount
  useEffect(() => {
    const history = loadConversationHistory()
    const prev = history[npcName]
    if (prev && prev.length > 0) {
      setVisitedNodeIds(s => {
        const next = new Set(s)
        prev.forEach(id => next.add(id))
        return next
      })
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentNode = getNode(currentNodeId)
  const speaker = currentNode?.speaker ?? npcName

  // Typewriter for current dialogue text
  const { displayed: typewriterText, isDone: typewriterDone, skip: skipTypewriter } = useTypewriter(
    currentNode?.text ?? ''
  )

  // Navigate to a node
  const goToNode = useCallback((nodeId: string) => {
    setRollState({ rolling: false, result: null, option: null })
    setPendingEffects(null)
    setCurrentNodeId(nodeId)
    setVisitedNodeIds(prev => new Set(prev).add(nodeId))
  }, [])

  // Choose an option
  const handleOption = useCallback((option: DialogueOption) => {
    // Apply effects
    if (option.effects) {
      onEffect(option.effects)
      setPendingEffects(option.effects)
      onGameStateChanged?.()
    }

    // If stat-gated, perform the skill check
    if (option.requirement) {
      const { stat, dc } = option.requirement
      const result = onSkillCheck(stat, dc)
      setRollState({ rolling: true, result, option })
      return
    }

    // Simple navigation
    if (option.nextNodeId) {
      goToNode(option.nextNodeId)
    } else {
      // End of dialogue
      onClose()
    }
  }, [onEffect, onSkillCheck, goToNode, onClose])

  // After the dice animation resolves
  const handleRollDone = useCallback(() => {
    const { result, option } = rollState
    if (!result || !option) return

    if (result.success && option.nextNodeId) {
      goToNode(option.nextNodeId)
    } else if (!result.success && option.failNodeId) {
      goToNode(option.failNodeId)
    } else if (!result.success && option.nextNodeId) {
      // Fallback: if no failNode, still go to nextNode (the node text can handle it)
      goToNode(option.nextNodeId)
    } else {
      // Dead end — close
      onClose()
    }
  }, [rollState, goToNode, onClose])

  // Can the player attempt a stat-gated option? They can always *attempt* it
  // (the roll decides) but we gray it out if their stat is very low (below DC - 10)
  const canAttempt = (req: { stat: StatName; dc: number }) => {
    return playerStats[req.stat] !== undefined
  }

  const isLocked = (option: DialogueOption) => {
    if (!option.requirement) return false
    // Locked if stat + max roll (20) can't possibly reach DC
    // Using the same modifier formula as the game: modifier = stat value
    const statVal = playerStats[option.requirement.stat] ?? 0
    return (statVal + 20) < option.requirement.dc
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (!currentNode) {
    return (
      <div className="p-4 bg-[var(--pixel-bg-dark)] border-4 border-[var(--pixel-ui-border)]">
        <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-fire-red)]">
          Dialogue error: node not found.
        </p>
        <button
          onClick={onClose}
          className="mt-2 font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] underline"
        >
          Leave conversation
        </button>
      </div>
    )
  }

  return (
    <div className="bg-[var(--pixel-bg-dark)] border-4 border-[var(--pixel-ui-border)] overflow-hidden">
      {/* ---- NPC Header ---- */}
      <div className="flex items-center gap-3 p-3 bg-[var(--pixel-bg-mid)] border-b-2 border-[var(--pixel-ui-border)]">
        {/* Portrait area (emoji icon) */}
        <div className="w-12 h-12 flex items-center justify-center border-2 border-[var(--pixel-ui-border)] bg-[var(--pixel-bg-dark)] text-2xl shrink-0">
          {npcIcon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] truncate">
            {npcName}
          </h3>
          <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-60">
            {npcRole}
          </p>
        </div>
        <button
          onClick={onClose}
          className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-60 hover:opacity-100 hover:text-[var(--pixel-fire-red)] px-2 py-1 border border-[var(--pixel-ui-border)] hover:border-[var(--pixel-fire-red)] transition-all shrink-0"
        >
          {'\u2717'} LEAVE
        </button>
      </div>

      {/* ---- Dialogue Text ---- */}
      <div
        className="p-4 min-h-[80px] cursor-pointer"
        onClick={() => { if (!typewriterDone) skipTypewriter() }}
      >
        {/* Speaker label (if different from NPC name, e.g. narrator or another character) */}
        {speaker !== npcName && (
          <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)] opacity-70 mb-1">
            [{speaker}]
          </p>
        )}
        <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)] leading-relaxed whitespace-pre-wrap">
          {typewriterText}
          {!typewriterDone && (
            <span className="inline-block w-[6px] h-[11px] bg-[var(--pixel-ui-text)] ml-[2px] animate-[blink_530ms_step-end_infinite]" />
          )}
        </p>
        {!typewriterDone && (
          <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-30 mt-2">
            Click to skip
          </p>
        )}
      </div>

      {/* ---- Effects Toast ---- */}
      {pendingEffects && typewriterDone && !rollState.rolling && (
        <div className="px-4 pb-2">
          <EffectsToast effects={pendingEffects} />
        </div>
      )}

      {/* ---- Dice Roll Overlay ---- */}
      {rollState.rolling && rollState.result && rollState.option?.requirement && (
        <div className="px-4 pb-2 border-t border-[var(--pixel-ui-border)]/30">
          <DiceRollDisplay
            finalRoll={rollState.result.roll}
            modifier={rollState.result.modifier}
            total={rollState.result.total}
            dc={rollState.option.requirement.dc}
            stat={rollState.option.requirement.stat}
            success={rollState.result.success}
            onDone={handleRollDone}
          />
        </div>
      )}

      {/* ---- Response Options ---- */}
      {typewriterDone && !rollState.rolling && currentNode.options.length > 0 && (
        <div className="p-3 border-t-2 border-[var(--pixel-ui-border)] space-y-1">
          {currentNode.options.map((option, idx) => {
            const locked = isLocked(option)
            const karmaTags = getKarmaTags(option.effects)
            const hasReq = !!option.requirement
            // Low-Shrewdness dialogue variant (Fallout low-INT inspired)
            const isLowShrewdness = (playerStats.Shrewdness ?? 5) <= 3
            const displayText = locked && option.lockedText
              ? option.lockedText
              : (isLowShrewdness && option.lowShrewdnessText)
                ? option.lowShrewdnessText
                : option.text

            return (
              <button
                key={idx}
                onClick={() => {
                  if (locked) return
                  handleOption(option)
                }}
                disabled={locked}
                className={`w-full text-left p-2 border-2 transition-all group ${
                  locked
                    ? 'border-[var(--pixel-ui-border)] bg-[var(--pixel-bg-dark)] opacity-40 cursor-not-allowed'
                    : isLowShrewdness && option.lowShrewdnessText
                      ? 'border-[var(--pixel-ui-border)] bg-[var(--pixel-bg-mid)] hover:border-yellow-600 hover:bg-yellow-900/20'
                      : 'border-[var(--pixel-ui-border)] bg-[var(--pixel-bg-mid)] hover:border-[var(--pixel-gold-dark)] hover:bg-[var(--pixel-gold-dark)]/10'
                }`}
              >
                <div className="flex items-start gap-2">
                  {/* Option number */}
                  <span className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-gold-light)] opacity-60 shrink-0 mt-[1px]">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    {/* Option text — uses low-Shrewdness variant when applicable */}
                    <span className={`font-[var(--font-pixel)] text-[11px] ${
                      locked
                        ? 'text-[var(--pixel-ui-text)] opacity-60'
                        : isLowShrewdness && option.lowShrewdnessText
                          ? 'text-yellow-300 group-hover:text-yellow-200'
                          : 'text-[var(--pixel-ui-text)] group-hover:text-[var(--pixel-gold-light)]'
                    }`}>
                      {displayText}
                    </span>
                    {isLowShrewdness && option.lowShrewdnessText && !locked && (
                      <span className="font-[var(--font-pixel)] text-[7px] text-yellow-600 ml-1">[dim-witted]</span>
                    )}

                    {/* Tags row */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {/* Karma tags */}
                      {karmaTags.map(tag => (
                        <span
                          key={tag}
                          className={`font-[var(--font-pixel)] text-[8px] px-1 border ${KARMA_TAG_COLORS[tag] ?? 'text-[var(--pixel-ui-text)] border-[var(--pixel-ui-border)]'}`}
                        >
                          [{tag}]
                        </span>
                      ))}

                      {/* Stat requirement tag */}
                      {hasReq && option.requirement && (
                        <span className={`font-[var(--font-pixel)] text-[8px] px-1 border ${
                          locked
                            ? 'text-[var(--pixel-fire-red)] border-red-800'
                            : 'text-[var(--pixel-gold-light)] border-[var(--pixel-gold-dark)]'
                        }`}>
                          [{option.requirement.stat} DC{option.requirement.dc}]
                        </span>
                      )}

                      {/* Visited indicator */}
                      {option.nextNodeId && visitedNodeIds.has(option.nextNodeId) && (
                        <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-30 px-1">
                          (visited)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ---- End of Conversation (no options) ---- */}
      {typewriterDone && !rollState.rolling && currentNode.options.length === 0 && (
        <div className="p-3 border-t-2 border-[var(--pixel-ui-border)]">
          <button
            onClick={onClose}
            className="w-full p-2 border-2 border-[var(--pixel-ui-border)] bg-[var(--pixel-bg-mid)] hover:border-[var(--pixel-gold-dark)] transition-all"
          >
            <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)]">
              [End conversation]
            </span>
          </button>
        </div>
      )}

      {/* ---- Keyframe Styles (injected once) ---- */}
      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
