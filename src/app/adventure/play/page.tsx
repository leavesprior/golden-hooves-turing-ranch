'use client'

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PixelNavigation, PixelButton, PixelCard } from '@/components/pixel'
import { trackPageView, trackGameStart } from '@/lib/eventTracker'

// Oregon Trail Contexts — the deep systems
import { CharacterProvider, useCharacter, type StatName, type SaddleStats } from '@/app/oregon-trail/characterContext'
import { KarmaWalletProvider, useKarmaWallet } from '@/app/oregon-trail/karmaWalletContext'
import { ReputationProvider, useReputation, type FactionId } from '@/app/oregon-trail/reputationContext'
import { NarratorProvider, useNarrator } from '@/app/oregon-trail/narratorContext'
import { NPCProvider } from '@/app/oregon-trail/npcContext'
import { MysteryProvider, useMystery } from '@/app/oregon-trail/mysteryContext'
import { CrossGameStorage, qualitiesFromSaddle } from '@/lib/crossGameProgression'
import { saveToCloud, loadFromCloud, hasCloudSave, cachePassphrase, getCachedPassphrase, getDeviceId } from '@/lib/cloudSave'
import { getPlayerIdentifier } from '@/lib/trophyStateCollector'

// Adventure Components
import { ChapterMap } from '@/components/adventure/ChapterMap'
import { LocationView } from '@/components/adventure/LocationView'
import { CampManagement } from '@/components/adventure/CampManagement'
import { SkillTree } from '@/components/adventure/SkillTree'
import AdventureRewardTracker from '@/components/adventure/AdventureRewardTracker'
import { ClueGameUnlock } from '@/components/adventure/ClueGameUnlock'

// Lazy-load PixiJS exploration map (SSR-safe)
import dynamic from 'next/dynamic'
const ExplorationMap = dynamic(
  () => import('@/components/adventure/ExplorationMap').then(mod => mod.ExplorationMap),
  { ssr: false, loading: () => <div className="h-[500px] bg-[#1a1a0e] border-2 border-amber-700 rounded flex items-center justify-center font-[var(--font-pixel)] text-amber-600 text-[10px]">Loading exploration map...</div> }
)
const ExplorationMapCanvas = dynamic(
  () => import('@/components/adventure/ExplorationMapCanvas').then(mod => mod.ExplorationMapCanvas),
  { ssr: false }
)

// Adventure Data
import {
  getChapterLocations,
  getLocationById as getChapterLocation,
  getDefaultLocation,
  rollTravelEncounter,
  type ChapterLocation,
  type LocationNPC,
  type TravelEncounter,
} from '@/app/adventure/data/chapterLocations'
import { getSkillTreeBonuses } from '@/app/adventure/data/skillTree'
import type { ActivityResult } from '@/app/adventure/data/campActivities'
import { rollConfrontation, type ConfrontationEnemy } from '@/app/adventure/data/confrontationEnemies'
import { getPickById } from '@/app/adventure/data/advantages'
import { ConfrontationView, type ConfrontationResult } from '@/components/adventure/ConfrontationView'
import { type RecruitedAlly, updateAllyDurations, getAllyStatBonuses, rollAllyAbility } from '@/app/adventure/data/enemyRecruitment'
import { CompanionBar } from '@/components/adventure/CompanionBar'
import type { DialogueContext } from '@/app/adventure/data/companionDialogues'

// Authored NPC dialogue trees + quest data (previously orphaned — wired 2026-06-11)
import { DialogueView } from '@/components/adventure/DialogueView'
import { QuestLog, type QuestLogEntry, type QuestStatus } from '@/components/adventure/QuestLog'
import { getDialoguesForNpc, type Dialogue, type DialogueEffect } from '@/app/adventure/data/dialogues'
import { QUESTS, type Quest, type QuestPath } from '@/app/adventure/data/quests'

// ============================================
// ADVENTURE STATE
// ============================================

type AdventurePhase = 'loading' | 'exploring' | 'at_location' | 'traveling' | 'camp' | 'chapter_complete'

// Per-quest progress, persisted inside AdventureState. Objectives complete via
// cheap hooks into existing handlers (talk / travel / clue answered / dialogue
// questProgress effects); a quest completes when every non-optional objective
// of one of its paths is done.
interface QuestSaveState {
  status: 'active' | 'completed'
  completedObjectives: string[]
  completedPathId?: string
}

interface AdventureState {
  chapter: number
  currentLocationId: string
  discoveredLocationIds: string[]
  visitedLocationIds: string[]
  phase: AdventurePhase
  unlockedSkillNodes: string[]
  skillPoints: number
  totalXP: number
  playStartTime: number  // Timestamp when play started (ms)
  cluesAnswered: number  // Discovery clues answered correctly
  welcomeRewardClaimed: boolean
  confrontationsWon: number
  confrontationsLost: number
  recruitedAllies: RecruitedAlly[]
  startingAbilitiesApplied?: boolean  // one-time guard for pick-based starting effects
  // Dialogue/quest progression (added with the dialogue+quest wiring)
  dialogueFlags: string[]
  questStates: Record<string, QuestSaveState>
}

const SAVE_KEY = 'bobr_adventure_state'

function loadAdventureState(): AdventureState | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(SAVE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    // Migrate older saves missing new fields
    return {
      ...parsed,
      // Reset playStartTime on each load so the Reward Tracker measures THIS
      // session's active time, not total elapsed real-time across days/weeks.
      playStartTime: Date.now(),
      cluesAnswered: parsed.cluesAnswered ?? 0,
      welcomeRewardClaimed: parsed.welcomeRewardClaimed ?? false,
      confrontationsWon: parsed.confrontationsWon ?? 0,
      confrontationsLost: parsed.confrontationsLost ?? 0,
      recruitedAllies: parsed.recruitedAllies ?? [],
      dialogueFlags: parsed.dialogueFlags ?? [],
      questStates: parsed.questStates ?? {},
    }
  } catch {
    return null
  }
}

function saveAdventureState(state: AdventureState): boolean {
  if (typeof window === 'undefined') return false
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
    return true
  } catch (e) {
    // Swallow — never let a save failure abort a React state update (would
    // freeze the UI), and never let it bubble out of handleSave (would skip
    // the user-facing toast). Log so the failure isn't silent in devtools.
    console.error('[adventure] saveAdventureState failed:', e)
    return false
  }
}

function createNewAdventureState(): AdventureState {
  const defaultLoc = getDefaultLocation(1)
  const chapterLocs = getChapterLocations(1)
  const defaultDiscovered = chapterLocs.filter(l => l.discoveredByDefault).map(l => l.id)
  // Also discover connectedTo neighbors of default locations (fog-of-war fix)
  const neighborIds = new Set(defaultDiscovered)
  for (const locId of defaultDiscovered) {
    const loc = chapterLocs.find(l => l.id === locId)
    if (loc) loc.connectedTo.forEach(id => neighborIds.add(id))
  }
  const discovered = Array.from(neighborIds)

  return {
    chapter: 1,
    currentLocationId: defaultLoc?.id ?? 'ch1_independence',
    discoveredLocationIds: discovered,
    visitedLocationIds: [defaultLoc?.id ?? 'ch1_independence'],
    phase: 'exploring',
    unlockedSkillNodes: [],
    skillPoints: 0,
    totalXP: 0,
    playStartTime: Date.now(),
    cluesAnswered: 0,
    welcomeRewardClaimed: false,
    confrontationsWon: 0,
    confrontationsLost: 0,
    recruitedAllies: [],
    dialogueFlags: [],
    questStates: {},
  }
}

// ============================================
// QUEST ENGINE (pure helpers — no side effects)
// ============================================

type QuestEvent = { kind: 'talk' | 'travel' | 'clue'; target: string }

interface QuestUpdateResult {
  next: Record<string, QuestSaveState>
  completed: { quest: Quest; path: QuestPath }[]
  progressed: boolean
}

/** Check whether a path is fully complete (all non-optional objectives done). */
function isPathComplete(path: QuestPath, completedIds: Set<string>): boolean {
  return path.objectives.filter(o => !o.optional).every(o => completedIds.has(o.id))
}

/**
 * Mark matching objectives complete across all active quests for a game event,
 * then detect quest completion. Pure: returns new questStates + completions.
 */
function questEventProgress(
  questStates: Record<string, QuestSaveState>,
  event: QuestEvent,
): QuestUpdateResult {
  const next: Record<string, QuestSaveState> = { ...questStates }
  const completed: { quest: Quest; path: QuestPath }[] = []
  let progressed = false

  for (const quest of QUESTS) {
    const st = next[quest.id]
    if (!st || st.status !== 'active') continue

    const done = new Set(st.completedObjectives)
    let changed = false
    for (const path of quest.paths) {
      for (const obj of path.objectives) {
        if (obj.type === event.kind && obj.target === event.target && !done.has(obj.id)) {
          done.add(obj.id)
          changed = true
        }
      }
    }
    if (!changed) continue
    progressed = true

    const finishedPath = quest.paths.find(p => isPathComplete(p, done))
    next[quest.id] = {
      status: finishedPath ? 'completed' : 'active',
      completedObjectives: Array.from(done),
      completedPathId: finishedPath?.id,
    }
    if (finishedPath) completed.push({ quest, path: finishedPath })
  }

  return { next, completed, progressed }
}

/** Complete one specific objective (from a dialogue questProgress effect). */
function questObjectiveProgress(
  questStates: Record<string, QuestSaveState>,
  questId: string,
  objectiveId: string,
): QuestUpdateResult {
  const quest = QUESTS.find(q => q.id === questId)
  const st = questStates[questId]
  const objectiveExists = quest?.paths.some(p => p.objectives.some(o => o.id === objectiveId))
  if (!quest || !st || st.status !== 'active' || !objectiveExists || st.completedObjectives.includes(objectiveId)) {
    return { next: questStates, completed: [], progressed: false }
  }
  const done = new Set(st.completedObjectives)
  done.add(objectiveId)
  const finishedPath = quest.paths.find(p => isPathComplete(p, done))
  return {
    next: {
      ...questStates,
      [questId]: {
        status: finishedPath ? 'completed' : 'active',
        completedObjectives: Array.from(done),
        completedPathId: finishedPath?.id,
      },
    },
    completed: finishedPath ? [{ quest, path: finishedPath }] : [],
    progressed: true,
  }
}

// NPC portrait emoji by witness type (LocationNPC has no icon field)
const WITNESS_ICONS: Record<string, string> = {
  bartender: '🍺',
  sheriff: '⭐',
  settler: '🤠',
  miner: '⛏️',
  native: '🪶',
  outlaw: '🤠',
  merchant: '🧺',
  doctor: '🩺',
  preacher: '✝️',
  default: '🗨️',
}

// ============================================
// TRAVEL ENCOUNTER OVERLAY
// ============================================

function TravelEncounterOverlay({
  encounter,
  onResolve,
  playerStats,
  onSkillCheck,
  allies,
}: {
  encounter: TravelEncounter
  onResolve: (success: boolean, allyBonus?: { xp: number; gold: number; description: string }) => void
  playerStats: Record<StatName, number>
  onSkillCheck: (stat: StatName, difficulty: number) => { success: boolean }
  allies: RecruitedAlly[]
}) {
  const [resolved, setResolved] = useState(false)
  const [success, setSuccess] = useState(false)
  const [allyTrigger, setAllyTrigger] = useState<{ triggered: boolean; effect?: string; magnitude?: number; description?: string } | null>(null)

  const handleResolve = () => {
    // Check ally abilities before the skill check
    let allyAutoResolved = false
    let allyFleeGuaranteed = false
    let bonusXp = 0
    let bonusGold = 0
    let allyDesc = ''

    for (const ally of allies) {
      const abilityResult = rollAllyAbility(ally)
      if (abilityResult.triggered) {
        setAllyTrigger(abilityResult)
        allyDesc = abilityResult.description ?? ''

        if (abilityResult.effect === 'auto_resolve') {
          allyAutoResolved = true
        } else if (abilityResult.effect === 'flee_guaranteed') {
          allyFleeGuaranteed = true
        } else if (abilityResult.effect === 'xp_bonus') {
          bonusXp += abilityResult.magnitude ?? 0
        } else if (abilityResult.effect === 'gold_bonus') {
          bonusGold += abilityResult.magnitude ?? 0
        }
        break // Only one ability per encounter
      }
    }

    if (allyAutoResolved || allyFleeGuaranteed) {
      setSuccess(true)
      setResolved(true)
      return
    }

    const result = onSkillCheck(encounter.stat, encounter.difficulty)
    setSuccess(result.success)
    setResolved(true)

    // Pass bonus XP/gold to parent for ally effects that enhance rewards
    if (bonusXp > 0 || bonusGold > 0) {
      // Will be picked up by onResolve
      setTimeout(() => onResolve(result.success, { xp: bonusXp, gold: bonusGold, description: allyDesc }), 0)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--pixel-bg-dark)] border-4 border-[var(--pixel-gold-mid)] max-w-md w-full p-6">
        <h2 className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-gold-light)] mb-3 text-center">
          ENCOUNTER
        </h2>
        <h3 className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-fire-orange)] mb-2 text-center">
          {encounter.name}
        </h3>
        <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)] mb-4 text-center">
          {encounter.description}
        </p>

        {!resolved ? (
          <div className="text-center">
            <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)] mb-3 opacity-60">
              {encounter.stat} check — DC {encounter.difficulty}
              (Your {encounter.stat}: {playerStats[encounter.stat] ?? 0})
            </p>
            <button
              onClick={handleResolve}
              className="font-[var(--font-pixel)] text-[11px] bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)] px-6 py-2 hover:bg-[var(--pixel-gold-mid)]"
            >
              FACE THE CHALLENGE
            </button>
          </div>
        ) : (
          <div className="text-center">
            {/* Ally ability trigger notification */}
            {allyTrigger?.triggered && (
              <div className="mb-3 p-2 bg-purple-900/50 border border-purple-500 rounded">
                <p className="font-[var(--font-pixel)] text-[12px] text-purple-300">
                  {'\u2728'} {allyTrigger.description}
                </p>
              </div>
            )}
            <p className={`font-[var(--font-pixel)] text-[10px] mb-2 ${
              success ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-orange)]'
            }`}>
              {success ? 'SUCCESS!' : 'FAILED'}
            </p>
            <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)] mb-2">
              {success ? encounter.successText : encounter.failureText}
            </p>
            {encounter.xpReward > 0 && (
              <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)]">
                +{encounter.xpReward} XP
              </p>
            )}
            <button
              onClick={() => onResolve(success)}
              className="mt-3 font-[var(--font-pixel)] text-[11px] bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] px-6 py-2 hover:border-[var(--pixel-gold-dark)]"
            >
              CONTINUE
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// STATS SIDEBAR
// ============================================

const STAT_DISPLAY: Record<StatName, { icon: string; color: string }> = {
  Shrewdness: { icon: '\uD83D\uDD0D', color: '#a78bfa' },
  Agility: { icon: '\u26A1', color: '#60a5fa' },
  Durability: { icon: '\uD83D\uDEE1\uFE0F', color: '#f87171' },
  Diplomacy: { icon: '\uD83E\uDD1D', color: '#34d399' },
  Luck: { icon: '\uD83C\uDF40', color: '#fbbf24' },
  Expertise: { icon: '\uD83C\uDF32', color: '#fb923c' },
}

// ============================================
// PASSPHRASE MODAL
// ============================================
function PassphraseModal({
  mode,
  status,
  onSubmit,
  onClose,
}: {
  mode: 'save' | 'load'
  status: 'idle' | 'working' | 'success' | 'error'
  onSubmit: (passphrase: string) => void
  onClose: () => void
}) {
  const [passphrase, setPassphrase] = useState('')
  const [confirm, setConfirm] = useState('')

  const needsConfirm = mode === 'save' && !getCachedPassphrase()
  const canSubmit = passphrase.length >= 4 && (!needsConfirm || passphrase === confirm)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] p-6 max-w-sm w-full mx-4">
        <h3 className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-gold-light)] mb-4">
          {mode === 'save' ? 'Cloud Save' : 'Cloud Load'}
        </h3>

        {status === 'success' ? (
          <div className="text-center py-4">
            <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-forest-light)] mb-4">
              {mode === 'save' ? 'Saved to cloud!' : 'Game loaded from cloud!'}
            </p>
            <button onClick={onClose} className="font-[var(--font-pixel)] text-[10px] bg-[var(--pixel-forest-dark)] border-2 border-[var(--pixel-forest-light)] text-[var(--pixel-ui-text)] px-4 py-2">
              OK
            </button>
          </div>
        ) : status === 'error' ? (
          <div className="text-center py-4">
            <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-fire-orange)] mb-4">
              {mode === 'load' ? 'Wrong passphrase or no save found.' : 'Save failed. Try again.'}
            </p>
            <button onClick={onClose} className="font-[var(--font-pixel)] text-[10px] bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] px-4 py-2">
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)] mb-3">
              {mode === 'save'
                ? 'Enter a Trail Passphrase to encrypt your save. Remember it — there is no recovery.'
                : 'Enter your Trail Passphrase to decrypt your cloud save.'}
            </p>
            <input
              type="password"
              placeholder="Trail Passphrase"
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
              className="w-full mb-2 px-3 py-2 font-[var(--font-pixel)] text-[11px] bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] outline-none focus:border-[var(--pixel-gold-dark)]"
              autoFocus
            />
            {needsConfirm && (
              <input
                type="password"
                placeholder="Confirm Passphrase"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full mb-2 px-3 py-2 font-[var(--font-pixel)] text-[11px] bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] outline-none focus:border-[var(--pixel-gold-dark)]"
              />
            )}
            {needsConfirm && passphrase && confirm && passphrase !== confirm && (
              <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-fire-orange)] mb-2">Passphrases don&apos;t match</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { if (canSubmit) onSubmit(passphrase) }}
                disabled={!canSubmit || status === 'working'}
                className="flex-1 py-2 font-[var(--font-pixel)] text-[10px] bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)] disabled:opacity-50"
              >
                {status === 'working' ? 'Working...' : mode === 'save' ? 'ENCRYPT & SAVE' : 'DECRYPT & LOAD'}
              </button>
              <button
                onClick={onClose}
                className="py-2 px-3 font-[var(--font-pixel)] text-[10px] bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)]"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatsSidebar({
  stats,
  level,
  xp,
  chapter,
  karma,
  onOpenSkillTree,
  onOpenQuestLog,
  onSaveGame,
  onCloudSave,
  onCloudLoad,
  hasCloud,
  recruitedAllies,
  onDismissAlly,
}: {
  stats: SaddleStats
  level: number
  xp: number
  chapter: number
  karma: number
  onOpenSkillTree: () => void
  onOpenQuestLog: () => void
  onSaveGame: () => void
  onCloudSave: () => void
  onCloudLoad: () => void
  hasCloud: boolean
  recruitedAllies: RecruitedAlly[]
  onDismissAlly: (enemyName: string) => void
}) {
  // Surface the abilities the player chose at creation — previously stored but
  // never shown in play, so build choices felt like they vanished.
  const [abilities, setAbilities] = useState<{ name: string; ability: string }[]>([])
  useEffect(() => {
    try {
      const raw = localStorage.getItem('bobr_adventure_picks')
      if (raw) setAbilities(JSON.parse(raw).specialAbilities ?? [])
    } catch {}
  }, [])

  return (
    <div className="space-y-3">
      {/* Character Stats */}
      <PixelCard title="S.A.D.D.L.E.">
        <div className="space-y-1">
          {(Object.entries(stats) as [StatName, number][]).map(([stat, value]) => (
            <div key={stat} className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xs">{STAT_DISPLAY[stat].icon}</span>
                <span className="font-[var(--font-pixel)] text-[12px]" style={{ color: STAT_DISPLAY[stat].color }}>
                  {stat.slice(0, 3).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-16 h-2 bg-[var(--pixel-bg-dark)] border border-[var(--pixel-ui-border)]">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.min(100, (value / 20) * 100)}%`,
                      backgroundColor: STAT_DISPLAY[stat].color,
                    }}
                  />
                </div>
                <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] w-4 text-right">
                  {value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </PixelCard>

      {/* Level & XP */}
      <PixelCard title="Progress">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)]">Level</span>
            <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)]">{level}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)]">XP</span>
            <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">{xp}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)]">Chapter</span>
            <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">{chapter}/5</span>
          </div>
          <div className="flex justify-between">
            <span className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)]">Karma</span>
            <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">{'🌮'} {karma}</span>
          </div>
        </div>
      </PixelCard>

      {/* Chosen Abilities — your build choices, now visible in play */}
      {abilities.length > 0 && (
        <PixelCard title="ABILITIES">
          <div className="space-y-2">
            {abilities.map(a => (
              <div key={a.name} className="p-2 bg-[var(--pixel-bg-dark)] border border-[var(--pixel-gold-mid)]/40">
                <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)]">{a.name}</p>
                <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] opacity-70">{a.ability}</p>
              </div>
            ))}
          </div>
        </PixelCard>
      )}

      {/* Recruited Allies */}
      {recruitedAllies.length > 0 && (
        <PixelCard title={`ALLIES (${recruitedAllies.length}/2)`}>
          <div className="space-y-2">
            {recruitedAllies.map(ally => (
              <div key={ally.enemyName} className="p-2 bg-[var(--pixel-bg-dark)] border border-[var(--pixel-ui-border)] rounded">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{ally.icon}</span>
                    <span className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)]">
                      {ally.enemyName}
                    </span>
                  </div>
                  <button
                    onClick={() => onDismissAlly(ally.enemyName)}
                    className="text-[11px] text-red-400 hover:text-red-300 font-[var(--font-pixel)]"
                    title="Dismiss ally"
                  >
                    {'\u2715'}
                  </button>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs">{STAT_DISPLAY[ally.bonusStat]?.icon ?? ''}</span>
                  <span className="font-[var(--font-pixel)] text-[11px]" style={{ color: STAT_DISPLAY[ally.bonusStat]?.color ?? '#ccc' }}>
                    +{ally.bonusAmount} {ally.bonusStat}
                  </span>
                </div>
                <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] opacity-70 mb-1">
                  {ally.passiveEffect}
                </p>
                {ally.specialAbility && (
                  <div className="flex items-center gap-1">
                    <span className="text-[11px]">{'\u2728'}</span>
                    <span className="font-[var(--font-pixel)] text-[10px] text-purple-300">
                      {ally.specialAbility.name}
                    </span>
                  </div>
                )}
                <div className="mt-1 flex justify-between items-center">
                  <span className="font-[var(--font-pixel)] text-[10px] text-amber-400">
                    {ally.chaptersRemaining === 0 ? 'Permanent' : `${ally.chaptersRemaining} ch. left`}
                  </span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(ally.chaptersRemaining, 5) }).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PixelCard>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={onOpenSkillTree}
          className="w-full py-2 px-3 font-[var(--font-pixel)] text-[10px] bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] hover:border-[var(--pixel-gold-dark)]"
        >
          {'\uD83C\uDF33'} SKILL TREE
        </button>
        <button
          onClick={onOpenQuestLog}
          className="w-full py-2 px-3 font-[var(--font-pixel)] text-[10px] bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] hover:border-[var(--pixel-gold-dark)]"
        >
          {'\uD83D\uDCDC'} JOURNAL
        </button>
        <button
          onClick={onSaveGame}
          className="w-full py-2 px-3 font-[var(--font-pixel)] text-[10px] bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] hover:border-[var(--pixel-forest-dark)]"
        >
          {'\uD83D\uDCBE'} SAVE GAME
        </button>
        <button
          onClick={onCloudSave}
          className="w-full py-2 px-3 font-[var(--font-pixel)] text-[10px] bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-gold-light)] hover:border-[var(--pixel-gold-dark)]"
        >
          {'\u2601'} CLOUD SAVE
        </button>
        {hasCloud && (
          <button
            onClick={onCloudLoad}
            className="w-full py-2 px-3 font-[var(--font-pixel)] text-[10px] bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] hover:border-[var(--pixel-gold-dark)]"
          >
            {'\u2601'} CLOUD LOAD
          </button>
        )}
        <PixelButton href="/game" variant="orange" size="sm">
          {'\u2190'} EXIT TO MENU
        </PixelButton>
      </div>
    </div>
  )
}

// ============================================
// NARRATOR TOAST
// ============================================

function NarratorToast() {
  const { state: narratorState, dismissComment } = useNarrator()
  if (!narratorState.activeComment) return null

  const comment = narratorState.activeComment
  return (
    <div
      className="fixed top-20 left-1/2 -translate-x-1/2 z-40 max-w-md w-full mx-4 animate-in slide-in-from-top duration-500"
      onClick={dismissComment}
    >
      <div className={`p-3 border-2 backdrop-blur-sm cursor-pointer ${
        comment.isLie
          ? 'bg-[var(--pixel-fire-red)]/20 border-[var(--pixel-fire-orange)]/50'
          : 'bg-[var(--pixel-bg-mid)]/90 border-[var(--pixel-gold-mid)]/50'
      }`}>
        <div className="flex items-start gap-2">
          <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] shrink-0">
            NARRATOR:
          </span>
          <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)] italic">
            "{comment.text}"
          </p>
        </div>
        {comment.isLie && (
          <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-fire-orange)] mt-1 opacity-50">
            (The narrator seems... unreliable)
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================
// REPUTATION DISPLAY
// ============================================

function ReputationDisplay() {
  const { state: repState, getReputationLevel } = useReputation()

  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(repState.reputations) as [FactionId, number][]).map(([factionId, rep]) => {
        const level = getReputationLevel(factionId)
        return (
          <div key={factionId} className="flex items-center gap-1">
            <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] opacity-60">
              {factionId.slice(0, 4).toUpperCase()}
            </span>
            <div className="w-10 h-1.5 bg-[var(--pixel-bg-dark)] border border-[var(--pixel-ui-border)]">
              <div
                className="h-full"
                style={{
                  width: `${Math.min(100, Math.max(0, (rep + 100) / 200 * 100))}%`,
                  backgroundColor: rep > 25 ? '#34d399' : rep > 0 ? '#fbbf24' : rep > -25 ? '#9ca3af' : '#f87171',
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// MAIN ADVENTURE CONTENT
// ============================================

function AdventureContent() {
  const router = useRouter()
  const { state: charState, rollSkillCheck, addExperience, getStat, loadCharacter, modifyStat } = useCharacter()
  const { balance, earnNeutral, spendNeutral, initializeWallet, isInitialized: walletInitialized, getKarmaAlignment } = useKarmaWallet()
  const { state: repState, modifyReputation, getReputationLevel, getReputation } = useReputation()
  const { comment: narratorComment } = useNarrator()

  const [adventureState, setAdventureState] = useState<AdventureState | null>(null)
  const [showSkillTree, setShowSkillTree] = useState(false)
  const [travelEncounter, setTravelEncounter] = useState<TravelEncounter | null>(null)
  const [travelDestination, setTravelDestination] = useState<string | null>(null)
  const [showCamp, setShowCamp] = useState(false)
  const [activeConfrontation, setActiveConfrontation] = useState<ConfrontationEnemy | null>(null)
  // 2026-06-17: default to the working SVG node map. The free-roam (Pixi) EXPLORE
  // view has movement bugs (WASD nulls the travel target; the map remounts the
  // player home mid-walk) — the "movement under explore often fails" report. Until
  // the unified state→county→local map lands, the reliable map is the default; the
  // free-roam stays reachable via the toggle but is no longer the first thing seen.
  const [explorationMode, setExplorationMode] = useState(false)
  const [pixiFailed, setPixiFailed] = useState(false)
  const [showClueGameUnlock, setShowClueGameUnlock] = useState(false)
  // Authored dialogue tree currently open (NPCs with trees), and the quest journal
  const [activeDialogue, setActiveDialogue] = useState<{ dialogue: Dialogue; npc: LocationNPC } | null>(null)
  const [showQuestLog, setShowQuestLog] = useState(false)
  // Backdrop-close grace: the second click of a rapid double-click on the TALK
  // button would otherwise land on the backdrop and instantly close the
  // just-opened dialogue. (Escape and the LEAVE button are never gated.)
  const dialogueOpenedAtRef = useRef(0)

  // Track page view on mount
  useEffect(() => {
    trackPageView('/adventure/play')
  }, [])

  // Initialize state
  useEffect(() => {
    const saved = loadAdventureState()
    if (saved) {
      setAdventureState(saved)
    } else {
      const newState = createNewAdventureState()
      setAdventureState(newState)
      saveAdventureState(newState)
      trackGameStart('adventure')
    }
  }, [])

  // Initialize the karma wallet for the adventure path. Oregon Trail initializes
  // via its New/Continue menu, but the adventure never called initializeWallet —
  // walletMode stayed null, so the wallet's persistence effect (gated on
  // isInitialized && walletMode) never wrote and the balance reset to 400 on
  // every reload while purchases persisted. If a stored wallet exists the
  // provider hydrates it on mount (which engages persistence); otherwise start
  // a new wallet exactly once here.
  const walletInitRef = useRef(false)
  useEffect(() => {
    if (walletInitRef.current || walletInitialized) return
    walletInitRef.current = true
    // Same canonical key the wallet provider reads/writes (see karmaWalletContext)
    if (!localStorage.getItem('oregon_trail_karma_wallet')) {
      initializeWallet('new')
    }
  }, [walletInitialized, initializeWallet])

  // Latest-value refs so the persistence effects below don't re-subscribe (and
  // tear down/recreate timers) on every single state change during combat.
  // Updated in effects (not during render — writing refs in render is impure).
  const stateRef = useRef(adventureState)
  const charRef = useRef(charState.character)
  useEffect(() => { stateRef.current = adventureState }, [adventureState])
  useEffect(() => { charRef.current = charState.character }, [charState.character])

  // Sync the player's S.A.D.D.L.E. stats into cross-game CharacterQualities so the
  // braided systems (chase-ledger free-witness gates that require investigation/social
  // >= 70, and the trophy/legacy share card) reflect the real character instead of the
  // 50-default. Previously only the prologue populated qualities, so adventure-first
  // players carried "average" qualities everywhere. See cross-progression sweep 2026-06-26.
  useEffect(() => {
    if (charState.character) {
      CrossGameStorage.updateQualities(qualitiesFromSaddle(charState.character.stats))
    }
  }, [charState.character])

  // Debounced persistence: replaces the old in-reducer synchronous save. Every
  // state change schedules one write 500ms after activity settles, so a burst
  // of combat updates collapses to a single localStorage write instead of one
  // blocking write per update (the source of the "very delayed" lag).
  useEffect(() => {
    if (!adventureState) return
    const t = setTimeout(() => saveAdventureState(adventureState), 500)
    return () => clearTimeout(t)
  }, [adventureState])

  // Clock tick for play-time display. Keeps render pure (no Date.now() in JSX);
  // the minute counter advances off this state, not a render-time clock read.
  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30000)
    return () => clearInterval(t)
  }, [])

  // Periodic enriched autosave backstop (leaderboard/trophy fields). Reads from
  // refs and is created ONCE — it no longer churns a timer on every render.
  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current
      if (!s) return
      const enriched = { ...s } as AdventureState & { level?: number; playerName?: string }
      if (charRef.current) {
        enriched.level = charRef.current.level ?? 1
        enriched.playerName = charRef.current.name ?? 'Unknown'
      }
      saveAdventureState(enriched as AdventureState)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Redirect if no character (delay to let CharacterProvider hydrate from localStorage)
  useEffect(() => {
    if (!adventureState) return
    if (charState.character) return // Already loaded
    const timer = setTimeout(() => {
      if (!charState.character) {
        const savedChar = localStorage.getItem('bobr_ot_character')
        if (!savedChar) {
          router.push('/adventure/character-creation')
        }
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [adventureState, charState.character, router])

  const updateState = useCallback((updates: Partial<AdventureState>) => {
    // Pure reducer — no side effects. Persistence is handled by the debounced
    // effect above (was a synchronous full-state write here on every change).
    setAdventureState(prev => (prev ? { ...prev, ...updates } : prev))
  }, [])

  // Apply one-time "Start with +X reputation" abilities from the player's picks.
  // Guarded by startingAbilitiesApplied so it fires exactly once per game (not on
  // every reload) — the chosen abilities now actually change the world (B3 follow-through).
  useEffect(() => {
    if (!adventureState || adventureState.startingAbilitiesApplied) return
    try {
      const raw = localStorage.getItem('bobr_adventure_picks')
      const picks: string[] = raw ? (JSON.parse(raw).picks ?? []) : []
      for (const id of picks) {
        const pick = getPickById(id)
        if (pick?.startingReputation) {
          modifyReputation(pick.startingReputation.faction, pick.startingReputation.amount, `Trait: ${pick.name}`)
        }
      }
    } catch {}
    updateState({ startingAbilitiesApplied: true })
  }, [adventureState, modifyReputation, updateState])

  // quick_learner ability: double XP earned from skill checks (NPC skill checks
  // and clue puzzles) — read once from the player's picks.
  const hasQuickLearner = useMemo(() => {
    try { return ((JSON.parse(localStorage.getItem('bobr_adventure_picks') || '{}').picks) ?? []).includes('quick_learner') }
    catch { return false }
  }, [])
  const skillCheckXP = useCallback((amount: number) => (hasQuickLearner ? amount * 2 : amount), [hasQuickLearner])

  // Get player stats safely (includes recruited ally bonuses)
  const playerStats = useMemo((): Record<StatName, number> => {
    const base = charState.character
      ? { ...charState.character.stats }
      : { Shrewdness: 8, Agility: 8, Durability: 8, Diplomacy: 8, Luck: 8, Expertise: 8 }

    // Apply recruited ally stat bonuses
    const allyBonuses = getAllyStatBonuses(adventureState?.recruitedAllies ?? [])
    for (const [stat, bonus] of Object.entries(allyBonuses)) {
      if (stat in base) {
        base[stat as StatName] += bonus
      }
    }

    return base
  }, [charState.character, adventureState?.recruitedAllies])

  // Get faction reps
  const factionReps = useMemo((): Record<FactionId, number> => {
    return repState.reputations as Record<FactionId, number>
  }, [repState.reputations])

  // === XP === (defined before the talk/travel handlers — quest rewards flow through it)
  const handleAddXP = useCallback((amount: number) => {
    // Clue XP flows through here — apply the quick_learner skill-check multiplier
    // once and use the gained amount for both character XP and adventure totals.
    const gained = skillCheckXP(amount)
    addExperience(gained)
    setAdventureState(prev => {
      if (!prev) return prev
      const newTotalXP = prev.totalXP + gained
      // Award 1 skill point every 100 XP
      const oldLevel = Math.floor(prev.totalXP / 100)
      const newLevel = Math.floor(newTotalXP / 100)
      const skillPointsEarned = newLevel - oldLevel
      // Pure updater — persistence handled by the debounced save effect.
      return {
        ...prev,
        totalXP: newTotalXP,
        skillPoints: prev.skillPoints + skillPointsEarned,
      }
    })
  }, [addExperience, skillCheckXP])

  // ============================================
  // QUEST + DIALOGUE WIRING
  // ============================================
  // questStatesRef mirrors adventureState.questStates but is updated
  // SYNCHRONOUSLY when a handler applies progress, so two events in the same
  // tick (or a rapid double-click) can never double-apply rewards. All setState
  // updaters below stay pure — rewards are applied via the existing handlers
  // (handleAddXP / earnNeutral / modifyReputation) outside the updaters.
  const questStatesRef = useRef<Record<string, QuestSaveState> | null>(null)
  useEffect(() => {
    questStatesRef.current = adventureState?.questStates ?? null
  }, [adventureState?.questStates])

  // Apply a completed quest path's reward through the EXISTING reward paths.
  const applyQuestCompletions = useCallback((completed: { quest: Quest; path: QuestPath }[]) => {
    for (const { quest, path } of completed) {
      const r = path.reward
      if (r.xp) handleAddXP(r.xp)
      if (r.gold && r.gold > 0) earnNeutral(r.gold, `Quest: ${quest.title}`)
      // Karma mapping follows the codebase's precedents: lawful → pinkerton
      // reputation (see handleConfrontationEnd), positive good → neutral karma
      // (see camp karmaGain / encounter karmaReward). Negative 'good' has no
      // existing sink and is intentionally a no-op.
      if (r.karma?.lawful) modifyReputation('pinkerton', r.karma.lawful, `Quest: ${quest.title}`)
      if (r.karma?.good && r.karma.good > 0) earnNeutral(r.karma.good, `Quest karma: ${quest.title}`)
      r.reputation?.forEach(rep => modifyReputation(rep.faction, rep.amount, `Quest: ${quest.title}`))
      narratorComment(`Quest complete: ${quest.title} — ${path.name}. (+${r.xp} XP)`, 'observation')
    }
  }, [handleAddXP, earnNeutral, modifyReputation, narratorComment])

  // Commit a quest engine result: sync the ref, apply rewards, merge state.
  // setFlag/unlockLocation rewards merge inside the (pure) updater so they
  // never clobber concurrent updates from the same tick.
  const commitQuestUpdate = useCallback((result: QuestUpdateResult) => {
    if (!result.progressed) return
    questStatesRef.current = result.next
    applyQuestCompletions(result.completed)
    const flagAdds = result.completed.map(c => c.path.reward.setFlag).filter((f): f is string => !!f)
    const locAdds = result.completed.map(c => c.path.reward.unlockLocation).filter((l): l is string => !!l)
    setAdventureState(prev => {
      if (!prev) return prev
      const flags = flagAdds.length > 0
        ? [...new Set([...(prev.dialogueFlags ?? []), ...flagAdds])]
        : (prev.dialogueFlags ?? [])
      const discovered = locAdds.length > 0
        ? [...new Set([...prev.discoveredLocationIds, ...locAdds])]
        : prev.discoveredLocationIds
      return { ...prev, questStates: result.next, dialogueFlags: flags, discoveredLocationIds: discovered }
    })
  }, [applyQuestCompletions])

  // Fire a game event (talk / travel / clue) into all active quests.
  const fireQuestEvent = useCallback((event: QuestEvent) => {
    const qs = questStatesRef.current
    if (!qs) return
    commitQuestUpdate(questEventProgress(qs, event))
  }, [commitQuestUpdate])

  // Complete one named objective (dialogue questProgress effect).
  const fireQuestObjective = useCallback((questId: string, objectiveId: string) => {
    const qs = questStatesRef.current
    if (!qs) return
    commitQuestUpdate(questObjectiveProgress(qs, questId, objectiveId))
  }, [commitQuestUpdate])

  // Activate a quest (from a dialogue questStart effect, or by talking to its
  // giver). Idempotent — already-active/completed quests are untouched.
  const activateQuest = useCallback((questId: string) => {
    const quest = QUESTS.find(q => q.id === questId)
    if (!quest) return
    const qs = questStatesRef.current ?? {}
    if (qs[questId]) return
    const next = { ...qs, [questId]: { status: 'active' as const, completedObjectives: [] } }
    questStatesRef.current = next
    setAdventureState(prev => (prev ? { ...prev, questStates: next } : prev))
    narratorComment(`New quest: ${quest.title}. Check your journal.`, 'observation')
  }, [narratorComment])

  // Quest prerequisite gate (giver-talk activation path).
  const questPrereqMet = useCallback((quest: Quest): boolean => {
    const pre = quest.prerequisite
    if (!pre) return true
    const qs = questStatesRef.current ?? {}
    if (pre.questId && qs[pre.questId]?.status !== 'completed') return false
    if (pre.flag && !(stateRef.current?.dialogueFlags ?? []).includes(pre.flag)) return false
    if (pre.minReputation && getReputation(pre.minReputation.faction) < pre.minReputation.level) return false
    return true
  }, [getReputation])

  // Talking to a quest giver in (or before) the current chapter offers the quest.
  const maybeActivateQuestsFromGiver = useCallback((npcId: string) => {
    const chapter = stateRef.current?.chapter ?? 1
    for (const quest of QUESTS) {
      if (quest.giver !== npcId || quest.chapter > chapter) continue
      if (questStatesRef.current?.[quest.id]) continue
      if (!questPrereqMet(quest)) continue
      activateQuest(quest.id)
    }
  }, [questPrereqMet, activateQuest])

  // Synchronous mirror of the persisted reward-claim keys (a subset of
  // dialogueFlags — entries prefixed `reward_claimed:`). Mirrors the
  // questStatesRef discipline: updated SYNCHRONOUSLY the instant a node is
  // paid out so a rapid double-click / Strict-Mode double-invoke in the same
  // tick can never double-pay, before the (async) setState has committed.
  const claimedRewardsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    claimedRewardsRef.current = new Set(
      (adventureState?.dialogueFlags ?? []).filter(f => f.startsWith('reward_claimed:')),
    )
  }, [adventureState?.dialogueFlags])

  // Stable per-grant claim key for an option's effects. The effects object is
  // passed by reference straight from the authored data module, so we locate
  // the owning option in the open tree by referential identity and key off
  // (npcId : optionId) — both stable across re-walks and save/load. If no
  // option matches (defensive — shouldn't happen for authored trees), fall
  // back to a deterministic signature of the numeric grants so re-walking the
  // same node still dedupes rather than silently re-paying.
  const rewardClaimKey = useCallback((effects: DialogueEffect): string => {
    const npcId = activeDialogue?.npc.id ?? 'unknown_npc'
    let optionId: string | undefined
    for (const node of activeDialogue?.dialogue.nodes ?? []) {
      const opt = node.options.find(o => o.effects === effects)
      if (opt) { optionId = `${node.id}:${opt.id}`; break }
    }
    if (optionId) return `reward_claimed:${npcId}:${optionId}`
    const sig = `${effects.xp ?? 0}|${effects.gold ?? 0}|${effects.karma?.lawful ?? 0}|${effects.karma?.good ?? 0}`
    return `reward_claimed:${npcId}:sig:${sig}`
  }, [activeDialogue])

  // Apply an authored dialogue option's effects through the EXISTING handlers
  // — no new state paths, no side effects inside setState updaters.
  //
  // Reward-farming guard: the NUMERIC grants (xp / gold / karma) pay out AT
  // MOST ONCE per (npcId, node:option) per playthrough. Flag/reputation/quest/
  // unlock effects are NOT guarded here — they already set-dedupe (flags) or
  // dedupe in the quest engine, and they gate progression so re-firing them is
  // harmless. Re-walking a tree still reads + navigates; it just won't re-pay.
  const applyDialogueEffects = useCallback((effects: DialogueEffect) => {
    if (!effects) return

    const hasNumericGrant = !!(effects.xp || (effects.gold && effects.gold > 0) || effects.karma?.lawful || (effects.karma?.good && effects.karma.good > 0))
    const claimKey = hasNumericGrant ? rewardClaimKey(effects) : ''
    // Already claimed (sync ref catches same-tick repeats before the async
    // setState commits; the persisted dialogueFlags catches re-walks + reloads).
    const alreadyClaimed = hasNumericGrant && claimedRewardsRef.current.has(claimKey)

    if (hasNumericGrant && !alreadyClaimed) {
      // Mark claimed synchronously FIRST — idempotent under Strict Mode's
      // double-invoke and immune to a second rapid call in the same tick.
      claimedRewardsRef.current.add(claimKey)
      if (effects.xp) handleAddXP(effects.xp)
      if (effects.gold && effects.gold > 0) earnNeutral(effects.gold, 'Dialogue')
      if (effects.karma?.lawful) modifyReputation('pinkerton', effects.karma.lawful, 'Dialogue choice')
      if (effects.karma?.good && effects.karma.good > 0) earnNeutral(effects.karma.good, 'Dialogue karma')
    }

    // Spending gold (negative) is a player-initiated cost, not a farmable
    // grant — leave it ungated so re-walking a "pay the toll" node can charge
    // again (matches the player's intent, and it can't be exploited for gain).
    if (effects.gold && effects.gold < 0 && balance.neutral > 0) {
      spendNeutral(Math.min(balance.neutral, -effects.gold), 'Dialogue')
    }

    if (effects.reputation) modifyReputation(effects.reputation.faction, effects.reputation.delta, 'Dialogue')
    if (effects.questStart) activateQuest(effects.questStart)
    if (effects.questProgress) fireQuestObjective(effects.questProgress.questId, effects.questProgress.objectiveId)
    // Persist the claim key into dialogueFlags (set-deduped, survives save/load)
    // in the SAME pure functional update as flag/unlock effects — no side
    // effects inside the updater.
    const claimToPersist = hasNumericGrant && !alreadyClaimed ? claimKey : null
    if (effects.flag || effects.unlockLocation || claimToPersist) {
      const flag = effects.flag
      const loc = effects.unlockLocation
      setAdventureState(prev => {
        if (!prev) return prev
        // Build the additions set (flag + claim key), deduped against existing.
        const toAdd = [flag, claimToPersist].filter((f): f is string => !!f && !(prev.dialogueFlags ?? []).includes(f))
        const flags = toAdd.length > 0
          ? [...(prev.dialogueFlags ?? []), ...toAdd]
          : (prev.dialogueFlags ?? [])
        const discovered = loc && !prev.discoveredLocationIds.includes(loc)
          ? [...prev.discoveredLocationIds, loc]
          : prev.discoveredLocationIds
        return { ...prev, dialogueFlags: flags, discoveredLocationIds: discovered }
      })
      if (loc) narratorComment('A new location has been marked on your map.', 'observation')
    }
  }, [handleAddXP, earnNeutral, spendNeutral, balance.neutral, modifyReputation, activateQuest, fireQuestObjective, narratorComment, rewardClaimKey])

  // === TRAVEL ===
  // _resuming=true skips the encounter rolls — set by handleEncounterResolved /
  // handleConfrontationEnd so "Continue" after a resolved encounter doesn't
  // immediately roll a new one (which read as a stuck button to the player).
  const handleTravelTo = useCallback((locationId: string, _resuming: boolean = false) => {
    if (!adventureState) return

    if (!_resuming) {
      // Check for travel encounter first
      const encounter = rollTravelEncounter()
      if (encounter) {
        setTravelDestination(locationId)
        setTravelEncounter(encounter)
        narratorComment('Hmm, the road between here and there is never as simple as a map suggests.', 'observation')
        return
      }

      // Check for confrontation encounter
      const enemy = rollConfrontation(adventureState.chapter, adventureState.unlockedSkillNodes)
      if (enemy) {
        setTravelDestination(locationId)
        setActiveConfrontation(enemy)
        narratorComment(enemy.description, 'observation')
        return
      }
    }

    // Direct travel — discover and arrive
    const loc = getChapterLocation(locationId)
    if (!loc) return

    // Record map discovery for cross-game continuity
    CrossGameStorage.addMapDiscovery(locationId, 'rpg_adventure', loc.icon, loc.name)

    const newDiscovered = adventureState.discoveredLocationIds.includes(locationId)
      ? adventureState.discoveredLocationIds
      : [...adventureState.discoveredLocationIds, locationId]

    // Discover connected locations
    const connectedDiscoveries = loc.connectedTo.filter(
      id => !newDiscovered.includes(id) && getChapterLocation(id)
    )
    const allDiscovered = [...newDiscovered, ...connectedDiscoveries]

    updateState({
      currentLocationId: locationId,
      discoveredLocationIds: allDiscovered,
      visitedLocationIds: [...new Set([...adventureState.visitedLocationIds, locationId])],
      phase: 'exploring',
    })

    // Log location discovery for cross-game narrator
    const isFirstVisit = !adventureState.visitedLocationIds.includes(locationId)
    if (isFirstVisit) {
      CrossGameStorage.logEvent('rpg_adventure', 'discovery_made', `Discovered ${loc.name}`, { locationId, detail: loc.atmosphere })
    }
    CrossGameStorage.logEvent('rpg_adventure', 'landmark_reached', `Arrived at ${loc.name}`, { locationId })

    if (connectedDiscoveries.length > 0) {
      narratorComment(
        `New paths revealed. ${connectedDiscoveries.length} location${connectedDiscoveries.length > 1 ? 's' : ''} discovered.`,
        'observation'
      )
    }

    // Quest hook: 'travel'-type objectives targeting this location. Fired AFTER
    // updateState so the commit's functional updater merges on top of the
    // arrival state (both updaters are pure; ordering keeps discoveries intact).
    fireQuestEvent({ kind: 'travel', target: locationId })
  }, [adventureState, updateState, narratorComment, fireQuestEvent])

  // Resolve travel encounter
  const handleEncounterResolved = useCallback((success: boolean, allyBonus?: { xp: number; gold: number; description: string }) => {
    if (!travelEncounter) return

    addExperience(travelEncounter.xpReward)
    if (success && travelEncounter.karmaReward) {
      earnNeutral(travelEncounter.karmaReward, `Encounter: ${travelEncounter.name}`)
    }

    // Apply ally ability bonuses
    if (allyBonus) {
      if (allyBonus.xp > 0) addExperience(allyBonus.xp)
      if (allyBonus.gold > 0) earnNeutral(allyBonus.gold, 'Ally bonus')
      if (allyBonus.description) narratorComment(allyBonus.description, 'observation')
    }

    // Always clear the encounter overlay first
    setTravelEncounter(null)
    // Only continue travel if a destination was set (map-click path). Random
    // encounters triggered by free-roam exploration have no destination — the
    // player just stays where they are.
    if (travelDestination) {
      const destId = travelDestination
      setTravelDestination(null)
      handleTravelTo(destId, true)
    }
  }, [travelEncounter, travelDestination, addExperience, earnNeutral, narratorComment, handleTravelTo])

  // Resolve confrontation encounter
  const handleConfrontationEnd = useCallback((result: ConfrontationResult) => {
    if (!activeConfrontation) return

    addExperience(result.xpEarned)
    if (result.goldEarned > 0) {
      earnNeutral(result.goldEarned, `Confrontation: ${activeConfrontation.name}`)
    }
    if (result.goldSpent > 0) {
      spendNeutral(result.goldSpent, `Recruited: ${activeConfrontation.name}`)
    }
    if (result.karmaEffect?.lawful) {
      modifyReputation('pinkerton', result.karmaEffect.lawful, `Confrontation: ${activeConfrontation.name}`)
    }

    // Update confrontation counters + log cross-game events
    if (result.outcome === 'victory') {
      updateState({ confrontationsWon: (adventureState?.confrontationsWon ?? 0) + 1 })
      narratorComment('The dust settles. You stand victorious.', 'observation')
      CrossGameStorage.logEvent('rpg_adventure', 'confrontation_won', `Defeated ${activeConfrontation.name}`, { detail: activeConfrontation.description })
    } else if (result.outcome === 'defeat') {
      updateState({ confrontationsLost: (adventureState?.confrontationsLost ?? 0) + 1 })
      narratorComment(activeConfrontation.defeatText, 'observation')
      CrossGameStorage.logEvent('rpg_adventure', 'confrontation_lost', `Defeated by ${activeConfrontation.name}`)
    } else if (result.outcome === 'fled') {
      narratorComment(activeConfrontation.fleeText, 'observation')
      CrossGameStorage.logEvent('rpg_adventure', 'confrontation_fled', `Fled from ${activeConfrontation.name}`)
    } else if (result.outcome === 'recruited' && result.recruitedAlly) {
      const currentAllies = adventureState?.recruitedAllies ?? []
      updateState({ recruitedAllies: [...currentAllies, result.recruitedAlly] })
      narratorComment(`${result.recruitedAlly.enemyName} has joined your party! ${result.recruitedAlly.passiveEffect}`, 'observation')
      CrossGameStorage.logEvent('rpg_adventure', 'ally_recruited', `Recruited ${result.recruitedAlly.enemyName}`, { detail: result.recruitedAlly.passiveEffect })
    } else if (result.outcome === 'talked') {
      narratorComment('Words prove mightier than fists. A peaceful resolution.', 'observation')
      CrossGameStorage.logEvent('rpg_adventure', 'npc_befriended', `Talked down ${activeConfrontation.name}`)
    }

    // Continue travel to destination — resuming, do NOT re-roll a new encounter
    setActiveConfrontation(null)
    if (travelDestination) {
      const destId = travelDestination
      setTravelDestination(null)
      handleTravelTo(destId, true)
    }
  }, [activeConfrontation, adventureState, travelDestination, addExperience, earnNeutral, spendNeutral, modifyReputation, updateState, narratorComment, handleTravelTo])

  // === DISMISS ALLY ===
  const handleDismissAlly = useCallback((enemyName: string) => {
    const currentAllies = adventureState?.recruitedAllies ?? []
    updateState({ recruitedAllies: currentAllies.filter(a => a.enemyName !== enemyName) })
    narratorComment(`${enemyName} parts ways with you. The road grows lonelier.`, 'observation')
  }, [adventureState?.recruitedAllies, updateState, narratorComment])

  // === VISIT LOCATION ===
  const handleVisitLocation = useCallback((locationId: string) => {
    updateState({ phase: 'at_location', currentLocationId: locationId })
  }, [updateState])

  const handleReturnToMap = useCallback(() => {
    updateState({ phase: 'exploring' })
  }, [updateState])

  // === NPC TALK ===
  const handleNPCTalk = useCallback((npc: LocationNPC) => {
    // Quest hooks fire for every conversation: giver activation first, so a
    // 'talk' objective targeting the giver completes in the same conversation.
    maybeActivateQuestsFromGiver(npc.id)
    fireQuestEvent({ kind: 'talk', target: npc.id })

    // NPCs with an authored dialogue tree open the full Fallout-style
    // conversation (DialogueView) instead of the bare skill-check toast.
    const trees = getDialoguesForNpc(npc.id)
    if (trees.length > 0) {
      dialogueOpenedAtRef.current = Date.now()
      setActiveDialogue({ dialogue: trees[0], npc })
      return
    }

    // No authored tree — original skill-check/toast path, unchanged.
    if (npc.skillCheckStat && npc.skillCheckDC) {
      const result = rollSkillCheck(npc.skillCheckStat, npc.skillCheckDC)
      if (result.success) {
        addExperience(skillCheckXP(15))
        narratorComment(
          `${npc.name} seems to warm up to you. Information flows freely.`,
          'observation'
        )
        // Faction reputation
        if (npc.faction) {
          modifyReputation(npc.faction, 3, `Talked with ${npc.name}`)
        }
      } else {
        addExperience(skillCheckXP(5))
        narratorComment(
          `${npc.name} eyes you warily. Perhaps a different approach would work better.`,
          'observation'
        )
      }
    } else {
      addExperience(10)
      narratorComment(`${npc.name}: "${npc.dialogueHint}"`, 'observation')
      if (npc.faction) {
        modifyReputation(npc.faction, 2, `Conversation with ${npc.name}`)
      }
    }
  }, [rollSkillCheck, addExperience, narratorComment, modifyReputation, skillCheckXP, maybeActivateQuestsFromGiver, fireQuestEvent])

  // === SKILL CHECK WRAPPER ===
  const handleSkillCheck = useCallback((stat: StatName, difficulty: number) => {
    return rollSkillCheck(stat, difficulty)
  }, [rollSkillCheck])

  // === KARMA ===
  const handleEarnKarma = useCallback((amount: number, memo: string) => {
    if (amount > 0) earnNeutral(amount, memo)
  }, [earnNeutral])

  // === SPEND KARMA ===
  const handleSpendKarma = useCallback((amount: number, memo: string): boolean => {
    if (balance.neutral < amount) return false
    spendNeutral(amount, memo)
    return true
  }, [balance.neutral, spendNeutral])

  // === CLUE ANSWERED ===
  const handleClueAnswered = useCallback((clue: import('@/app/adventure/data/chapterLocations').DiscoveryClue, correct: boolean) => {
    if (correct) {
      // Pure updater — persistence handled by the debounced save effect.
      setAdventureState(prev => (prev ? { ...prev, cluesAnswered: prev.cluesAnswered + 1 } : prev))
      narratorComment('Knowledge is its own reward. Well, that and the XP.', 'fourth_wall')
      // Quest hook: 'clue'-type objectives targeting this clue id
      fireQuestEvent({ kind: 'clue', target: clue.id })
    }
  }, [narratorComment, fireQuestEvent])

  // === COMPLETE CHAPTER ===
  const handleCompleteChapter = useCallback(() => {
    if (!adventureState) return

    // Record cross-game milestone
    const milestoneMap: Record<number, string> = {
      1: 'adventure_chapter_1',
      2: 'adventure_chapter_2',
      3: 'adventure_chapter_3',
      4: 'adventure_chapter_4',
      5: 'adventure_chapter_5',
    }
    const milestoneId = milestoneMap[adventureState.chapter]
    if (milestoneId) {
      CrossGameStorage.recordMilestone(milestoneId as import('@/lib/crossGameProgression').MilestoneId, 'rpg_adventure')
    }

    // Check for ally departures at chapter end
    const currentAllies = adventureState.recruitedAllies ?? []
    if (currentAllies.length > 0) {
      const { remaining, departed } = updateAllyDurations(currentAllies, adventureState.chapter)
      if (departed.length > 0) {
        const names = departed.map(a => a.enemyName).join(' and ')
        narratorComment(`${names} ${departed.length > 1 ? 'have' : 'has'} moved on. Their time with you is over.`, 'observation')
        updateState({ recruitedAllies: remaining })
      }
    }

    if (adventureState.chapter >= 5) {
      // Game complete — meet Cynthia. The finish-game → Cynthia → QR-hunt chain
      // runs through ClueGameUnlock (full-screen takeover below); its LEAVE INN
      // button routes to /game, replacing the old immediate redirect.
      narratorComment('And so the story ends. Or does it? Check the ranch for the real treasure.', 'fourth_wall')
      setShowClueGameUnlock(true)
      return
    }
    // Show camp management
    setShowCamp(true)
    updateState({ phase: 'camp' })
  }, [adventureState, updateState, narratorComment])

  // === CAMP RESULT ===
  const handleCampResult = useCallback((result: ActivityResult) => {
    if (result.xpGain) addExperience(result.xpGain)
    if (result.karmaGain) earnNeutral(result.karmaGain, 'Camp activity')
    if (result.healthChange) {
      // Apply health change via Durability stat modification (positive = heal, negative = damage)
      modifyStat('Durability', result.healthChange > 0 ? 1 : -1)
    }
    if (result.statChange) {
      modifyStat(result.statChange.stat, result.statChange.amount)
    }
    if (result.reputationChange) {
      modifyReputation(result.reputationChange.faction, result.reputationChange.amount, 'Camp activity')
    }
    if (result.revealLocations && adventureState) {
      // Reveal random locations from next chapter
      const nextChapter = adventureState.chapter + 1
      const nextLocs = getChapterLocations(nextChapter)
      const undiscovered = nextLocs.filter(l => !adventureState.discoveredLocationIds.includes(l.id))
      const toReveal = undiscovered.slice(0, result.revealLocations).map(l => l.id)
      if (toReveal.length > 0) {
        updateState({
          discoveredLocationIds: [...adventureState.discoveredLocationIds, ...toReveal],
        })
      }
    }
  }, [addExperience, earnNeutral, modifyStat, modifyReputation, adventureState, updateState])

  // === CAMP COMPLETE ===
  const handleCampComplete = useCallback(() => {
    if (!adventureState) return
    const nextChapter = adventureState.chapter + 1
    const defaultLoc = getDefaultLocation(nextChapter)
    const nextLocs = getChapterLocations(nextChapter)
    const defaultDiscoveredIds = nextLocs.filter(l => l.discoveredByDefault).map(l => l.id)
    // Also discover connectedTo neighbors (fog-of-war fix)
    const neighborIds = new Set(defaultDiscoveredIds)
    for (const locId of defaultDiscoveredIds) {
      const loc = nextLocs.find(l => l.id === locId)
      if (loc) loc.connectedTo.forEach(id => neighborIds.add(id))
    }
    const defaultDiscovered = Array.from(neighborIds)

    updateState({
      chapter: nextChapter,
      currentLocationId: defaultLoc?.id ?? nextLocs[0]?.id ?? adventureState.currentLocationId,
      discoveredLocationIds: [
        ...adventureState.discoveredLocationIds,
        ...defaultDiscovered,
      ],
      visitedLocationIds: [...adventureState.visitedLocationIds, defaultLoc?.id ?? ''],
      phase: 'exploring',
    })
    setShowCamp(false)

    narratorComment(
      `Chapter ${nextChapter} begins. The road stretches on, indifferent to your hopes.`,
      'observation'
    )
  }, [adventureState, updateState, narratorComment])

  // === SKILL TREE ===
  const handleUnlockNode = useCallback((nodeId: string) => {
    if (!adventureState || adventureState.skillPoints <= 0) return
    updateState({
      unlockedSkillNodes: [...adventureState.unlockedSkillNodes, nodeId],
      skillPoints: adventureState.skillPoints - 1,
    })
  }, [adventureState, updateState])

  // === SAVE ===
  const handleSave = useCallback(() => {
    if (!adventureState) return
    const ok = saveAdventureState(adventureState)
    narratorComment(
      ok
        ? 'Progress saved. Not that it matters in the grand scheme of things.'
        : 'Save failed — your browser storage may be full or blocked. Try a cloud save.',
      ok ? 'sarcasm' : 'observation'
    )
  }, [adventureState, narratorComment])

  // === CLOUD SAVE/LOAD ===
  const [cloudModal, setCloudModal] = useState<{ mode: 'save' | 'load'; status: 'idle' | 'working' | 'success' | 'error' } | null>(null)
  const [hasCloudSaveFlag, setHasCloudSaveFlag] = useState(false)

  // Check for existing cloud save on mount
  useEffect(() => {
    const { id } = getPlayerIdentifier()
    hasCloudSave(id, 'adventure_save').then(result => {
      setHasCloudSaveFlag(result.exists)
    }).catch(() => {})
  }, [])

  const handleCloudSave = useCallback(() => {
    const cached = getCachedPassphrase()
    if (cached && adventureState) {
      // Use cached passphrase
      setCloudModal({ mode: 'save', status: 'working' })
      const { id } = getPlayerIdentifier()
      // Include character data alongside adventure state
      const cloudPayload = {
        ...adventureState,
        _character: charState.character ?? undefined,
      }
      saveToCloud(id, 'adventure_save', cloudPayload, cached).then(result => {
        setCloudModal({ mode: 'save', status: result.action === 'error' ? 'error' : 'success' })
        if (result.action !== 'error') {
          setHasCloudSaveFlag(true)
          narratorComment('Your journey echoes in the clouds now.', 'observation')
        }
      })
    } else {
      setCloudModal({ mode: 'save', status: 'idle' })
    }
  }, [adventureState, narratorComment, charState.character])

  const handleCloudLoad = useCallback(() => {
    const cached = getCachedPassphrase()
    if (cached) {
      setCloudModal({ mode: 'load', status: 'working' })
      const { id } = getPlayerIdentifier()
      loadFromCloud(id, 'adventure_save', cached).then(result => {
        if (result.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const raw = result.data as any
          // Extract character data if present (added in cloud save v2)
          const savedCharacter = raw._character
          const { _character, ...adventureFields } = raw
          const loaded = adventureFields as AdventureState
          const restored = {
            ...loaded,
            playStartTime: loaded.playStartTime || Date.now(),
            cluesAnswered: loaded.cluesAnswered ?? 0,
            welcomeRewardClaimed: loaded.welcomeRewardClaimed ?? false,
            confrontationsWon: loaded.confrontationsWon ?? 0,
            confrontationsLost: loaded.confrontationsLost ?? 0,
            recruitedAllies: loaded.recruitedAllies ?? [],
            dialogueFlags: loaded.dialogueFlags ?? [],
            questStates: loaded.questStates ?? {},
          }
          setAdventureState(restored)
          saveAdventureState(restored)
          // Restore character if it was included in the cloud save
          if (savedCharacter) {
            loadCharacter(savedCharacter)
          }
          setCloudModal({ mode: 'load', status: 'success' })
          narratorComment('The clouds have returned your story.', 'observation')
        } else {
          setCloudModal({ mode: 'load', status: 'error' })
        }
      })
    } else {
      setCloudModal({ mode: 'load', status: 'idle' })
    }
  }, [narratorComment, loadCharacter])

  const handlePassphraseSubmit = useCallback((passphrase: string) => {
    cachePassphrase(passphrase)
    if (cloudModal?.mode === 'save') {
      handleCloudSave()
    } else {
      handleCloudLoad()
    }
  }, [cloudModal, handleCloudSave, handleCloudLoad])

  // Build the journal entries from quests.ts + saved progress. For quests with
  // multiple paths we display the path the player has progressed furthest on
  // (or the completed one); 'available' quests show as rumors without
  // objective spoilers.
  const questLogEntries = useMemo((): QuestLogEntry[] => {
    if (!adventureState) return []
    const qs = adventureState.questStates ?? {}
    return QUESTS.filter(q => q.chapter <= adventureState.chapter).map(q => {
      // (cast: tsconfig has no noUncheckedIndexedAccess, so the bare index
      // would narrow `st` to always-defined and break the 'available' fallback)
      const st = qs[q.id] as QuestSaveState | undefined
      const completedIds = new Set(st?.completedObjectives ?? [])

      let path = q.paths[0]
      if (st?.completedPathId) {
        path = q.paths.find(p => p.id === st.completedPathId) ?? path
      } else if (st) {
        let best = -1
        for (const p of q.paths) {
          const done = p.objectives.filter(o => completedIds.has(o.id)).length
          const frac = done / Math.max(1, p.objectives.length)
          if (frac > best) { best = frac; path = p }
        }
      }

      const status: QuestStatus = st?.status ?? 'available'
      const giverLoc = getChapterLocation(q.giverLocation)
      const giverNpc = giverLoc?.npcs.find(n => n.id === q.giver)
      const description = status === 'available'
        ? `${q.description} (Rumored — ${giverNpc ? `seek out ${giverNpc.name}` : 'ask around'}${giverLoc ? ` at ${giverLoc.name}` : ''}.)`
        : q.description

      return {
        id: q.id,
        title: q.title,
        description,
        chapter: q.chapter,
        status,
        pathName: st
          ? (q.paths.length > 1 ? `${path.name} (one of ${q.paths.length} ways)` : path.name)
          : undefined,
        objectives: status === 'available'
          ? []
          : path.objectives.map(o => ({
              id: o.id,
              description: o.description,
              completed: completedIds.has(o.id),
              optional: o.optional,
            })),
        rewards: {
          xp: path.reward.xp,
          gold: path.reward.gold,
          reputation: path.reward.reputation
            ?.map(r => `${r.amount > 0 ? '+' : ''}${r.amount} ${r.faction}`)
            .join(', '),
        },
      }
    })
  }, [adventureState])

  // Check if chapter is completable (visited enough locations)
  const canCompleteChapter = useMemo(() => {
    if (!adventureState) return false
    const chapterLocs = getChapterLocations(adventureState.chapter)
    const visited = adventureState.visitedLocationIds.filter(
      id => chapterLocs.some(l => l.id === id)
    )
    return visited.length >= Math.ceil(chapterLocs.length * 0.6) // 60% of locations
  }, [adventureState])

  // Loading
  if (!adventureState) {
    return (
      <div className="min-h-screen bg-[var(--pixel-bg-dark)] flex items-center justify-center">
        <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)] animate-pulse">Loading adventure...</p>
      </div>
    )
  }

  const chapterLocs = getChapterLocations(adventureState.chapter)
  const currentLoc = getChapterLocation(adventureState.currentLocationId)

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)] crt-scanlines">
      <PixelNavigation />

      {/* Chapter Header */}
      <div className="bg-[var(--pixel-bg-mid)] border-b-4 border-[var(--pixel-ui-border)] px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div>
            <span className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)]">
              Chapter {adventureState.chapter}
            </span>
            <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] ml-3">
              {currentLoc?.icon} {currentLoc?.name ?? 'Unknown'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ReputationDisplay />
            {adventureState.recruitedAllies.length > 0 && (
              <div className="flex items-center gap-1" title={adventureState.recruitedAllies.map(a => a.enemyName).join(', ')}>
                {adventureState.recruitedAllies.map(ally => (
                  <span key={ally.enemyName} className="text-sm">{ally.icon}</span>
                ))}
                <span className="font-[var(--font-pixel)] text-[11px] text-purple-300">
                  {adventureState.recruitedAllies.length}/2
                </span>
              </div>
            )}
            {canCompleteChapter && adventureState.phase === 'exploring' && (
              <button
                onClick={handleCompleteChapter}
                className="font-[var(--font-pixel)] text-[12px] bg-[var(--pixel-gold-dark)] border border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)] px-3 py-1 hover:bg-[var(--pixel-gold-mid)] animate-pulse"
              >
                COMPLETE CHAPTER {'\u25B6'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="grid lg:grid-cols-4 gap-4">
          {/* Map/Location Area (3 cols) */}
          <div className="lg:col-span-3">
            {adventureState.phase === 'exploring' && (
              <div>
                {/* Map/Explore toggle */}
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => setExplorationMode(false)}
                    className={`font-[var(--font-pixel)] text-[12px] px-3 py-1 border transition-all ${
                      !explorationMode
                        ? 'bg-[var(--pixel-gold-dark)] border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)]'
                        : 'bg-[var(--pixel-bg-mid)] border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] hover:border-[var(--pixel-gold-dark)]'
                    }`}
                  >
                    MAP
                  </button>
                  <button
                    onClick={() => setExplorationMode(true)}
                    className={`font-[var(--font-pixel)] text-[12px] px-3 py-1 border transition-all ${
                      explorationMode
                        ? 'bg-[var(--pixel-gold-dark)] border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)]'
                        : 'bg-[var(--pixel-bg-mid)] border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] hover:border-[var(--pixel-gold-dark)]'
                    }`}
                  >
                    EXPLORE
                  </button>
                </div>

                {explorationMode && !pixiFailed ? (
                  <ExplorationMap
                    chapter={adventureState.chapter}
                    locations={getChapterLocations(adventureState.chapter).map(loc => ({
                      id: loc.id,
                      name: loc.name,
                      icon: loc.icon,
                      x: loc.x,
                      y: loc.y,
                      discovered: adventureState.discoveredLocationIds.includes(loc.id),
                      visited: adventureState.visitedLocationIds.includes(loc.id),
                      connectedTo: loc.connectedTo,
                      type: loc.atmosphere,
                    }))}
                    currentLocationId={adventureState.currentLocationId}
                    onArrive={handleTravelTo}
                    onEncounter={() => {
                      const encounter = rollTravelEncounter()
                      if (encounter) {
                        setTravelEncounter(encounter)
                        narratorComment('Hmm, the road between here and there is never as simple as a map suggests.', 'observation')
                        return true
                      }
                      const enemy = rollConfrontation(adventureState.chapter, adventureState.unlockedSkillNodes)
                      if (enemy) {
                        setActiveConfrontation(enemy)
                        narratorComment(enemy.description, 'observation')
                        return true
                      }
                      // Nothing materialized — let the player keep walking to arrival.
                      return false
                    }}
                    onError={() => {
                      // PixiJS/WebGL failed on this device — switch to the Canvas2D
                      // fallback so the map stays playable instead of stuck loading.
                      narratorComment('The shimmering map flickers and settles into a simpler form.', 'observation')
                      setPixiFailed(true)
                    }}
                    height={500}
                  />
                ) : explorationMode && pixiFailed ? (
                  <ExplorationMapCanvas
                    chapter={adventureState.chapter}
                    locations={getChapterLocations(adventureState.chapter).map(loc => ({
                      id: loc.id,
                      name: loc.name,
                      icon: loc.icon,
                      x: loc.x,
                      y: loc.y,
                      discovered: adventureState.discoveredLocationIds.includes(loc.id),
                      visited: adventureState.visitedLocationIds.includes(loc.id),
                      connectedTo: loc.connectedTo,
                      type: loc.atmosphere,
                    }))}
                    currentLocationId={adventureState.currentLocationId}
                    onArrive={handleTravelTo}
                    onEncounter={() => {
                      const encounter = rollTravelEncounter()
                      if (encounter) {
                        setTravelEncounter(encounter)
                        return true
                      }
                      return false
                    }}
                    height={500}
                  />
                ) : (
                  <ChapterMap
                    chapter={adventureState.chapter}
                    currentLocationId={adventureState.currentLocationId}
                    discoveredLocationIds={adventureState.discoveredLocationIds}
                    visitedLocationIds={adventureState.visitedLocationIds}
                    factionReps={factionReps}
                    onTravelTo={handleTravelTo}
                    onVisitLocation={handleVisitLocation}
                    onClickHint={(msg) => narratorComment(msg, 'observation')}
                  />
                )}
              </div>
            )}

            {adventureState.phase === 'at_location' && (
              <LocationView
                locationId={adventureState.currentLocationId}
                onReturnToMap={handleReturnToMap}
                onNPCTalk={handleNPCTalk}
                onSkillCheck={handleSkillCheck}
                onEarnKarma={handleEarnKarma}
                onSpendKarma={handleSpendKarma}
                onAddXP={handleAddXP}
                onClueAnswered={handleClueAnswered}
                onGameStateChanged={() => { if (adventureState) saveAdventureState(adventureState) }}
                playerStats={playerStats}
              />
            )}
          </div>

          {/* Sidebar (1 col) */}
          <div className="lg:col-span-1">
            <StatsSidebar
              stats={charState.character?.stats ?? {
                Shrewdness: 8, Agility: 8, Durability: 8,
                Diplomacy: 8, Luck: 8, Expertise: 8,
              }}
              level={charState.character?.level ?? 1}
              xp={adventureState.totalXP}
              chapter={adventureState.chapter}
              karma={balance.neutral}
              onOpenSkillTree={() => setShowSkillTree(true)}
              onOpenQuestLog={() => setShowQuestLog(true)}
              onSaveGame={handleSave}
              onCloudSave={handleCloudSave}
              onCloudLoad={handleCloudLoad}
              hasCloud={hasCloudSaveFlag}
              recruitedAllies={adventureState.recruitedAllies}
              onDismissAlly={handleDismissAlly}
            />
          </div>
        </div>
      </div>

      {/* Reward Tracker HUD */}
      {adventureState && (
        <AdventureRewardTracker
          locationsVisited={adventureState.visitedLocationIds.length}
          totalLocations={getChapterLocations(adventureState.chapter).length}
          chapter={adventureState.chapter}
          playTimeMinutes={Math.floor((nowMs - adventureState.playStartTime) / 60000)}
          cluesAnswered={adventureState.cluesAnswered}
          onUseHint={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
        />
      )}

      {/* Cloud Save Passphrase Modal */}
      {cloudModal && (
        <PassphraseModal
          mode={cloudModal.mode}
          status={cloudModal.status}
          onSubmit={handlePassphraseSubmit}
          onClose={() => setCloudModal(null)}
        />
      )}

      {/* Narrator Toast */}
      <NarratorToast />

      {/* Travel Encounter Overlay */}
      {travelEncounter && (
        <TravelEncounterOverlay
          encounter={travelEncounter}
          onResolve={handleEncounterResolved}
          playerStats={playerStats}
          onSkillCheck={handleSkillCheck}
          allies={adventureState?.recruitedAllies ?? []}
        />
      )}

      {/* Confrontation Overlay */}
      {activeConfrontation && charState.character && (
        <ConfrontationView
          enemy={activeConfrontation}
          playerName={charState.character.name}
          playerHealth={Math.max(20, 20 + (charState.character.stats.Durability - 8) * 5)}
          playerMaxHealth={Math.max(20, 20 + (charState.character.stats.Durability - 8) * 5)}
          playerStats={playerStats}
          playerGold={balance.neutral}
          currentChapter={adventureState?.chapter ?? 1}
          recruitedAllies={adventureState?.recruitedAllies ?? []}
          onEnd={handleConfrontationEnd}
          onSkillCheck={handleSkillCheck}
        />
      )}

      {/* Camp Management */}
      {showCamp && (
        <CampManagement
          chapter={adventureState.chapter}
          playerStats={playerStats}
          onSkillCheck={handleSkillCheck}
          onApplyResult={handleCampResult}
          onComplete={handleCampComplete}
        />
      )}

      {/* Authored NPC Dialogue (Fallout-style tree) */}
      {activeDialogue && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => {
            if (Date.now() - dialogueOpenedAtRef.current < 400) return
            setActiveDialogue(null)
          }}
        >
          <div className="w-full max-w-2xl my-auto" onClick={e => e.stopPropagation()}>
            <DialogueView
              npcName={activeDialogue.npc.name}
              npcIcon={WITNESS_ICONS[activeDialogue.npc.witnessType] ?? WITNESS_ICONS.default}
              npcRole={activeDialogue.npc.role}
              nodes={activeDialogue.dialogue.nodes}
              playerStats={playerStats}
              onClose={() => setActiveDialogue(null)}
              onEffect={applyDialogueEffects}
              onSkillCheck={handleSkillCheck}
            />
          </div>
        </div>
      )}

      {/* Quest Journal */}
      {showQuestLog && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowQuestLog(false)}
        >
          <div className="w-full max-w-2xl my-auto" onClick={e => e.stopPropagation()}>
            <QuestLog
              quests={questLogEntries}
              onClose={() => setShowQuestLog(false)}
            />
          </div>
        </div>
      )}

      {/* Skill Tree */}
      {showSkillTree && (
        <SkillTree
          unlockedNodes={adventureState.unlockedSkillNodes}
          playerLevel={charState.character?.level ?? 1}
          skillPoints={adventureState.skillPoints}
          onUnlockNode={handleUnlockNode}
          onClose={() => setShowSkillTree(false)}
        />
      )}

      {/* Companion Bar (Fallout-style) */}
      {adventureState.recruitedAllies.length > 0 &&
        (adventureState.phase === 'exploring' || adventureState.phase === 'at_location') && (
        <CompanionBar
          allies={adventureState.recruitedAllies}
          context={
            (adventureState.phase === 'at_location' ? 'discovery' : 'idle') as DialogueContext
          }
        />
      )}

      {/* Cynthia Ending — chapter 5 complete. Full-screen takeover above all
          other HUD layers (reward tracker modal is z-[100]). */}
      {showClueGameUnlock && (
        <div className="fixed inset-0 z-[110] bg-[var(--pixel-bg-dark)] overflow-y-auto p-4 flex items-center justify-center">
          <div className="w-full max-w-5xl">
            <ClueGameUnlock
              karmaAlignment={getKarmaAlignment()}
              chaptersCompleted={5}
              playerName={charState.character?.name ?? 'Traveler'}
              onClose={() => router.push('/game')}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// PAGE — WRAPPED IN PROVIDERS
// ============================================

export default function PlayPage() {
  return (
    <KarmaWalletProvider>
      <CharacterProvider>
        <ReputationProvider>
          <NarratorProvider>
            <MysteryProvider>
              <NPCProvider>
                <AdventureContent />
              </NPCProvider>
            </MysteryProvider>
          </NarratorProvider>
        </ReputationProvider>
      </CharacterProvider>
    </KarmaWalletProvider>
  )
}
