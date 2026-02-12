'use client'

import React, { useState, useCallback } from 'react'
import type { StatName } from '@/app/oregon-trail/characterContext'

export interface Combatant {
  name: string
  icon: string
  health: number
  maxHealth: number
  stats: Partial<Record<StatName, number>>
  loot?: { gold?: number; xp?: number; item?: string }
}

interface ConfrontationViewProps {
  enemy: Combatant
  playerName: string
  playerHealth: number
  playerMaxHealth: number
  playerStats: Record<StatName, number>
  onEnd: (result: ConfrontationResult) => void
  onSkillCheck: (stat: StatName, dc: number) => { success: boolean; roll: number; modifier: number; total: number }
}

export interface ConfrontationResult {
  outcome: 'victory' | 'defeat' | 'fled' | 'talked'
  playerHealthLost: number
  xpEarned: number
  goldEarned: number
  karmaEffect?: { lawful?: number; good?: number }
}

type Action = 'attack' | 'defend' | 'flee' | 'talk' | 'item'
type Phase = 'player_turn' | 'enemy_turn' | 'resolving' | 'ended'

interface TurnLog {
  text: string
  type: 'player' | 'enemy' | 'system' | 'success' | 'failure'
}

export function ConfrontationView({
  enemy,
  playerName,
  playerHealth: initialPlayerHealth,
  playerMaxHealth,
  playerStats,
  onEnd,
  onSkillCheck,
}: ConfrontationViewProps) {
  const [playerHP, setPlayerHP] = useState(initialPlayerHealth)
  const [enemyHP, setEnemyHP] = useState(enemy.health)
  const [phase, setPhase] = useState<Phase>('player_turn')
  const [isDefending, setIsDefending] = useState(false)
  const [log, setLog] = useState<TurnLog[]>([
    { text: `${enemy.icon} ${enemy.name} blocks your path!`, type: 'system' },
  ])
  const [totalDamage, setTotalDamage] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [talkAttempts, setTalkAttempts] = useState(0)

  const addLog = useCallback((entry: TurnLog) => {
    setLog(prev => [...prev, entry])
  }, [])

  const rollD20 = () => Math.floor(Math.random() * 20) + 1

  const getStatMod = (stat: StatName, stats: Partial<Record<StatName, number>>): number => {
    const val = stats[stat] ?? 10
    return Math.floor((val - 10) / 2)
  }

  const endConfrontation = useCallback((outcome: ConfrontationResult['outcome']) => {
    setPhase('ended')
    const gold = outcome === 'victory' ? (enemy.loot?.gold ?? 0) : 0
    const xp = outcome === 'victory' ? (enemy.loot?.xp ?? 20) + xpEarned
      : outcome === 'fled' ? Math.floor(xpEarned / 2)
      : outcome === 'talked' ? xpEarned + 15
      : 5 // defeat still gives a little xp

    const karma = outcome === 'talked'
      ? { lawful: 1, good: 1 }
      : outcome === 'victory'
      ? { lawful: 0, good: 0 }
      : undefined

    onEnd({
      outcome,
      playerHealthLost: totalDamage,
      xpEarned: xp,
      goldEarned: gold,
      karmaEffect: karma,
    })
  }, [enemy.loot, xpEarned, totalDamage, onEnd])

  const enemyTurn = useCallback(() => {
    setPhase('enemy_turn')

    setTimeout(() => {
      const roll = rollD20()
      const enemyMod = getStatMod('Agility', enemy.stats)
      const playerDefense = 10 + getStatMod('Agility', playerStats) + (isDefending ? 4 : 0)
      const attackTotal = roll + enemyMod

      if (attackTotal >= playerDefense) {
        // Enemy hits
        const baseDamage = Math.max(1, Math.floor(Math.random() * 6) + 1 + getStatMod('Durability', enemy.stats))
        const actualDamage = isDefending ? Math.max(1, Math.floor(baseDamage / 2)) : baseDamage

        setPlayerHP(prev => {
          const newHP = Math.max(0, prev - actualDamage)
          if (newHP <= 0) {
            addLog({ text: `${enemy.name} strikes a devastating blow! You fall...`, type: 'failure' })
            setTimeout(() => endConfrontation('defeat'), 1000)
          } else {
            addLog({
              text: `${enemy.name} ${isDefending ? 'breaks through your guard for' : 'hits you for'} ${actualDamage} damage! [${roll}+${enemyMod} vs AC ${playerDefense}]`,
              type: 'enemy',
            })
          }
          return newHP
        })
        setTotalDamage(prev => prev + actualDamage)
      } else {
        addLog({
          text: `${enemy.name} swings and misses! [${roll}+${enemyMod} vs AC ${playerDefense}]`,
          type: 'player',
        })
      }

      setIsDefending(false)
      setPhase('player_turn')
    }, 800)
  }, [enemy, playerStats, isDefending, addLog, endConfrontation])

  const handleAction = useCallback((action: Action) => {
    if (phase !== 'player_turn') return
    setPhase('resolving')

    switch (action) {
      case 'attack': {
        const roll = rollD20()
        const playerMod = getStatMod('Agility', playerStats)
        const enemyAC = 10 + getStatMod('Agility', enemy.stats)
        const attackTotal = roll + playerMod

        if (roll === 20 || attackTotal >= enemyAC) {
          const baseDamage = Math.floor(Math.random() * 8) + 1 + getStatMod('Durability', playerStats)
          const damage = roll === 20 ? baseDamage * 2 : Math.max(1, baseDamage)
          const crit = roll === 20 ? ' CRITICAL HIT!' : ''

          setEnemyHP(prev => {
            const newHP = Math.max(0, prev - damage)
            if (newHP <= 0) {
              addLog({ text: `You strike ${enemy.name} for ${damage} damage!${crit} They go down!`, type: 'success' })
              setXpEarned(prev => prev + 10)
              setTimeout(() => endConfrontation('victory'), 1000)
            } else {
              addLog({
                text: `You hit ${enemy.name} for ${damage} damage!${crit} [${roll}+${playerMod} vs AC ${enemyAC}]`,
                type: 'player',
              })
              setTimeout(() => enemyTurn(), 500)
            }
            return newHP
          })
          setXpEarned(prev => prev + 5)
        } else {
          addLog({
            text: `You swing and miss! [${roll}+${playerMod} vs AC ${enemyAC}]`,
            type: 'failure',
          })
          setTimeout(() => enemyTurn(), 500)
        }
        break
      }

      case 'defend': {
        setIsDefending(true)
        addLog({ text: 'You raise your guard. (+4 AC this round)', type: 'player' })
        setXpEarned(prev => prev + 2)
        setTimeout(() => enemyTurn(), 500)
        break
      }

      case 'flee': {
        const result = onSkillCheck('Agility', 10 + Math.floor(enemy.health / 20))
        if (result.success) {
          addLog({ text: `You break away and flee! [Agility: ${result.total} vs DC ${10 + Math.floor(enemy.health / 20)}]`, type: 'success' })
          setTimeout(() => endConfrontation('fled'), 800)
        } else {
          addLog({ text: `You can't get away! [Agility: ${result.total} vs DC ${10 + Math.floor(enemy.health / 20)}]`, type: 'failure' })
          setTimeout(() => enemyTurn(), 500)
        }
        break
      }

      case 'talk': {
        const dc = 12 + talkAttempts * 3 // Gets harder each try
        const result = onSkillCheck('Diplomacy', dc)
        setTalkAttempts(prev => prev + 1)

        if (result.success) {
          addLog({ text: `Your words reach ${enemy.name}. They lower their weapon. [Diplomacy: ${result.total} vs DC ${dc}]`, type: 'success' })
          setXpEarned(prev => prev + 10)
          setTimeout(() => endConfrontation('talked'), 800)
        } else {
          addLog({ text: `${enemy.name} isn't interested in talking. [Diplomacy: ${result.total} vs DC ${dc}]`, type: 'failure' })
          setTimeout(() => enemyTurn(), 500)
        }
        break
      }
    }
  }, [phase, playerStats, enemy, onSkillCheck, talkAttempts, addLog, enemyTurn, endConfrontation])

  const hpPercent = (hp: number, max: number) => Math.max(0, Math.round((hp / max) * 100))
  const hpColor = (percent: number) =>
    percent > 60 ? 'bg-green-600' : percent > 30 ? 'bg-yellow-600' : 'bg-red-600'

  return (
    <div className="bg-[var(--pixel-bg-dark)] border-4 border-[var(--pixel-fire-red)] min-h-[400px]">
      {/* Header */}
      <div className="p-3 bg-red-950/30 border-b-2 border-[var(--pixel-fire-red)]/50 text-center">
        <span className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-fire-red)] animate-pulse">
          CONFRONTATION
        </span>
      </div>

      {/* Combatant Status Bars */}
      <div className="p-3 grid grid-cols-2 gap-4">
        {/* Player */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-gold-light)]">
              {playerName}
            </span>
            <span className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
              {playerHP}/{playerMaxHealth}
            </span>
          </div>
          <div className="h-3 bg-[var(--pixel-bg-mid)] border border-[var(--pixel-ui-border)]">
            <div
              className={`h-full ${hpColor(hpPercent(playerHP, playerMaxHealth))} transition-all duration-300`}
              style={{ width: `${hpPercent(playerHP, playerMaxHealth)}%` }}
            />
          </div>
        </div>

        {/* Enemy */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-fire-red)]">
              {enemy.icon} {enemy.name}
            </span>
            <span className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)]">
              {enemyHP}/{enemy.maxHealth}
            </span>
          </div>
          <div className="h-3 bg-[var(--pixel-bg-mid)] border border-[var(--pixel-ui-border)]">
            <div
              className={`h-full ${hpColor(hpPercent(enemyHP, enemy.maxHealth))} transition-all duration-300`}
              style={{ width: `${hpPercent(enemyHP, enemy.maxHealth)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Combat Log */}
      <div className="mx-3 h-40 overflow-y-auto bg-black/40 border-2 border-[var(--pixel-ui-border)] p-2 space-y-1">
        {log.map((entry, i) => (
          <p
            key={i}
            className={`font-[var(--font-pixel)] text-[8px] ${
              entry.type === 'player' ? 'text-[var(--pixel-forest-light)]'
              : entry.type === 'enemy' ? 'text-[var(--pixel-fire-red)]'
              : entry.type === 'success' ? 'text-[var(--pixel-gold-light)]'
              : entry.type === 'failure' ? 'text-[var(--pixel-fire-orange)]'
              : 'text-[var(--pixel-ui-text)]'
            }`}
          >
            {entry.text}
          </p>
        ))}
      </div>

      {/* Actions */}
      {phase === 'player_turn' && (
        <div className="p-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => handleAction('attack')}
            className="p-2 bg-red-950/30 border-2 border-[var(--pixel-fire-red)] hover:bg-red-900/40 transition-all text-left"
          >
            <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-fire-red)]">
              {'\u2694\uFE0F'} ATTACK
            </span>
            <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-50">
              Agility vs AC
            </p>
          </button>

          <button
            onClick={() => handleAction('defend')}
            className="p-2 bg-blue-950/30 border-2 border-[var(--pixel-sky-light)] hover:bg-blue-900/40 transition-all text-left"
          >
            <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-sky-light)]">
              {'\uD83D\uDEE1\uFE0F'} DEFEND
            </span>
            <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-50">
              +4 AC this round
            </p>
          </button>

          <button
            onClick={() => handleAction('flee')}
            className="p-2 bg-yellow-950/30 border-2 border-[var(--pixel-gold-mid)] hover:bg-yellow-900/40 transition-all text-left"
          >
            <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-mid)]">
              {'\uD83C\uDFC3'} FLEE
            </span>
            <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-50">
              Agility check
            </p>
          </button>

          <button
            onClick={() => handleAction('talk')}
            className="p-2 bg-green-950/30 border-2 border-[var(--pixel-forest-light)] hover:bg-green-900/40 transition-all text-left"
          >
            <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-forest-light)]">
              {'\uD83D\uDDE3\uFE0F'} TALK
            </span>
            <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-50">
              Diplomacy DC {12 + talkAttempts * 3}
            </p>
          </button>
        </div>
      )}

      {/* Waiting indicator */}
      {(phase === 'enemy_turn' || phase === 'resolving') && (
        <div className="p-3 text-center">
          <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] animate-pulse">
            {phase === 'enemy_turn' ? `${enemy.name} acts...` : 'Resolving...'}
          </span>
        </div>
      )}

      {/* End state */}
      {phase === 'ended' && (
        <div className="p-3 text-center">
          <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
            Confrontation ended
          </span>
        </div>
      )}
    </div>
  )
}
