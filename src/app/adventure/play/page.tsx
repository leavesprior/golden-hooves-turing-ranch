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
import { CrossGameStorage } from '@/lib/crossGameProgression'
import { saveToCloud, loadFromCloud, hasCloudSave, cachePassphrase, getCachedPassphrase, getDeviceId } from '@/lib/cloudSave'
import { getPlayerIdentifier } from '@/lib/trophyStateCollector'

// Adventure Components
import { ChapterMap } from '@/components/adventure/ChapterMap'
import { LocationView } from '@/components/adventure/LocationView'
import { CampManagement } from '@/components/adventure/CampManagement'
import { CampScreen } from '@/app/adventure/components/CampScreen'
import { DifficultyDial } from '@/app/adventure/components/DifficultyDial'
import { SkillCheckPreviewChip } from '@/app/adventure/components/SkillCheckPreview'
import { SkillTree } from '@/components/adventure/SkillTree'
import AdventureRewardTracker from '@/components/adventure/AdventureRewardTracker'

// Difficulty tier (Story/Explorer/Challenger)
import {
  DIFFICULTY_DEFAULT,
  applyDifficultyToDC,
  getSkillCheckPreview,
  loadDifficulty,
  saveDifficulty,
  type GameDifficulty,
} from '@/app/adventure/lib/difficulty'

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
import { ConfrontationView, type ConfrontationResult } from '@/components/adventure/ConfrontationView'
import { type RecruitedAlly, updateAllyDurations, getAllyStatBonuses, rollAllyAbility } from '@/app/adventure/data/enemyRecruitment'
import { CompanionBar } from '@/components/adventure/CompanionBar'
import type { DialogueContext } from '@/app/adventure/data/companionDialogues'

// Phase 2 of Golden Frog Codex: wire orphaned quests + dialogue trees.
import { DialogueView } from '@/components/adventure/DialogueView'
import { QuestLog } from '@/components/adventure/QuestLog'
import { adaptDialogue } from '@/app/adventure/lib/dialogueAdapter'
import {
  getDialoguesForNpc,
  type Dialogue as OrphanDialogue,
} from '@/app/adventure/data/dialogues'
import {
  getQuestById,
  type Quest as OrphanQuest,
  type QuestReward,
} from '@/app/adventure/data/quests'
import {
  acceptQuest,
  advanceQuestObjective,
  adaptQuestsForLogGated,
  autoTickChoice,
  autoTickClue,
  autoTickItem,
  autoTickTravel,
  commitQuestPath,
  findOfferableQuestForNpcGated,
  type QuestSaveEntry,
  type QuestTickResult,
} from '@/app/adventure/lib/questAdapter'

// ============================================
// ADVENTURE STATE
// ============================================

type AdventurePhase = 'loading' | 'exploring' | 'at_location' | 'traveling' | 'camp' | 'chapter_complete'

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
  // Difficulty tier — Story/Explorer/Challenger. Adjustable any time, no
  // penalty. Adjusts DC by multiplier (0.8/1.0/1.2) everywhere checks roll.
  gameDifficulty: GameDifficulty
  // Phase 2 — orphan quest + dialogue tree integration. Persisted in the
  // same save blob as everything else so cloud-load + localStorage stays
  // consistent. Legacy saves without these fields migrate to empty lists.
  questEntries: QuestSaveEntry[]
  questFlags: string[]
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
      playStartTime: parsed.playStartTime || Date.now(),
      cluesAnswered: parsed.cluesAnswered ?? 0,
      welcomeRewardClaimed: parsed.welcomeRewardClaimed ?? false,
      confrontationsWon: parsed.confrontationsWon ?? 0,
      confrontationsLost: parsed.confrontationsLost ?? 0,
      recruitedAllies: parsed.recruitedAllies ?? [],
      gameDifficulty: parsed.gameDifficulty ?? loadDifficulty(),
      questEntries: parsed.questEntries ?? [],
      questFlags: parsed.questFlags ?? [],
    }
  } catch {
    return null
  }
}

function saveAdventureState(state: AdventureState) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SAVE_KEY, JSON.stringify(state))
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
    gameDifficulty: loadDifficulty(),
    questEntries: [],
    questFlags: [],
  }
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
  difficulty,
}: {
  encounter: TravelEncounter
  onResolve: (success: boolean, allyBonus?: { xp: number; gold: number; description: string }) => void
  playerStats: Record<StatName, number>
  onSkillCheck: (stat: StatName, difficulty: number) => { success: boolean }
  allies: RecruitedAlly[]
  difficulty: GameDifficulty
}) {
  const preview = getSkillCheckPreview(
    playerStats[encounter.stat] ?? 0,
    encounter.difficulty,
    difficulty,
  )
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
        <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] mb-4 text-center">
          {encounter.description}
        </p>

        {!resolved ? (
          <div className="text-center">
            <div className="mb-3 flex justify-center">
              <SkillCheckPreviewChip
                stat={encounter.stat}
                statValue={playerStats[encounter.stat] ?? 0}
                preview={preview}
              />
            </div>
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
                <p className="font-[var(--font-pixel)] text-[9px] text-purple-300">
                  {'\u2728'} {allyTrigger.description}
                </p>
              </div>
            )}
            <p className={`font-[var(--font-pixel)] text-[10px] mb-2 ${
              success ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-orange)]'
            }`}>
              {success ? 'SUCCESS!' : 'FAILED'}
            </p>
            <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] mb-2">
              {success ? encounter.successText : encounter.failureText}
            </p>
            {encounter.xpReward > 0 && (
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)]">
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
            <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] mb-3">
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
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-fire-orange)] mb-2">Passphrases don&apos;t match</p>
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
  onOpenSkillTree,
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
  onOpenSkillTree: () => void
  onSaveGame: () => void
  onCloudSave: () => void
  onCloudLoad: () => void
  hasCloud: boolean
  recruitedAllies: RecruitedAlly[]
  onDismissAlly: (enemyName: string) => void
}) {
  return (
    <div className="space-y-3">
      {/* Character Stats */}
      <PixelCard title="S.A.D.D.L.E.">
        <div className="space-y-1">
          {(Object.entries(stats) as [StatName, number][]).map(([stat, value]) => (
            <div key={stat} className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-xs">{STAT_DISPLAY[stat].icon}</span>
                <span className="font-[var(--font-pixel)] text-[9px]" style={{ color: STAT_DISPLAY[stat].color }}>
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
            <span className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)]">Level</span>
            <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)]">{level}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)]">XP</span>
            <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">{xp}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)]">Chapter</span>
            <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">{chapter}/5</span>
          </div>
        </div>
      </PixelCard>

      {/* Recruited Allies */}
      {recruitedAllies.length > 0 && (
        <PixelCard title={`ALLIES (${recruitedAllies.length}/2)`}>
          <div className="space-y-2">
            {recruitedAllies.map(ally => (
              <div key={ally.enemyName} className="p-2 bg-[var(--pixel-bg-dark)] border border-[var(--pixel-ui-border)] rounded">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{ally.icon}</span>
                    <span className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-gold-light)]">
                      {ally.enemyName}
                    </span>
                  </div>
                  <button
                    onClick={() => onDismissAlly(ally.enemyName)}
                    className="text-[8px] text-red-400 hover:text-red-300 font-[var(--font-pixel)]"
                    title="Dismiss ally"
                  >
                    {'\u2715'}
                  </button>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs">{STAT_DISPLAY[ally.bonusStat]?.icon ?? ''}</span>
                  <span className="font-[var(--font-pixel)] text-[8px]" style={{ color: STAT_DISPLAY[ally.bonusStat]?.color ?? '#ccc' }}>
                    +{ally.bonusAmount} {ally.bonusStat}
                  </span>
                </div>
                <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-70 mb-1">
                  {ally.passiveEffect}
                </p>
                {ally.specialAbility && (
                  <div className="flex items-center gap-1">
                    <span className="text-[8px]">{'\u2728'}</span>
                    <span className="font-[var(--font-pixel)] text-[7px] text-purple-300">
                      {ally.specialAbility.name}
                    </span>
                  </div>
                )}
                <div className="mt-1 flex justify-between items-center">
                  <span className="font-[var(--font-pixel)] text-[7px] text-amber-400">
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
          <span className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)] shrink-0">
            NARRATOR:
          </span>
          <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] italic">
            "{comment.text}"
          </p>
        </div>
        {comment.isLie && (
          <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-fire-orange)] mt-1 opacity-50">
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
            <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-60">
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
  const {
    balance,
    earnNeutral,
    spendNeutral,
    recordLawfulAction,
    recordChaoticAction,
    recordGoodAction,
    recordEvilAction,
  } = useKarmaWallet()
  const { state: repState, modifyReputation, getReputationLevel, getReputation } = useReputation()
  const { comment: narratorComment } = useNarrator()

  const [adventureState, setAdventureState] = useState<AdventureState | null>(null)
  const [showSkillTree, setShowSkillTree] = useState(false)
  const [travelEncounter, setTravelEncounter] = useState<TravelEncounter | null>(null)
  const [travelDestination, setTravelDestination] = useState<string | null>(null)
  const [showCamp, setShowCamp] = useState(false)
  const [activeConfrontation, setActiveConfrontation] = useState<ConfrontationEnemy | null>(null)
  const [explorationMode, setExplorationMode] = useState(true)
  const [pixiFailed, setPixiFailed] = useState(false)

  // Phase 2 — Active dialogue tree from orphan `dialogues.ts`. Null when
  // no NPC conversation is open. We keep the raw orphan Dialogue around so
  // the effect bridge can look up side-effects (unlockLocation, quest
  // objective ids) that the DialogueView's narrower effects shape elides.
  const [activeDialogue, setActiveDialogue] = useState<{
    orphan: OrphanDialogue
    npc: LocationNPC
  } | null>(null)
  const [showQuestLog, setShowQuestLog] = useState(false)
  // Phase 2.5 — forward-declared ref to applyQuestTick so handlers that are
  // declared BEFORE applyQuestTick (handleTravelTo, handleVisitLocation)
  // can still call the latest definition via ref.current. Assigned in a
  // useEffect below once applyQuestTick is defined.
  const applyQuestTickRef = useRef<((tick: QuestTickResult, source: string) => void) | null>(null)
  // Quest-offer modal: shown when a dialogue triggers `questStart` on a
  // multi-path quest so the player can pick a branch (lawful, diplomatic,
  // pragmatic, etc.) before the quest leaves the "available" slot.
  const [questOffer, setQuestOffer] = useState<OrphanQuest | null>(null)

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

  // Auto-save periodically (enriched with character info for leaderboard/trophy)
  useEffect(() => {
    if (!adventureState) return
    const interval = setInterval(() => {
      const enriched = { ...adventureState } as AdventureState & { level?: number; playerName?: string }
      if (charState.character) {
        enriched.level = charState.character.level ?? 1
        enriched.playerName = charState.character.name ?? 'Unknown'
      }
      saveAdventureState(enriched as AdventureState)
    }, 30000)
    return () => clearInterval(interval)
  }, [adventureState, charState.character])

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
    setAdventureState(prev => {
      if (!prev) return prev
      const next = { ...prev, ...updates }
      saveAdventureState(next)
      return next
    })
  }, [])

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

  // === TRAVEL ===
  const handleTravelTo = useCallback((locationId: string) => {
    if (!adventureState) return

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

    // Phase 2.5 — auto-tick any active-quest `travel` objectives whose
    // target matches this location. Idempotent; no-op if none match.
    // Uses ref for forward-declaration: applyQuestTick is defined later
    // in the component but we need it here in a pre-declared callback.
    const travelTick = autoTickTravel(locationId, {
      questEntries: adventureState.questEntries,
      questFlags: adventureState.questFlags,
    })
    applyQuestTickRef.current?.(travelTick, 'travel')

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
  }, [adventureState, updateState, narratorComment])

  // Resolve travel encounter
  const handleEncounterResolved = useCallback((success: boolean, allyBonus?: { xp: number; gold: number; description: string }) => {
    if (!travelEncounter || !travelDestination) return

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

    // Continue to destination
    setTravelEncounter(null)
    const destId = travelDestination
    setTravelDestination(null)
    handleTravelTo(destId)
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

    // Continue travel to destination
    setActiveConfrontation(null)
    if (travelDestination) {
      const destId = travelDestination
      setTravelDestination(null)
      handleTravelTo(destId)
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
    // Phase 2.5 — same auto-tick as handleTravelTo: arriving at a specific
    // location tile counts as a travel event for quest objectives. Ref
    // pattern dodges the forward-declaration of applyQuestTick.
    if (adventureState) {
      const tick = autoTickTravel(locationId, {
        questEntries: adventureState.questEntries,
        questFlags: adventureState.questFlags,
      })
      applyQuestTickRef.current?.(tick, 'travel')
    }
  }, [updateState, adventureState])

  const handleReturnToMap = useCallback(() => {
    updateState({ phase: 'exploring' })
  }, [updateState])

  // === NPC TALK (Phase 2: branching dialogue trees) ===
  // If the NPC has an orphan Dialogue in `dialogues.ts`, we open the
  // branching tree view. Otherwise, fall back to the legacy one-liner +
  // skill-check path so NPCs without a written tree still function.
  const handleNPCTalk = useCallback((npc: LocationNPC) => {
    const trees = getDialoguesForNpc(npc.id)
    if (trees.length > 0) {
      // Pick the first matching tree whose trigger condition is met.
      // Most NPCs have exactly one tree; chapters 4-5 can have a second.
      const flags = new Set(adventureState?.questFlags ?? [])
      const tree =
        trees.find(t => {
          const cond = t.triggerCondition
          if (!cond) return true
          if (cond.flag && !flags.has(cond.flag)) return false
          return true
        }) ?? trees[0]
      setActiveDialogue({ orphan: tree, npc })
      return
    }

    // Legacy fallback — preserve existing behavior for NPCs without a
    // rich dialogue tree yet. Kept verbatim so audited-NPC behavior does
    // not silently shift underneath the player.
    if (npc.skillCheckStat && npc.skillCheckDC) {
      const effectiveDC = applyDifficultyToDC(
        npc.skillCheckDC,
        adventureState?.gameDifficulty ?? DIFFICULTY_DEFAULT,
      )
      const result = rollSkillCheck(npc.skillCheckStat, effectiveDC)
      if (result.success) {
        addExperience(15)
        narratorComment(
          `${npc.name} seems to warm up to you. Information flows freely.`,
          'observation'
        )
        if (npc.faction) {
          modifyReputation(npc.faction, 3, `Talked with ${npc.name}`)
        }
      } else {
        addExperience(5)
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
  }, [adventureState?.questFlags, adventureState?.gameDifficulty, rollSkillCheck, addExperience, narratorComment, modifyReputation])

  // === APPLY QUEST REWARDS (shared by dialogue-triggered completions and
  //     skill-check-triggered completions in the quest log) ===
  const applyQuestReward = useCallback((reward: QuestReward) => {
    if (reward.xp) addExperience(reward.xp)
    if (reward.gold) earnNeutral(reward.gold, 'Quest reward')
    if (reward.karma?.lawful) {
      if (reward.karma.lawful > 0) recordLawfulAction(Math.abs(reward.karma.lawful))
      else recordChaoticAction(Math.abs(reward.karma.lawful))
    }
    if (reward.karma?.good) {
      if (reward.karma.good > 0) recordGoodAction(Math.abs(reward.karma.good))
      else recordEvilAction(Math.abs(reward.karma.good))
    }
    if (reward.reputation) {
      for (const r of reward.reputation) {
        modifyReputation(r.faction, r.amount, 'Quest reward')
      }
    }
    if (reward.setFlag) {
      setAdventureState(prev => {
        if (!prev) return prev
        if (prev.questFlags.includes(reward.setFlag!)) return prev
        const next = { ...prev, questFlags: [...prev.questFlags, reward.setFlag!] }
        saveAdventureState(next)
        return next
      })
    }
  }, [addExperience, earnNeutral, recordLawfulAction, recordChaoticAction, recordGoodAction, recordEvilAction, modifyReputation])

  // === APPLY QUEST TICK (Phase 2.5) ===
  // Merges a QuestTickResult into adventure state and fires rewards for any
  // quests that just transitioned to `completed`. Idempotent — the tick
  // helpers gate on "already ticked" so calling this during re-renders is
  // safe. `source` is a short tag ("travel", "item", "clue", "choice") used
  // only in the narrator toast so the player sees what advanced.
  const applyQuestTick = useCallback((tick: QuestTickResult, source: string) => {
    setAdventureState(prev => {
      if (!prev) return prev
      // Skip if nothing actually changed — keeps us idempotent and avoids
      // a needless save write on every at_location transition.
      const unchanged =
        prev.questEntries.length === tick.entries.length &&
        prev.questEntries.every((e, i) => {
          const n = tick.entries[i]
          return (
            n &&
            n.completedObjectiveIds.length === e.completedObjectiveIds.length &&
            n.status === e.status &&
            n.activePathId === e.activePathId
          )
        })
      if (unchanged) return prev
      const next = { ...prev, questEntries: tick.entries }
      saveAdventureState(next)
      return next
    })
    for (const { quest, path } of tick.justCompleted) {
      // Defer so the state commit settles before rewards/reputation fire.
      setTimeout(() => applyQuestReward(path.reward), 0)
      narratorComment(
        `Quest complete: ${quest.title} (${source})`,
        'observation',
      )
    }
  }, [applyQuestReward, narratorComment])

  // Phase 2.5 — publish the latest applyQuestTick closure to the ref so
  // forward-declared handlers (handleTravelTo/handleVisitLocation) always
  // call the current version with fresh dependencies.
  useEffect(() => {
    applyQuestTickRef.current = applyQuestTick
  }, [applyQuestTick])

  // === DIALOGUE EFFECT BRIDGE ===
  // The DialogueView carries a narrow effects shape. Here we translate it
  // into the broader game-state mutations — karma alignment, reputation,
  // flags, quest triggers. Lawful/good karma use the D&D alignment axes
  // rather than the neutral-karma wallet, matching the orphan design.
  const handleDialogueEffect = useCallback((
    effects: Parameters<React.ComponentProps<typeof DialogueView>['onEffect']>[0],
  ) => {
    if (!effects) return
    if (effects.xp) addExperience(effects.xp)
    if (effects.gold !== undefined) {
      if (effects.gold > 0) {
        earnNeutral(effects.gold, 'Dialogue reward')
      } else if (effects.gold < 0) {
        // Best-effort — if not enough karma, the spend is dropped but the
        // dialogue continues. This matches the Phase 1 rule: never make
        // the player feel stupid. An insufficient-funds UI is future work.
        spendNeutral(-effects.gold, 'Dialogue cost')
      }
    }
    if (effects.karma?.lawful) {
      if (effects.karma.lawful > 0) recordLawfulAction(Math.abs(effects.karma.lawful))
      else recordChaoticAction(Math.abs(effects.karma.lawful))
    }
    if (effects.karma?.good) {
      if (effects.karma.good > 0) recordGoodAction(Math.abs(effects.karma.good))
      else recordEvilAction(Math.abs(effects.karma.good))
    }
    if (effects.reputation) {
      modifyReputation(
        effects.reputation.faction as FactionId,
        effects.reputation.amount,
        'Dialogue outcome',
      )
    }
    if (effects.setFlag) {
      setAdventureState(prev => {
        if (!prev) return prev
        if (prev.questFlags.includes(effects.setFlag!)) return prev
        const next = { ...prev, questFlags: [...prev.questFlags, effects.setFlag!] }
        saveAdventureState(next)
        return next
      })
    }
    if (effects.questStart) {
      const quest = getQuestById(effects.questStart)
      if (quest) {
        setAdventureState(prev => {
          if (!prev) return prev
          const next = { ...prev, questEntries: acceptQuest(prev.questEntries, quest.id) }
          saveAdventureState(next)
          return next
        })
        // If the quest has multiple paths, surface the path-picker so the
        // player explicitly commits (removes the "which path am I on?"
        // confusion noted in the Phase 1 audit).
        if (quest.paths.length > 1) {
          setQuestOffer(quest)
        } else if (quest.paths.length === 1) {
          setAdventureState(prev => {
            if (!prev) return prev
            const next = {
              ...prev,
              questEntries: commitQuestPath(prev.questEntries, quest.id, quest.paths[0].id),
            }
            saveAdventureState(next)
            return next
          })
        }
        narratorComment(`New quest: ${quest.title}`, 'observation')
      }
    }
    if (effects.questAdvance) {
      setAdventureState(prev => {
        if (!prev) return prev
        const entry = prev.questEntries.find(e => e.questId === effects.questAdvance)
        if (!entry || !entry.activePathId) return prev
        const quest = getQuestById(entry.questId)
        const path = quest?.paths.find(p => p.id === entry.activePathId)
        // Advance the first incomplete objective on the path. The orphan
        // effect shape doesn't carry an objectiveId; this matches the
        // design intent that each `questProgress` tick = next step.
        const nextObj = path?.objectives.find(
          o => !entry.completedObjectiveIds.includes(o.id),
        )
        if (!nextObj) return prev
        const { entry: advanced, justCompleted } = advanceQuestObjective(entry, nextObj.id)
        const nextEntries = prev.questEntries.map(e =>
          e.questId === entry.questId ? advanced : e,
        )
        const next = { ...prev, questEntries: nextEntries }
        saveAdventureState(next)
        // Fire quest rewards on completion
        if (justCompleted && path) {
          setTimeout(() => applyQuestReward(path.reward), 0)
          narratorComment(`Quest complete: ${quest?.title ?? entry.questId}`, 'observation')
        }
        return next
      })
    }
    // Phase 2.5 — auto-tick item/choice objectives when the dialogue
    // explicitly grants an item or marks a registered choice. These run
    // AFTER questStart/questAdvance so a dialogue can both kick off a
    // quest and immediately tick its first item objective.
    if (effects.giveItem) {
      setAdventureState(prev => {
        if (!prev) return prev
        const tick = autoTickItem(effects.giveItem!, {
          questEntries: prev.questEntries,
          questFlags: prev.questFlags,
        })
        for (const { quest, path } of tick.justCompleted) {
          setTimeout(() => applyQuestReward(path.reward), 0)
          narratorComment(`Quest complete: ${quest.title} (item)`, 'observation')
        }
        const next = { ...prev, questEntries: tick.entries }
        saveAdventureState(next)
        return next
      })
    }
    if (effects.markChoice) {
      setAdventureState(prev => {
        if (!prev) return prev
        const tick = autoTickChoice(effects.markChoice!, {
          questEntries: prev.questEntries,
          questFlags: prev.questFlags,
        })
        for (const { quest, path } of tick.justCompleted) {
          setTimeout(() => applyQuestReward(path.reward), 0)
          narratorComment(`Quest complete: ${quest.title} (choice)`, 'observation')
        }
        const next = { ...prev, questEntries: tick.entries }
        saveAdventureState(next)
        return next
      })
    }
  }, [addExperience, earnNeutral, spendNeutral, recordLawfulAction, recordChaoticAction, recordGoodAction, recordEvilAction, modifyReputation, narratorComment, applyQuestReward])

  // === QUEST PATH COMMIT ===
  const handleCommitQuestPath = useCallback((pathId: string) => {
    if (!questOffer) return
    setAdventureState(prev => {
      if (!prev) return prev
      const next = { ...prev, questEntries: commitQuestPath(prev.questEntries, questOffer.id, pathId) }
      saveAdventureState(next)
      return next
    })
    const path = questOffer.paths.find(p => p.id === pathId)
    if (path) {
      narratorComment(`Path chosen: ${path.name}`, 'observation')
    }
    setQuestOffer(null)
  }, [questOffer, narratorComment])

  // === DIALOGUE CLOSE ===
  const handleDialogueClose = useCallback(() => {
    // If the NPC has an offerable quest we haven't surfaced yet, show the
    // path-picker now. Prerequisite-gated: quests whose questId/flag/rep
    // prereqs aren't met are hidden (Phase 2.5 — avoids teasing content
    // the player can't take yet).
    if (activeDialogue && adventureState) {
      const flags = new Set(adventureState.questFlags)
      const reps = repState.reputations as Partial<Record<FactionId, number>>
      const offerable = findOfferableQuestForNpcGated(
        activeDialogue.npc.id,
        adventureState.questEntries,
        flags,
        reps,
      )
      if (offerable && offerable.paths.length > 1) {
        setQuestOffer(offerable)
      }
    }
    setActiveDialogue(null)
  }, [activeDialogue, adventureState, repState.reputations])

  // === SKILL CHECK WRAPPER ===
  // Applies the Story/Explorer/Challenger multiplier to the raw DC before
  // the d20 roll. Callers (LocationView, CampScreen, ConfrontationView,
  // DialogueView, travel encounters) pass the design-intent DC; this is
  // the single choke-point where difficulty actually lands on the math.
  const handleSkillCheck = useCallback((stat: StatName, difficulty: number) => {
    const tier = adventureState?.gameDifficulty ?? DIFFICULTY_DEFAULT
    const effectiveDC = applyDifficultyToDC(difficulty, tier)
    return rollSkillCheck(stat, effectiveDC)
  }, [rollSkillCheck, adventureState?.gameDifficulty])

  // === CHANGE DIFFICULTY ===
  // Persist both to the top-level localStorage key (so the dial reflects
  // player preference across fresh saves) and to the active adventure state.
  const handleChangeDifficulty = useCallback((next: GameDifficulty) => {
    saveDifficulty(next)
    setAdventureState(prev => {
      if (!prev) return prev
      const updated = { ...prev, gameDifficulty: next }
      saveAdventureState(updated)
      return updated
    })
  }, [])

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

  // === XP ===
  const handleAddXP = useCallback((amount: number) => {
    addExperience(amount)
    setAdventureState(prev => {
      if (!prev) return prev
      const newTotalXP = prev.totalXP + amount
      // Award 1 skill point every 100 XP
      const oldLevel = Math.floor(prev.totalXP / 100)
      const newLevel = Math.floor(newTotalXP / 100)
      const skillPointsEarned = newLevel - oldLevel
      const next = {
        ...prev,
        totalXP: newTotalXP,
        skillPoints: prev.skillPoints + skillPointsEarned,
      }
      saveAdventureState(next)
      return next
    })
  }, [addExperience])

  // === CLUE ANSWERED ===
  const handleClueAnswered = useCallback((clue: import('@/app/adventure/data/chapterLocations').DiscoveryClue, correct: boolean) => {
    if (correct) {
      setAdventureState(prev => {
        if (!prev) return prev
        const next = { ...prev, cluesAnswered: prev.cluesAnswered + 1 }
        saveAdventureState(next)
        return next
      })
      narratorComment('Knowledge is its own reward. Well, that and the XP.', 'fourth_wall')
      // Phase 2.5 — auto-tick any `clue` objectives whose target matches
      // the clue id. Uses the latest adventureState snapshot; the tick is
      // idempotent so racing with the cluesAnswered setter above is safe.
      if (adventureState) {
        const tick = autoTickClue(clue.id, {
          questEntries: adventureState.questEntries,
          questFlags: adventureState.questFlags,
        })
        applyQuestTick(tick, 'clue')
      }
    }
  }, [narratorComment, adventureState, applyQuestTick])

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
      // Game complete
      narratorComment('And so the story ends. Or does it? Check the ranch for the real treasure.', 'fourth_wall')
      router.push('/game')
      return
    }
    // Show camp management
    setShowCamp(true)
    updateState({ phase: 'camp' })
  }, [adventureState, updateState, narratorComment, router])

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
    if (adventureState) saveAdventureState(adventureState)
    narratorComment('Progress saved. Not that it matters in the grand scheme of things.', 'sarcasm')
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
            gameDifficulty: loaded.gameDifficulty ?? loadDifficulty(),
            questEntries: loaded.questEntries ?? [],
            questFlags: loaded.questFlags ?? [],
          }
          setAdventureState(restored)
          saveAdventureState(restored)
          // Mirror difficulty into its own key so the dial reflects the cloud
          // load immediately, even if the player resets adventure state later.
          saveDifficulty(restored.gameDifficulty)
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
          <div className="flex items-center gap-4 flex-wrap">
            <DifficultyDial
              value={adventureState.gameDifficulty}
              onChange={handleChangeDifficulty}
              compact
            />
            {/* Phase 2: Quest Log access. Sits beside the difficulty dial so
                the "where do I stand?" signal is always one click away,
                killing the YELLOW confusion point from the Phase 1 audit. */}
            <button
              onClick={() => setShowQuestLog(true)}
              className="font-[var(--font-pixel)] text-[9px] bg-[var(--pixel-bg-dark)] border border-[var(--pixel-ui-border)] text-[var(--pixel-gold-light)] px-3 py-1 hover:border-[var(--pixel-gold-mid)] transition-all"
              title="Quest Log"
            >
              {'📜'} QUESTS ({adventureState.questEntries.filter(e => e.status === 'active').length})
            </button>
            <ReputationDisplay />
            {adventureState.recruitedAllies.length > 0 && (
              <div className="flex items-center gap-1" title={adventureState.recruitedAllies.map(a => a.enemyName).join(', ')}>
                {adventureState.recruitedAllies.map(ally => (
                  <span key={ally.enemyName} className="text-sm">{ally.icon}</span>
                ))}
                <span className="font-[var(--font-pixel)] text-[8px] text-purple-300">
                  {adventureState.recruitedAllies.length}/2
                </span>
              </div>
            )}
            {canCompleteChapter && adventureState.phase === 'exploring' && (
              <button
                onClick={handleCompleteChapter}
                className="font-[var(--font-pixel)] text-[9px] bg-[var(--pixel-gold-dark)] border border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)] px-3 py-1 hover:bg-[var(--pixel-gold-mid)] animate-pulse"
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
                    className={`font-[var(--font-pixel)] text-[9px] px-3 py-1 border transition-all ${
                      !explorationMode
                        ? 'bg-[var(--pixel-gold-dark)] border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)]'
                        : 'bg-[var(--pixel-bg-mid)] border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] hover:border-[var(--pixel-gold-dark)]'
                    }`}
                  >
                    MAP
                  </button>
                  <button
                    onClick={() => setExplorationMode(true)}
                    className={`font-[var(--font-pixel)] text-[9px] px-3 py-1 border transition-all ${
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
                      } else {
                        const enemy = rollConfrontation(adventureState.chapter, adventureState.unlockedSkillNodes)
                        if (enemy) {
                          setActiveConfrontation(enemy)
                          narratorComment(enemy.description, 'observation')
                        }
                      }
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
                      }
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
                gameDifficulty={adventureState.gameDifficulty}
              />
            )}

            {adventureState.phase === 'camp' && (
              <CampScreen
                chapter={adventureState.chapter}
                playerStats={playerStats}
                onSkillCheck={handleSkillCheck}
                onApplyResult={handleCampResult}
                onLeaveCamp={handleCampComplete}
                gameDifficulty={adventureState.gameDifficulty}
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
              onOpenSkillTree={() => setShowSkillTree(true)}
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
          playTimeMinutes={Math.floor((Date.now() - adventureState.playStartTime) / 60000)}
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
          difficulty={adventureState?.gameDifficulty ?? DIFFICULTY_DEFAULT}
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
          gameDifficulty={adventureState?.gameDifficulty ?? DIFFICULTY_DEFAULT}
        />
      )}

      {/* Camp Management modal replaced by inline CampScreen rendered in the
          main content column when phase==='camp'. CampManagement import
          retained for now so the legacy component doesn't bitrot before the
          facelift merge. */}

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

      {/* Phase 2: Dialogue Tree Overlay.
          Opens when handleNPCTalk finds an orphan Dialogue for the NPC.
          The adapter normalises the orphan shape into the DialogueView's
          narrower types; side-effects (flags, quest triggers) flow through
          handleDialogueEffect into game state. */}
      {activeDialogue && (() => {
        const adapted = adaptDialogue(activeDialogue.orphan)
        // Resolve an icon for the NPC from their witnessType (shop-style
        // emoji). Falls back to a generic speech bubble.
        const iconMap: Record<string, string> = {
          bartender: '🍺',
          sheriff: '⭐',
          settler: '👨‍🌾',
          miner: '⛏️',
          native: '🏹',
          outlaw: '🔫',
          merchant: '🛒',
          doctor: '🩺',
          preacher: '⛪',
          // Phase 2.5 — ethereal shells. Distinct icons signal
          // non-human interaction to the player at a glance.
          ethereal: '👻',
          echo: '🔊',
          tree: '🌳',
          journal: '📔',
          chamber: '💠',
        }
        const npcIcon = iconMap[activeDialogue.npc.witnessType] ?? '🗨️'
        return (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <DialogueView
                npcName={activeDialogue.npc.name}
                npcIcon={npcIcon}
                npcRole={activeDialogue.npc.role}
                nodes={adapted.nodes}
                startNodeId={adapted.startNodeId}
                playerStats={playerStats}
                onClose={handleDialogueClose}
                onEffect={handleDialogueEffect}
                onSkillCheck={handleSkillCheck}
                onGameStateChanged={() => { if (adventureState) saveAdventureState(adventureState) }}
                gameDifficulty={adventureState.gameDifficulty}
              />
            </div>
          </div>
        )
      })()}

      {/* Phase 2: Quest Log Panel.
          Surfaces active + completed quests and previews unchosen paths
          (ghosted) so the player can always see their branching choices. */}
      {showQuestLog && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <QuestLog
              quests={adaptQuestsForLogGated(
                adventureState.questEntries,
                adventureState.chapter,
                new Set(adventureState.questFlags),
                repState.reputations as Partial<Record<FactionId, number>>,
              )}
              onClose={() => setShowQuestLog(false)}
            />
          </div>
        </div>
      )}

      {/* Phase 2: Quest Path Picker.
          When a quest with multiple paths is offered, the player explicitly
          commits to lawful/diplomatic/pragmatic/etc. before the quest goes
          active. Each path shows its name + description + reward preview. */}
      {questOffer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto bg-[var(--pixel-bg-dark)] border-4 border-[var(--pixel-ui-border)]">
            <div className="p-3 border-b-2 border-[var(--pixel-ui-border)] flex justify-between items-center">
              <span className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)]">
                {'📜'} CHOOSE YOUR PATH
              </span>
              <button
                onClick={() => setQuestOffer(null)}
                className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] px-2 py-1 border border-[var(--pixel-ui-border)]"
              >
                LATER
              </button>
            </div>
            <div className="p-3">
              <h3 className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] mb-1">
                {questOffer.title}
              </h3>
              <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-70 mb-3">
                {questOffer.description}
              </p>
              <div className="space-y-2">
                {questOffer.paths.map(path => (
                  <button
                    key={path.id}
                    onClick={() => handleCommitQuestPath(path.id)}
                    className="w-full text-left p-3 bg-black/30 border-2 border-[var(--pixel-ui-border)] hover:border-[var(--pixel-gold-mid)] hover:bg-[var(--pixel-gold-dark)]/10 transition-all"
                  >
                    <div className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)] mb-1">
                      {path.name}
                    </div>
                    <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-70 mb-2">
                      {path.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-gold-light)]">
                        +{path.reward.xp} XP
                      </span>
                      {path.reward.gold !== undefined && path.reward.gold !== 0 && (
                        <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-gold-light)]">
                          {path.reward.gold > 0 ? '+' : ''}{path.reward.gold} karma
                        </span>
                      )}
                      {path.reward.karma?.lawful !== undefined && (
                        <span className={`font-[var(--font-pixel)] text-[7px] ${path.reward.karma.lawful > 0 ? 'text-blue-400' : 'text-purple-400'}`}>
                          {path.reward.karma.lawful > 0 ? '+' : ''}{path.reward.karma.lawful} {path.reward.karma.lawful > 0 ? 'Lawful' : 'Chaotic'}
                        </span>
                      )}
                      {path.reward.karma?.good !== undefined && (
                        <span className={`font-[var(--font-pixel)] text-[7px] ${path.reward.karma.good > 0 ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-red)]'}`}>
                          {path.reward.karma.good > 0 ? '+' : ''}{path.reward.karma.good} {path.reward.karma.good > 0 ? 'Good' : 'Evil'}
                        </span>
                      )}
                      {path.reward.reputation?.map(r => (
                        <span key={r.faction} className={`font-[var(--font-pixel)] text-[7px] ${r.amount > 0 ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-red)]'}`}>
                          {r.amount > 0 ? '+' : ''}{r.amount} {r.faction}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
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
