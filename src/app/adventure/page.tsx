'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PixelNavigation, PixelButton, PixelCard } from '@/components/pixel'
import { GOLD_COUNTRY_MAP_ART, TOWN_EDITORIAL } from '@/lib/goldCountryEditorial'
import { useRPG, TRAITS, type TraitId, type AttributeName, type RPGSession } from '@/lib/rpgContext'
import {
  rollAllStats,
  generateMandelbrotSeed,
  distributeStatsMandelbrot,
  attributeRollsToStats,
  type AttributeRolls,
  type CharacterAttributes,
  type CreationMethod,
} from '@/lib/rpgContext'
import { chapters } from '@/lib/chapters'
import { KarmaStorage, getAlignmentPosition, type AlignmentPosition } from '@/lib/karmaStorage'

// Character creation steps
type CreationStep = 'name' | 'method' | 'stats' | 'trait' | 'confirm'

function getRewardTierPercent(session: RPGSession | null): number {
  if (!session) return 0

  const completedCount = Object.values(session.chapters).filter(c => c.completed).length
  const perfectScore = session.hintsUsed === 0 && completedCount === 5

  let percent = 0
  if (completedCount >= 1) percent = 5
  if (completedCount >= 3) percent = 10
  if (completedCount >= 5) percent = 15
  if (perfectScore) percent = 20

  return percent
}

// Attribute display names and descriptions
const ATTRIBUTE_INFO: Record<AttributeName, { name: string; abbr: string; desc: string }> = {
  str: { name: 'Strength', abbr: 'STR', desc: 'Mining & hauling' },
  dex: { name: 'Dexterity', abbr: 'DEX', desc: 'Panning & precision' },
  con: { name: 'Constitution', abbr: 'CON', desc: 'Endurance & health' },
  int: { name: 'Intelligence', abbr: 'INT', desc: 'Geology & business' },
  wis: { name: 'Wisdom', abbr: 'WIS', desc: 'Survival & intuition' },
  cha: { name: 'Charisma', abbr: 'CHA', desc: 'Negotiation & trust' },
}

// Dice component for visual display
function DiceDisplay({ value, kept }: { value: number; kept: boolean }) {
  const dots: Record<number, string[]> = {
    1: ['50% 50%'],
    2: ['25% 25%', '75% 75%'],
    3: ['25% 25%', '50% 50%', '75% 75%'],
    4: ['25% 25%', '25% 75%', '75% 25%', '75% 75%'],
    5: ['25% 25%', '25% 75%', '50% 50%', '75% 25%', '75% 75%'],
    6: ['25% 25%', '25% 50%', '25% 75%', '75% 25%', '75% 50%', '75% 75%'],
  }

  return (
    <div
      className={`
        relative w-8 h-8 sm:w-10 sm:h-10 border-2 rounded
        ${kept
          ? 'bg-[var(--pixel-ui-bg)] border-[var(--pixel-gold-mid)]'
          : 'bg-[var(--pixel-bg-dark)] border-[var(--pixel-fire-red)] opacity-50'}
      `}
    >
      {dots[value]?.map((pos, i) => (
        <div
          key={i}
          className={`absolute w-2 h-2 rounded-full ${kept ? 'bg-[var(--pixel-gold-light)]' : 'bg-[var(--pixel-fire-red)]'}`}
          style={{
            left: pos.split(' ')[0],
            top: pos.split(' ')[1],
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      {!kept && (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--pixel-fire-red)] font-bold text-lg">
          ×
        </div>
      )}
    </div>
  )
}

// Stat row with dice display
function StatRollRow({
  attr,
  rolls,
  total,
}: {
  attr: AttributeName
  rolls: { value: number; kept: boolean }[]
  total: number
}) {
  const info = ATTRIBUTE_INFO[attr]
  const modifier = Math.floor((total - 10) / 2)
  const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`

  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-[var(--pixel-ui-border)] last:border-0">
      <div className="w-16 sm:w-20">
        <span className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-gold-light)]">
          {info.abbr}
        </span>
        <p className="font-[var(--font-pixel)] text-[11px] sm:text-[12px] text-[var(--pixel-ui-text)]">
          {info.desc}
        </p>
      </div>
      <div className="flex gap-1">
        {rolls.map((die, i) => (
          <DiceDisplay key={i} value={die.value} kept={die.kept} />
        ))}
      </div>
      <div className="text-right w-16">
        <span className="font-[var(--font-pixel)] text-[14px] sm:text-[16px] text-[var(--pixel-gold-light)]">
          {total}
        </span>
        <span className={`font-[var(--font-pixel)] text-[10px] sm:text-[12px] ml-1 ${modifier >= 0 ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-red)]'}`}>
          ({modStr})
        </span>
      </div>
    </div>
  )
}

// Mandelbrot visualization
function MandelbrotVisual({ c, iterations }: { c: { re: number; im: number }; iterations: number }) {
  return (
    <div className="relative w-32 h-32 mx-auto border-2 border-[var(--pixel-gold-mid)] bg-[var(--pixel-bg-dark)]">
      {/* Simple fractal-like visualization */}
      <div
        className="absolute rounded-full bg-[var(--pixel-gold-mid)]"
        style={{
          width: `${Math.min(80, iterations * 0.8)}%`,
          height: `${Math.min(80, iterations * 0.8)}%`,
          left: `${50 + c.re * 20}%`,
          top: `${50 + c.im * 20}%`,
          transform: 'translate(-50%, -50%)',
          opacity: 0.3 + (iterations / 100) * 0.7,
        }}
      />
      <div
        className="absolute w-2 h-2 bg-[var(--pixel-fire-orange)] rounded-full"
        style={{
          left: `${50 + c.re * 30}%`,
          top: `${50 + c.im * 30}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div className="absolute bottom-1 left-1 right-1 text-center">
        <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">
          z = z² + ({c.re.toFixed(2)} + {c.im.toFixed(2)}i)
        </span>
      </div>
    </div>
  )
}

export default function AdventurePage() {
  const { session, startNewGame, loadGame, resetGame, getDiscountCode } = useRPG()

  // Character creation state
  const router = useRouter()
  const [creationStep, setCreationStep] = useState<CreationStep>('name')
  const [nameInput, setNameInput] = useState('')
  const [showNewGame, setShowNewGame] = useState(false)
  const [creationMethod, setCreationMethod] = useState<CreationMethod | null>(null)

  // Dice roll state
  const [attributeRolls, setAttributeRolls] = useState<AttributeRolls | null>(null)
  const [rerollsUsed, setRerollsUsed] = useState(0)
  const MAX_REROLLS = 3

  // Mandelbrot state
  const [mandelbrotResult, setMandelbrotResult] = useState<{ seed: number; iterations: number; c: { re: number; im: number }; escaped: boolean } | null>(null)
  const [mandelbrotStats, setMandelbrotStats] = useState<CharacterAttributes | null>(null)

  // Trait selection
  const [selectedTrait, setSelectedTrait] = useState<TraitId | null>(null)

  // Final stats for starting the game
  const [finalStats, setFinalStats] = useState<CharacterAttributes | null>(null)

  // Unified karma carry-forward
  const [karmaAlignment, setKarmaAlignment] = useState<AlignmentPosition | null>(null)
  const [karmaImported, setKarmaImported] = useState(false)

  // 2026-06-17 fix: the preview chapter list was hardcoded all-🔒, so chapters
  // never appeared to unlock. Read the LIVE game progress (bobr_adventure_state
  // .chapter, the key /adventure/play actually writes) so completing a chapter
  // unlocks the next, and a created character unlocks chapter 1. (The old code
  // gated on an RPGProvider `session` the live game never creates.)
  const [liveChapter, setLiveChapter] = useState(0)
  useEffect(() => {
    try {
      const hasChar = !!localStorage.getItem('bobr_ot_character')
      const raw = localStorage.getItem('bobr_adventure_state')
      const ch = raw ? (JSON.parse(raw).chapter || 0) : 0
      setLiveChapter(Math.max(ch, hasChar ? 1 : 0))
    } catch {
      /* default 0 — everything locked until a game/character exists */
    }
  }, [])

  useEffect(() => {
    const karmaState = KarmaStorage.load()
    if (karmaState && (karmaState.alignment.lawfulChaotic !== 0 || karmaState.alignment.goodEvil !== 0)) {
      setKarmaAlignment(getAlignmentPosition(karmaState.alignment))
      setKarmaImported(true)
    }
  }, [])

  // Character continuity: a character forged in The Golden Frog (Oregon Trail,
  // level 1) or a prior Tale run lives at `bobr_ot_character`. When one exists we
  // carry them FORWARD into the Prospector's Tale — same stats/karma/reputation —
  // rather than forcing a second character build (Leif's continuity directive
  // 2026-07-02). A brand-new character is then a deliberate "start over" choice.
  const [existingCharName, setExistingCharName] = useState<string | null>(null)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('bobr_ot_character')
      if (raw) {
        const c = JSON.parse(raw)
        if (c && typeof c.name === 'string' && c.name.trim()) setExistingCharName(c.name)
      }
    } catch {
      /* no readable character — first-timer path */
    }
  }, [])

  // The canonical save lives at `bobr_ot_character` (character) +
  // `bobr_adventure_state` (game state); `bobr_rpg_session` is the legacy key,
  // kept as a fallback. Reading only the legacy key hid the "Continue
  // Adventure" button after every save (P1-4).
  const hasSavedGame = typeof window !== 'undefined' && Boolean(
    localStorage.getItem('bobr_ot_character') ||
    localStorage.getItem('bobr_adventure_state') ||
    localStorage.getItem('bobr_rpg_session')
  )
  // Client discount-code minting is quarantined; this returns null until server-issued codes exist.
  const discount = getDiscountCode()
  const rewardPercent = discount?.percent ?? getRewardTierPercent(session)

  // Handle rolling dice
  const handleRollDice = useCallback(() => {
    const rolls = rollAllStats()
    setAttributeRolls(rolls)
    setFinalStats(attributeRollsToStats(rolls))
  }, [])

  // Handle reroll
  const handleReroll = useCallback(() => {
    if (rerollsUsed < MAX_REROLLS) {
      handleRollDice()
      setRerollsUsed(prev => prev + 1)
    }
  }, [rerollsUsed, handleRollDice])

  // Handle Mandelbrot generation
  const handleMandelbrot = useCallback(() => {
    const result = generateMandelbrotSeed()
    setMandelbrotResult(result)
    const stats = distributeStatsMandelbrot(result.seed)
    setMandelbrotStats(stats)
    setFinalStats(stats)
  }, [])

  // Select creation method
  const handleSelectMethod = useCallback((method: CreationMethod) => {
    setCreationMethod(method)
    if (method === 'dice_roll') {
      handleRollDice()
    } else if (method === 'mandelbrot') {
      handleMandelbrot()
    }
    setCreationStep('stats')
  }, [handleRollDice, handleMandelbrot])

  // Proceed to trait selection
  const handleConfirmStats = useCallback(() => {
    setCreationStep('trait')
  }, [])

  // Apply karma alignment bonuses to stats
  const applyKarmaBonuses = useCallback((base: CharacterAttributes | undefined): CharacterAttributes | undefined => {
    if (!base || !karmaAlignment) return base
    const bonused = { ...base }
    // Alignment bonus table from plan
    switch (karmaAlignment) {
      case 'lawful_good':
        bonused.cha = Math.min(20, bonused.cha + 2) // +2 Diplomacy via CHA
        break
      case 'chaotic_good':
        bonused.wis = Math.min(20, bonused.wis + 2) // +2 Luck via WIS
        break
      case 'lawful_evil':
        bonused.int = Math.min(20, bonused.int + 2) // +2 Shrewdness via INT
        break
      case 'chaotic_evil':
        bonused.dex = Math.min(20, bonused.dex + 2) // +2 Agility via DEX
        break
      // Partial alignments get +1
      case 'neutral_good':
        bonused.cha = Math.min(20, bonused.cha + 1)
        break
      case 'lawful_neutral':
        bonused.int = Math.min(20, bonused.int + 1)
        break
      case 'chaotic_neutral':
        bonused.dex = Math.min(20, bonused.dex + 1)
        break
      case 'neutral_evil':
        bonused.int = Math.min(20, bonused.int + 1)
        break
      // true_neutral: no bonuses
    }
    return bonused
  }, [karmaAlignment])

  // Start the game
  const handleStartGame = useCallback(() => {
    const playerName = nameInput.trim() || 'Prospector'
    const adjustedStats = applyKarmaBonuses(finalStats ?? undefined)
    startNewGame(playerName, {
      attributes: adjustedStats,
      creationMethod: creationMethod || 'standard',
      rerollsUsed,
      traits: selectedTrait ? [selectedTrait] : [],
    })
  }, [nameInput, finalStats, creationMethod, rerollsUsed, selectedTrait, startNewGame, applyKarmaBonuses])

  const handleContinue = () => {
    // Canonical saves have no legacy RPG session for loadGame() to restore —
    // resume them directly in the play route instead of a silent no-op.
    if (typeof window !== 'undefined' && !localStorage.getItem('bobr_rpg_session')) {
      router.push('/adventure/play')
      return
    }
    loadGame()
  }

  // Check if trait prerequisites are met
  const isTraitAvailable = (traitId: TraitId): boolean => {
    if (!finalStats) return true
    const trait = TRAITS[traitId]
    if (!trait.prerequisite) return true
    return finalStats[trait.prerequisite.attribute] >= trait.prerequisite.min
  }

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="relative mb-8 overflow-hidden rounded-lg border border-[rgba(232,220,196,0.14)] aspect-video bg-[#0e0c0a]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={GOLD_COUNTRY_MAP_ART}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={TOWN_EDITORIAL.bobr_ranch}
            alt=""
            className="absolute right-[-4%] bottom-0 h-[92%] w-[58%] object-contain object-right-bottom drop-shadow-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e0c0a] via-[#0e0c0a]/75 to-transparent" />
          <div className="relative z-10 flex h-full max-w-md flex-col justify-end p-6 sm:p-8">
            <p className="west-face-eyebrow">California · 1852</p>
            <h1 className="west-face-title mt-2">The Diggings</h1>
            <p className="west-face-body mt-3 max-w-sm text-sm leading-relaxed">
              The camps of the Mother Lode after the wagon — Volcano, Angels Camp,
              and Back of Beyond Ranch. Independence, Missouri is the 1849 prequel,
              not these diggings.
            </p>
            <Link href="/oregon-trail" className="mt-4 inline-block font-serif text-sm text-[#e8dcc4] underline-offset-4 hover:underline">
              The wagon journey is next door →
            </Link>
          </div>
        </div>

        {/* Game Start Options */}
        {!session && !showNewGame && (
          <div className="space-y-4 max-w-md mx-auto">
            {existingCharName ? (
              /* Continuity path: a character already exists — bring them forward
                 as the PRIMARY action; a new build is a deliberate secondary. */
              <>
                <PixelButton onClick={handleContinue} variant="gold" size="md">
                  Continue as {existingCharName} →
                </PixelButton>
                <p className="font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-forest-light)] text-center -mt-1">
                  {existingCharName} rides on from your earlier journey — same stats,
                  karma, and reputation carry into the Diggings.
                </p>
                <PixelButton onClick={() => router.push('/adventure/character-creation')} variant="blue" size="sm">
                  Start over with a new character
                </PixelButton>
                <PixelButton href="/adventure/play?prequel=1" variant="blue" size="sm">
                  Prequel: Independence, 1849
                </PixelButton>
              </>
            ) : (
              /* First-timer path: no character yet. Offer resume-if-any + new build. */
              <>
                {hasSavedGame && (
                  <PixelButton onClick={handleContinue} variant="gold" size="md">
                    Continue Adventure
                  </PixelButton>
                )}
                {/* Route straight to the canonical S.A.D.D.L.E. creation flow.
                    The old inline D&D creator below is superseded — sending players
                    here prevents building a character twice (B1). */}
                <PixelButton onClick={() => router.push('/adventure/character-creation')} variant="green" size="md">
                  Enter the Diggings
                </PixelButton>
                <PixelButton href="/adventure/play?prequel=1" variant="blue" size="sm">
                  Prequel: Independence, 1849
                </PixelButton>
              </>
            )}

            {/* THE TARE'S TRAIL — playable now, no character needed (discovery fix) */}
            <div className="border-2 border-[var(--pixel-fire-orange)] bg-gradient-to-b from-[var(--pixel-fire-orange)]/15 to-transparent p-3 text-center">
              <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-fire-orange)]">
                🐎 The Tare&apos;s Trail
              </p>
              <p className="font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)] mt-2">
                A Carmen-Sandiego chase — corner Cyrus Vane across the Mother Lode,
                then see him to justice. Play now; no character needed.
              </p>
              <div className="mt-3 flex justify-center">
                <PixelButton href="/adventure/chase-demo" variant="gold" size="sm">
                  Take Up the Trail
                </PixelButton>
              </div>
            </div>

            {/* WHERE IN TIME — temporal chase, playable now (discovery fix). Was only
                reachable from /hub and /prologue; players starting at /adventure had no
                path to it. */}
            <div className="border-2 border-[var(--pixel-gold-mid)] bg-gradient-to-b from-[var(--pixel-gold-mid)]/15 to-transparent p-3 text-center">
              <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)]">
                ⏳ Where in Time is Cyrus Vane?
              </p>
              <p className="font-[var(--font-pixel)] text-[10px] leading-relaxed text-[var(--pixel-ui-text)] mt-2">
                A chase across the eras — read the clues, narrow the century, and catch
                the Tare before he slips through time. A separate deduction game from the
                main campaign.
              </p>
              <div className="mt-3 flex justify-center">
                <PixelButton href="/adventure/where-in-time" variant="gold" size="sm">
                  Begin the Chase
                </PixelButton>
              </div>
            </div>

            {/* Karma carry-forward badge */}
            {karmaImported && karmaAlignment && (
              <div className="bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-gold-mid)] p-3 text-center">
                <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
                  KARMA IMPORTED FROM TRAIL
                </p>
                <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)] mt-1">
                  Alignment: <span className="text-[var(--pixel-gold-light)]">
                    {karmaAlignment.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                </p>
                <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-forest-light)] mt-1">
                  Starting attribute bonuses will be applied
                </p>
              </div>
            )}

            {/* Preview chapters */}
            <div className="mt-8">
              <h2 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-sm text-center mb-4">
                Prequel on the Missouri road, then four chapters in the towns
              </h2>
              <div className="grid gap-3">
                {Object.values(chapters).map((chapter) => (
                  <div
                    key={chapter.id}
                    className="bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] p-3"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-gold-light)]">
                          Chapter {chapter.id}:
                        </span>
                        <span className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)] ml-2">
                          {chapter.title}
                        </span>
                      </div>
                      <span className="text-lg" title={
                        chapter.id < liveChapter ? 'Completed'
                          : chapter.id === liveChapter ? 'Current chapter'
                          : 'Locked — reach it by playing'
                      }>
                        {chapter.id < liveChapter ? '✅'
                          : chapter.id === liveChapter ? '▶️'
                          : '🔒'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* New Game Form - Character Creation Flow */}
        {!session && showNewGame && (
          <div className="max-w-lg mx-auto">
            {/* Step 1: Name Entry */}
            {creationStep === 'name' && (
              <PixelCard title="Step 1: Name Your Character">
                <div className="space-y-4">
                  <div>
                    <label className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)] block mb-2">
                      What is your name, traveler?
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Tobias"
                      className="w-full bg-[var(--pixel-bg-dark)] border-4 border-[var(--pixel-ui-border)] p-3 font-[var(--font-pixel)] text-[14px] sm:text-[16px] text-[var(--pixel-ui-text)] placeholder:text-[var(--pixel-ui-border)]"
                      maxLength={20}
                      onKeyDown={(e) => e.key === 'Enter' && setCreationStep('method')}
                    />
                  </div>
                  <div className="flex gap-4">
                    <PixelButton onClick={() => setCreationStep('method')} variant="gold" size="md">
                      Next
                    </PixelButton>
                    <PixelButton onClick={() => setShowNewGame(false)} variant="blue" size="sm">
                      Back
                    </PixelButton>
                  </div>
                </div>
              </PixelCard>
            )}

            {/* Step 2: Choose Creation Method */}
            {creationStep === 'method' && (
              <PixelCard title="Step 2: Choose Your Fate">
                <div className="space-y-4">
                  <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)] text-center mb-4">
                    How shall destiny shape {nameInput || 'Prospector'}?
                  </p>

                  <div className="grid gap-4">
                    {/* Dice Rolling Option */}
                    <button
                      onClick={() => handleSelectMethod('dice_roll')}
                      className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-gold-mid)] p-4 hover:bg-[var(--pixel-gold-dark)] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">🎲</span>
                        <div>
                          <h3 className="font-[var(--font-pixel)] text-[14px] sm:text-[16px] text-[var(--pixel-gold-light)]">
                            Roll the Dice
                          </h3>
                          <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)]">
                            Classic D&D style: 4d6, drop lowest
                          </p>
                          <p className="font-[var(--font-pixel)] text-[11px] sm:text-[12px] text-[var(--pixel-forest-light)] mt-1">
                            Higher highs, lower lows • {MAX_REROLLS} rerolls allowed
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Mandelbrot Option */}
                    <button
                      onClick={() => handleSelectMethod('mandelbrot')}
                      className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] p-4 hover:bg-[var(--pixel-bg-light)] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">🌀</span>
                        <div>
                          <h3 className="font-[var(--font-pixel)] text-[14px] sm:text-[16px] text-[var(--pixel-gold-light)]">
                            Just Start
                          </h3>
                          <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)]">
                            Mandelbrot-seeded balanced stats
                          </p>
                          <p className="font-[var(--font-pixel)] text-[11px] sm:text-[12px] text-[var(--pixel-sky-light)] mt-1">
                            z = z² + C • Balanced distribution (8-16)
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      onClick={() => setCreationStep('name')}
                      className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-border)] hover:text-[var(--pixel-ui-text)]"
                    >
                      ← Back to name
                    </button>
                  </div>
                </div>
              </PixelCard>
            )}

            {/* Step 3: View/Reroll Stats */}
            {creationStep === 'stats' && (
              <PixelCard title="Step 3: Your Attributes">
                <div className="space-y-4">
                  {/* Dice Roll Display */}
                  {creationMethod === 'dice_roll' && attributeRolls && (
                    <div className="space-y-2">
                      <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)] text-center mb-2">
                        4d6, drop lowest (shown crossed out)
                      </p>
                      <StatRollRow attr="str" rolls={attributeRolls.str.dice} total={attributeRolls.str.total} />
                      <StatRollRow attr="dex" rolls={attributeRolls.dex.dice} total={attributeRolls.dex.total} />
                      <StatRollRow attr="con" rolls={attributeRolls.con.dice} total={attributeRolls.con.total} />
                      <StatRollRow attr="int" rolls={attributeRolls.int.dice} total={attributeRolls.int.total} />
                      <StatRollRow attr="wis" rolls={attributeRolls.wis.dice} total={attributeRolls.wis.total} />
                      <StatRollRow attr="cha" rolls={attributeRolls.cha.dice} total={attributeRolls.cha.total} />

                      {/* Total and Reroll */}
                      <div className="flex justify-between items-center pt-3 border-t-2 border-[var(--pixel-gold-mid)]">
                        <span className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)]">
                          Total: <span className="text-[var(--pixel-gold-light)]">
                            {Object.values(attributeRolls).reduce((sum, r) => sum + r.total, 0)}
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)]">
                            Rerolls: {MAX_REROLLS - rerollsUsed}/{MAX_REROLLS}
                          </span>
                          {rerollsUsed < MAX_REROLLS && (
                            <PixelButton onClick={handleReroll} variant="orange" size="sm">
                              Reroll All 🎲
                            </PixelButton>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mandelbrot Display */}
                  {creationMethod === 'mandelbrot' && mandelbrotResult && mandelbrotStats && (
                    <div className="space-y-4">
                      <MandelbrotVisual c={mandelbrotResult.c} iterations={mandelbrotResult.iterations} />
                      <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)] text-center">
                        Seed: {mandelbrotResult.seed} • {mandelbrotResult.iterations} iterations
                        {mandelbrotResult.escaped ? ' (escaped)' : ' (bounded)'}
                      </p>

                      <div className="grid grid-cols-3 gap-3">
                        {(Object.keys(mandelbrotStats) as AttributeName[]).map((attr) => {
                          const val = mandelbrotStats[attr]
                          const mod = Math.floor((val - 10) / 2)
                          return (
                            <div key={attr} className="bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] p-2 text-center">
                              <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
                                {ATTRIBUTE_INFO[attr].abbr}
                              </span>
                              <p className="font-[var(--font-pixel)] text-[16px] text-[var(--pixel-ui-text)]">{val}</p>
                              <span className={`font-[var(--font-pixel)] text-[10px] ${mod >= 0 ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-red)]'}`}>
                                ({mod >= 0 ? '+' : ''}{mod})
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      <div className="text-center">
                        <PixelButton onClick={handleMandelbrot} variant="blue" size="sm">
                          Generate New Seed 🌀
                        </PixelButton>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <PixelButton onClick={handleConfirmStats} variant="gold" size="md">
                      Accept Stats
                    </PixelButton>
                    <PixelButton onClick={() => setCreationStep('method')} variant="blue" size="sm">
                      Back
                    </PixelButton>
                  </div>
                </div>
              </PixelCard>
            )}

            {/* Step 4: Trait Selection */}
            {creationStep === 'trait' && (
              <PixelCard title="Step 4: Choose a Trait (Optional)">
                <div className="space-y-4">
                  <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)] text-center">
                    Traits provide special bonuses. Some require minimum attributes.
                  </p>

                  <div className="grid gap-2 max-h-64 overflow-y-auto">
                    {/* No Trait Option */}
                    <button
                      onClick={() => setSelectedTrait(null)}
                      className={`text-left p-3 border-2 transition-colors ${
                        selectedTrait === null
                          ? 'border-[var(--pixel-gold-mid)] bg-[var(--pixel-gold-dark)]'
                          : 'border-[var(--pixel-ui-border)] bg-[var(--pixel-bg-mid)] hover:bg-[var(--pixel-bg-light)]'
                      }`}
                    >
                      <span className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)]">
                        No Trait (Start humble)
                      </span>
                    </button>

                    {/* Trait Options */}
                    {(Object.keys(TRAITS) as TraitId[]).map((traitId) => {
                      const trait = TRAITS[traitId]
                      const available = isTraitAvailable(traitId)

                      return (
                        <button
                          key={traitId}
                          onClick={() => available && setSelectedTrait(traitId)}
                          disabled={!available}
                          className={`text-left p-3 border-2 transition-colors ${
                            selectedTrait === traitId
                              ? 'border-[var(--pixel-gold-mid)] bg-[var(--pixel-gold-dark)]'
                              : available
                              ? 'border-[var(--pixel-ui-border)] bg-[var(--pixel-bg-mid)] hover:bg-[var(--pixel-bg-light)]'
                              : 'border-[var(--pixel-ui-border)] bg-[var(--pixel-bg-dark)] opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)]">
                                {trait.name}
                              </span>
                              <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">
                                {trait.description}
                              </p>
                            </div>
                            {trait.prerequisite && (
                              <span className={`font-[var(--font-pixel)] text-[11px] ${available ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-red)]'}`}>
                                {ATTRIBUTE_INFO[trait.prerequisite.attribute].abbr} {trait.prerequisite.min}+
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <PixelButton onClick={handleStartGame} variant="gold" size="md">
                      Begin Adventure!
                    </PixelButton>
                    <PixelButton onClick={() => setCreationStep('stats')} variant="blue" size="sm">
                      Back
                    </PixelButton>
                  </div>
                </div>
              </PixelCard>
            )}
          </div>
        )}

        {/* Active Session */}
        {session && (
          <div className="space-y-6">
            {/* Player HUD */}
            <div className="bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-ui-border)] p-4">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)]">
                  <span className="text-[var(--pixel-gold-light)]">PROSPECTOR: </span>
                  <span>{session.playerName}</span>
                </div>
                <div className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)]">
                  <span className="text-[var(--pixel-gold-light)]">SCORE: </span>
                  <span className="text-[var(--pixel-forest-light)]">{session.totalScore}</span>
                </div>
                <div className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)]">
                  <span className="text-[var(--pixel-gold-light)]">CHAPTER: </span>
                  <span>{session.currentChapter}/5</span>
                </div>
              </div>
            </div>

            {/* Chapter Selection */}
            <div className="grid gap-4">
              {Object.values(chapters).map((chapter) => {
                const progress = session.chapters[chapter.id]
                const isUnlocked = chapter.id <= session.currentChapter
                const isCurrent = chapter.id === session.currentChapter

                return (
                  <div
                    key={chapter.id}
                    className={`
                      border-4 p-4 transition-all
                      ${isCurrent ? 'border-[var(--pixel-gold-mid)] bg-[var(--pixel-gold-dark)]' :
                        isUnlocked ? 'border-[var(--pixel-forest-mid)] bg-[var(--pixel-bg-mid)]' :
                        'border-[var(--pixel-ui-border)] bg-[var(--pixel-bg-dark)] opacity-50'}
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-[var(--font-pixel)] text-[14px] sm:text-[16px] text-[var(--pixel-gold-light)]">
                          Chapter {chapter.id}: {chapter.title}
                        </h3>
                        <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)] mt-1">
                          {chapter.subtitle}
                        </p>
                        <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)] mt-2 max-w-md">
                          {chapter.description}
                        </p>
                      </div>
                      <div className="text-right">
                        {progress.completed ? (
                          <span className="text-2xl">✅</span>
                        ) : isUnlocked ? (
                          <span className="text-2xl animate-pulse">▶️</span>
                        ) : (
                          <span className="text-2xl">🔒</span>
                        )}
                        {progress.score > 0 && (
                          <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-forest-light)] mt-1">
                            Score: {progress.score}
                          </p>
                        )}
                      </div>
                    </div>

                    {isCurrent && !progress.completed && (
                      <div className="mt-4">
                        <PixelButton href="/adventure/play" variant="gold" size="sm">
                          {progress.choicesMade.length > 0 ? 'Continue' : 'Begin Chapter'}
                        </PixelButton>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* THE TARE'S TRAIL — Carmen-Sandiego deduction side-quest */}
            <div className="mb-6 border-2 border-[var(--pixel-fire-orange)] bg-gradient-to-b from-[var(--pixel-fire-orange)]/15 to-transparent p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-[var(--font-pixel)] text-[14px] sm:text-[16px] text-[var(--pixel-fire-orange)]">
                    🐎 The Tare&apos;s Trail
                  </h3>
                  <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)] mt-2 max-w-md">
                    A road agent is loose in the Mother Lode. Read each witness, follow the
                    clue to the next town&apos;s attribute — never its name — and corner
                    Cyrus Vane &ldquo;the Tare&rdquo; before the six days run out.
                  </p>
                </div>
                <span className="text-2xl">🔎</span>
              </div>
              <div className="mt-4">
                <PixelButton href="/adventure/chase-demo" variant="gold" size="sm">
                  Take Up the Trail
                </PixelButton>
              </div>
            </div>

            {/* D&D Attributes */}
            <PixelCard title="Character Attributes">
              <div className="grid grid-cols-6 gap-2 text-center mb-4">
                {(Object.keys(session.character.attributes) as AttributeName[]).map((attr) => {
                  const val = session.character.attributes[attr]
                  const mod = Math.floor((val - 10) / 2)
                  return (
                    <div key={attr} className="bg-[var(--pixel-bg-mid)] border border-[var(--pixel-ui-border)] p-1">
                      <p className="font-[var(--font-pixel)] text-[11px] sm:text-[12px] text-[var(--pixel-gold-light)]">
                        {ATTRIBUTE_INFO[attr].abbr}
                      </p>
                      <p className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)]">{val}</p>
                      <p className={`font-[var(--font-pixel)] text-[11px] ${mod >= 0 ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-red)]'}`}>
                        {mod >= 0 ? '+' : ''}{mod}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Legacy Stats */}
              <div className="grid grid-cols-4 gap-2 text-center border-t border-[var(--pixel-ui-border)] pt-3">
                <div>
                  <p className="font-[var(--font-pixel)] text-[11px] sm:text-[12px] text-[var(--pixel-ui-text)]">Wisdom</p>
                  <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-light)]">{session.stats.wisdom}</p>
                </div>
                <div>
                  <p className="font-[var(--font-pixel)] text-[11px] sm:text-[12px] text-[var(--pixel-ui-text)]">Trust</p>
                  <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-forest-light)]">{session.stats.trust}</p>
                </div>
                <div>
                  <p className="font-[var(--font-pixel)] text-[11px] sm:text-[12px] text-[var(--pixel-ui-text)]">Luck</p>
                  <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-sky-light)]">{session.stats.luck}</p>
                </div>
                <div>
                  <p className="font-[var(--font-pixel)] text-[11px] sm:text-[12px] text-[var(--pixel-ui-text)]">Gold</p>
                  <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-gold-mid)]">{session.stats.gold}</p>
                </div>
              </div>

              {/* Character Sheet Link */}
              <div className="mt-3 text-center">
                <PixelButton href="/adventure/character" variant="blue" size="sm">
                  View Character Sheet
                </PixelButton>
              </div>
            </PixelCard>

            {/* Reward verification */}
            {rewardPercent > 0 && (
              <div className="bg-gradient-to-r from-[var(--pixel-gold-dark)] to-[var(--pixel-fire-orange)] border-4 border-[var(--pixel-gold-mid)] p-4 text-center">
                <p className="font-[var(--font-pixel)] text-[14px] sm:text-[16px] text-[var(--pixel-ui-text)]">
                  Reward Tier Earned: <span className="text-[var(--pixel-gold-light)]">{rewardPercent}% OFF</span>
                </p>
                <p className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-gold-light)] mt-1">
                  Contact your host at Back of Beyond Ranch to confirm your discount — server-issued codes coming soon.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-4 justify-center">
              <PixelButton href="/adventure/leaderboard" variant="blue" size="sm">
                Leaderboard
              </PixelButton>
              <PixelButton onClick={resetGame} variant="orange" size="sm">
                Reset Game
              </PixelButton>
            </div>
          </div>
        )}

        {/* Connection to Mystery Hunt */}
        <div className="mt-12 text-center bg-[var(--pixel-bg-mid)] border-4 border-[var(--pixel-gold-mid)] p-6">
          <h2 className="font-[var(--font-pixel)] text-[var(--pixel-gold-light)] text-sm mb-4">
            The Story Continues...
          </h2>
          <p className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-ui-text)] mb-4 max-w-lg mx-auto">
            Complete the online adventure to unlock the prologue. Then visit Back of Beyond Ranch
            in person to play "The Golden Hooves Legacy" - a QR code mystery hunt where you
            discover what Tobias left behind 170 years ago.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <PixelButton href="/game" variant="gold" size="sm">
              Learn About Mystery Hunt
            </PixelButton>
            <PixelButton href="/rentals" variant="green" size="sm">
              Book Your Stay
            </PixelButton>
          </div>
        </div>
      </div>
    </div>
  )
}
