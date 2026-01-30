'use client'

import React, { useRef, useState, useMemo, useCallback } from 'react'
import { useMystery, type CollectedClue } from '../mysteryContext'
import { useCharacter, CHARACTER_TRAITS, BACKGROUND_DESCRIPTIONS, type CharacterBackground } from '../characterContext'
import { useOregonTrail, LANDMARKS } from '../oregonTrailContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useReputation, FACTIONS, type FactionId } from '../reputationContext'
import { useRanch } from '../ranchContext'
import { useChapter } from '../chapterContext'
import { OUTLAWS } from '../data/outlaws'
import { type DiscountTier, DISCOUNT_TIERS } from '../data/discountEngine'

// ============================================================================
// TYPES
// ============================================================================

interface JournalSouvenirProps {
  discountCode?: string
  discountTier?: DiscountTier
  discountPercent?: number
  endingType?: string // 'rancher' | 'detective' | 'gambler' | 'golden_hooves' | 'default'
  onClose: () => void
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SEPIA = {
  gold: '#d4a843',
  darkGold: '#8b6914',
  deepBrown: '#2a1f14',
  medBrown: '#3d2b18',
  warmTan: '#a08050',
  dustyBronze: '#6a5030',
  shadowBrown: '#5a4020',
  parchment: '#c8b07a',
  lightParchment: '#dcc99a',
  ink: '#1a120a',
}

const BACKGROUND_EMOJI: Record<string, string> = {
  pinkerton_veteran: '\u{1F575}',  // detective
  frontier_scout: '\u{1F9ED}',     // compass
  army_officer: '\u{1F6E1}',       // shield
  gambler: '\u{1F0CF}',            // playing card
  doctor: '\u{1FA7A}',             // stethoscope
  preacher: '\u{1F4D6}',           // book
  outlaw_reformed: '\u{1F3AD}',    // masks
}

const TWAIN_QUOTES = [
  'The secret of getting ahead is getting started.',
  'Twenty years from now you will be more disappointed by the things you didn\'t do than by the ones you did do.',
  'California \u2014 a land of contrasts, where gold runs in the rivers and dreams run higher still.',
  'It ain\'t what you don\'t know that gets you into trouble. It\'s what you know for sure that just ain\'t so.',
  'The world owes you nothing. It was here first.',
  'Courage is resistance to fear, mastery of fear \u2014 not absence of fear.',
  'Get your facts first, then you can distort them as you please.',
  'All you need in this life is ignorance and confidence, and then success is sure.',
  'I have never let my schooling interfere with my education.',
  'The lack of money is the root of all evil.',
  'In the real Calaveras County, the frogs still jump \u2014 and the gold still gleams.',
  'A man who carries a cat by the tail learns something he can learn in no other way.',
]

const WEATHER_FLAVOR = [
  'Scorching summer heat across the Great Plains',
  'Dust storms on the prairie that stung like needles',
  'Mountain snow that froze the oxen in their tracks',
  'Torrential rains that turned the trail to mud',
  'Fair skies and tailwinds for days on end',
  'Thunderstorms that rattled the wagon bones',
  'Bitter cold in the mountain passes',
  'Golden California sunshine upon arrival',
]

// ============================================================================
// HELPERS
// ============================================================================

function groupCluesByLocation(clues: CollectedClue[]): Record<string, CollectedClue[]> {
  return clues.reduce((acc, clue) => {
    const loc = clue.location || 'Unknown'
    if (!acc[loc]) acc[loc] = []
    acc[loc].push(clue)
    return acc
  }, {} as Record<string, CollectedClue[]>)
}

function getRandomQuote(): string {
  return TWAIN_QUOTES[Math.floor(Math.random() * TWAIN_QUOTES.length)]
}

function getRandomWeatherFlavor(): string {
  return WEATHER_FLAVOR[Math.floor(Math.random() * WEATHER_FLAVOR.length)]
}

function getBackgroundDisplayName(bg: string): string {
  const info = BACKGROUND_DESCRIPTIONS[bg as CharacterBackground]
  return info?.name || bg.replace(/_/g, ' ')
}

// ============================================================================
// COMPONENT
// ============================================================================

export function JournalSouvenir({
  discountCode,
  discountTier,
  discountPercent,
  endingType = 'default',
  onClose,
}: JournalSouvenirProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [shareError, setShareError] = useState(false)

  // Pull all game context
  const { state: mysteryState } = useMystery()
  const { state: charState, getStat } = useCharacter()
  const { state: trailState } = useOregonTrail()
  const { balance } = useKarmaWallet()
  const { state: repState } = useReputation()
  const { state: ranchState } = useRanch()

  // Chapter context for easter eggs and choices (wrapped in try/catch for safety)
  let chapterProgress: { easterEggsFound: string[]; choicesMade: { locationId: string; choiceId: string; consequence?: string }[]; visitedLocations: Set<string> } | null = null
  try {
    const chapterCtx = useChapter()
    chapterProgress = chapterCtx.progress
  } catch {
    // chapterContext may not be available in all render paths
    chapterProgress = null
  }

  // Derived data
  const character = charState.character
  const characterName = character?.name || 'Unknown Traveler'
  const background = character?.background || 'frontier_scout'
  const backgroundEmoji = BACKGROUND_EMOJI[background] || '\u{1F920}'

  const quote = useMemo(() => getRandomQuote(), [])
  const weatherFlavor = useMemo(() => getRandomWeatherFlavor(), [])

  const capturedOutlaws = useMemo(() => {
    return OUTLAWS.filter(o => {
      const status = mysteryState.outlawStatuses[o.id]
      return status?.captured
    })
  }, [mysteryState.outlawStatuses])

  const cluesByLocation = useMemo(() => {
    return groupCluesByLocation(mysteryState.collectedClues)
  }, [mysteryState.collectedClues])

  const locationsVisitedList = useMemo(() => {
    // Derive from landmarks and trail progress
    const visited: string[] = []
    for (const landmark of LANDMARKS) {
      if (trailState.distance >= landmark.distance) {
        visited.push(landmark.name)
      }
    }
    return visited
  }, [trailState.distance])

  const easterEggsCount = chapterProgress?.easterEggsFound?.length ?? 0
  const choicesMade = chapterProgress?.choicesMade ?? []

  const pageCount = mysteryState.collectedClues.length + choicesMade.length + locationsVisitedList.length

  // ---------------------------------------------------------------------------
  // Export text for clipboard
  // ---------------------------------------------------------------------------
  const exportText = useMemo(() => {
    const lines = [
      '\u2550'.repeat(35),
      'THE GOLDEN HOOVES JOURNAL',
      '\u2550'.repeat(35),
      `${characterName} - ${getBackgroundDisplayName(background)}`,
      `${trailState.daysOnTrail} days | ${trailState.totalMilesTraveled} miles | ${locationsVisitedList.length} locations`,
      '',
      `CASE FILES: ${capturedOutlaws.length} outlaws captured`,
      `KARMA: ${balance.neutral}N ${balance.good}G ${balance.bad}B`,
    ]

    if (discountCode && discountPercent) {
      lines.push(`DISCOUNT: ${discountCode} (${discountPercent}% off)`)
    }

    lines.push('')
    lines.push('Visit: airbnb.com/h/backofbeyondranch')
    lines.push('"The real gold was never in the rivers."')
    lines.push('\u2550'.repeat(35))

    return lines.join('\n')
  }, [characterName, background, trailState.daysOnTrail, trailState.totalMilesTraveled, locationsVisitedList.length, capturedOutlaws.length, balance, discountCode, discountPercent])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = exportText
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }, [exportText])

  const handleShare = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'The Golden Hooves Journal',
          text: exportText,
          url: 'https://airbnb.com/h/backofbeyondranch',
        })
      } catch {
        setShareError(true)
        setTimeout(() => setShareError(false), 2000)
      }
    } else {
      // Fallback to copy
      handleCopy()
    }
  }, [exportText, handleCopy])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  // ---------------------------------------------------------------------------
  // STAT NAMES for S.A.D.D.L.E. block
  // ---------------------------------------------------------------------------
  const saddleStats = ['Shrewdness', 'Agility', 'Durability', 'Diplomacy', 'Luck', 'Expertise'] as const

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* Print-optimized CSS */}
      <style>{`
        @media print {
          body > *:not(.journal-souvenir-overlay) { display: none !important; }
          .journal-souvenir-overlay { position: static !important; overflow: visible !important; }
          .journal-souvenir-overlay * { color-adjust: exact !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .journal-no-print { display: none !important; }
          .journal-souvenir-content { max-height: none !important; overflow: visible !important; }
        }
      `}</style>

      {/* Full-page overlay */}
      <div
        className="journal-souvenir-overlay fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto"
        style={{
          background: 'linear-gradient(135deg, #2a1f14, #3d2b18, #2a1f14)',
        }}
      >
        {/* Backdrop click area */}
        <div
          className="journal-no-print absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={onClose}
        />

        {/* Journal content */}
        <div
          ref={contentRef}
          className="journal-souvenir-content relative w-full max-w-2xl my-4 mx-4 rounded-lg overflow-hidden"
          style={{
            background: `linear-gradient(175deg, ${SEPIA.medBrown} 0%, ${SEPIA.deepBrown} 30%, ${SEPIA.medBrown} 60%, ${SEPIA.deepBrown} 100%)`,
            border: `3px solid ${SEPIA.darkGold}`,
            boxShadow: `
              0 0 0 1px ${SEPIA.shadowBrown},
              0 0 30px rgba(212, 168, 67, 0.15),
              inset 0 0 60px rgba(0,0,0,0.3)
            `,
          }}
        >
          {/* ================================================================
              SECTION 1: JOURNAL COVER PAGE
              ================================================================ */}
          <div
            className="p-6 text-center border-b-2"
            style={{
              borderColor: SEPIA.darkGold,
              background: `linear-gradient(180deg, ${SEPIA.medBrown}, ${SEPIA.deepBrown})`,
            }}
          >
            {/* Decorative top border */}
            <div
              className="mx-auto mb-4 flex items-center justify-center gap-2"
              style={{ color: SEPIA.darkGold }}
            >
              <span style={{ letterSpacing: '0.3em' }}>{'\u2500'.repeat(6)}</span>
              <span style={{ fontSize: '1.2em' }}>{'\u2726'}</span>
              <span style={{ letterSpacing: '0.3em' }}>{'\u2500'.repeat(6)}</span>
            </div>

            <h1
              className="font-pixel text-2xl md:text-3xl tracking-widest mb-3"
              style={{ color: SEPIA.gold, textShadow: `0 2px 4px rgba(0,0,0,0.5)` }}
            >
              THE GOLDEN HOOVES JOURNAL
            </h1>

            <p
              className="text-sm md:text-base italic leading-relaxed max-w-md mx-auto mb-4"
              style={{ color: SEPIA.warmTan }}
            >
              Being the True Account of {characterName}&apos;s Journey
              Through Gold Country, California, 1852
            </p>

            {/* Character portrait area */}
            <div
              className="inline-flex flex-col items-center p-4 rounded-lg mb-4"
              style={{
                background: `radial-gradient(ellipse at center, rgba(212,168,67,0.1), transparent)`,
                border: `1px solid ${SEPIA.dustyBronze}`,
              }}
            >
              <span className="text-5xl mb-2">{backgroundEmoji}</span>
              <p className="font-bold text-lg" style={{ color: SEPIA.gold }}>
                {characterName}
              </p>
              <p className="text-sm" style={{ color: SEPIA.warmTan }}>
                {getBackgroundDisplayName(background)}
              </p>
              {character && (
                <p className="text-xs mt-1" style={{ color: SEPIA.dustyBronze }}>
                  Level {character.level}
                </p>
              )}
            </div>

            {/* S.A.D.D.L.E. stat block */}
            {character && (
              <div
                className="mx-auto max-w-sm rounded-lg p-3"
                style={{
                  backgroundColor: 'rgba(42, 31, 20, 0.8)',
                  border: `1px solid ${SEPIA.shadowBrown}`,
                }}
              >
                <p
                  className="text-xs tracking-widest uppercase mb-2 font-bold"
                  style={{ color: SEPIA.dustyBronze }}
                >
                  S.A.D.D.L.E. Stats
                </p>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                  {saddleStats.map((stat) => (
                    <div key={stat} className="flex justify-between text-xs">
                      <span style={{ color: SEPIA.warmTan }}>
                        {stat.charAt(0)}:
                      </span>
                      <span className="font-bold" style={{ color: SEPIA.gold }}>
                        {getStat(stat)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decorative bottom border */}
            <div
              className="mx-auto mt-4 flex items-center justify-center gap-2"
              style={{ color: SEPIA.darkGold }}
            >
              <span style={{ letterSpacing: '0.3em' }}>{'\u2500'.repeat(6)}</span>
              <span style={{ fontSize: '1.2em' }}>{'\u2726'}</span>
              <span style={{ letterSpacing: '0.3em' }}>{'\u2500'.repeat(6)}</span>
            </div>
          </div>

          {/* ================================================================
              SECTION 2: JOURNEY SUMMARY
              ================================================================ */}
          <div className="p-6 border-b" style={{ borderColor: SEPIA.shadowBrown }}>
            <SectionHeader title="Journey Summary" icon={'\u{1F5FA}'} />

            <div className="grid grid-cols-2 gap-4 mt-4">
              <StatCard label="Days on the Trail" value={String(trailState.daysOnTrail)} />
              <StatCard label="Miles Traversed" value={String(trailState.totalMilesTraveled)} />
              <StatCard label="Locations Visited" value={String(locationsVisitedList.length)} />
              <StatCard label="Rivers Crossed" value={String(trailState.riversCrossed)} />
            </div>

            {/* Locations list */}
            {locationsVisitedList.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: SEPIA.dustyBronze }}>
                  Landmarks Reached
                </p>
                <div className="flex flex-wrap gap-2">
                  {locationsVisitedList.map((loc) => (
                    <span
                      key={loc}
                      className="text-xs px-2 py-1 rounded"
                      style={{
                        backgroundColor: 'rgba(160, 128, 80, 0.15)',
                        border: `1px solid ${SEPIA.shadowBrown}`,
                        color: SEPIA.warmTan,
                      }}
                    >
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Weather flavor */}
            <p className="mt-4 text-sm italic" style={{ color: SEPIA.dustyBronze }}>
              Weather survived: {weatherFlavor}
            </p>

            <p className="mt-2 text-xs" style={{ color: SEPIA.shadowBrown }}>
              Pages in this journal: {pageCount}
            </p>
          </div>

          {/* ================================================================
              SECTION 3: CASE FILES
              ================================================================ */}
          {capturedOutlaws.length > 0 && (
            <div className="p-6 border-b" style={{ borderColor: SEPIA.shadowBrown }}>
              <SectionHeader title="Case Files" icon={'\u{1F4CB}'} />

              <p className="mt-2 text-sm" style={{ color: SEPIA.warmTan }}>
                {capturedOutlaws.length} outlaw{capturedOutlaws.length !== 1 ? 's' : ''} brought to justice.
                Investigation time: {mysteryState.investigationTime} hours.
              </p>

              <div className="grid gap-4 mt-4">
                {capturedOutlaws.map((outlaw) => (
                  <div
                    key={outlaw.id}
                    className="rounded-lg overflow-hidden"
                    style={{
                      border: `2px solid ${SEPIA.darkGold}`,
                      backgroundColor: 'rgba(42, 31, 20, 0.8)',
                    }}
                  >
                    {/* Wanted poster header */}
                    <div
                      className="px-4 py-3 text-center"
                      style={{
                        background: `linear-gradient(180deg, ${SEPIA.medBrown}, rgba(42, 31, 20, 0.9))`,
                        borderBottom: `1px solid ${SEPIA.darkGold}`,
                      }}
                    >
                      <p
                        className="text-xs tracking-[0.3em] uppercase font-bold"
                        style={{ color: SEPIA.dustyBronze }}
                      >
                        WANTED
                      </p>
                      <p className="font-bold text-lg" style={{ color: SEPIA.gold }}>
                        {outlaw.alias}
                      </p>
                      <p className="text-xs" style={{ color: SEPIA.warmTan }}>
                        {outlaw.realName}
                      </p>
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs" style={{ color: SEPIA.dustyBronze }}>
                          Bounty: <span style={{ color: SEPIA.gold }}>${outlaw.bounty}</span>
                        </p>
                        <p className="text-xs italic mt-1" style={{ color: SEPIA.warmTan }}>
                          &quot;{outlaw.catchphrase}&quot;
                        </p>
                      </div>
                      <div
                        className="px-3 py-1 rounded font-bold text-sm"
                        style={{
                          backgroundColor: 'rgba(139, 105, 20, 0.3)',
                          border: `2px solid ${SEPIA.darkGold}`,
                          color: SEPIA.gold,
                          transform: 'rotate(-5deg)',
                        }}
                      >
                        CAPTURED
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Key clues summary */}
              {mysteryState.collectedClues.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-wider mb-2" style={{ color: SEPIA.dustyBronze }}>
                    Key Clues That Cracked the Cases
                  </p>
                  <div className="space-y-1">
                    {mysteryState.collectedClues
                      .filter((c) => c.trait && c.value)
                      .slice(0, 5)
                      .map((clue) => (
                        <p key={clue.id} className="text-xs italic" style={{ color: SEPIA.warmTan }}>
                          {'\u2022'} &quot;{clue.text}&quot;
                          <span style={{ color: SEPIA.dustyBronze }}> ({clue.location})</span>
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              SECTION 4: CLUE COLLECTION
              ================================================================ */}
          {mysteryState.collectedClues.length > 0 && (
            <div className="p-6 border-b" style={{ borderColor: SEPIA.shadowBrown }}>
              <SectionHeader title="Clue Collection" icon={'\u{1F56F}'} />

              <p className="mt-2 text-sm" style={{ color: SEPIA.warmTan }}>
                {mysteryState.collectedClues.length} clues gathered across Gold Country.
              </p>

              <div className="mt-4 space-y-4">
                {Object.entries(cluesByLocation).map(([location, clues]) => (
                  <div key={location}>
                    <p
                      className="text-xs uppercase tracking-wider mb-2 font-bold"
                      style={{ color: SEPIA.dustyBronze }}
                    >
                      {location}
                    </p>
                    <div className="space-y-2">
                      {clues.map((clue) => {
                        const isReliable = clue.reliability >= 0.7
                        return (
                          <div
                            key={clue.id}
                            className="pl-3 rounded-r text-sm"
                            style={{
                              borderLeft: `2px solid ${isReliable ? SEPIA.darkGold : SEPIA.shadowBrown}`,
                            }}
                          >
                            <p className="italic" style={{ color: SEPIA.warmTan }}>
                              <span style={{ color: SEPIA.dustyBronze }}>
                                {isReliable ? '\u{1F56F}' : '\u{1F525}'}{' '}
                              </span>
                              &quot;{clue.text}&quot;
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: SEPIA.shadowBrown }}>
                              {'\u2014'} {clue.witnessType.replace(/_/g, ' ')} |{' '}
                              {Math.round(clue.reliability * 100)}% reliable
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================
              SECTION 5: REPUTATION RECORD
              ================================================================ */}
          <div className="p-6 border-b" style={{ borderColor: SEPIA.shadowBrown }}>
            <SectionHeader title="Reputation Record" icon={'\u{1F3DB}'} />

            <div className="mt-4 space-y-3">
              {(['pinkerton', 'settlers', 'natives', 'outlaws'] as FactionId[]).map((factionId) => {
                const faction = FACTIONS[factionId]
                const rep = repState.reputations[factionId]
                const normalizedRep = ((rep + 100) / 200) * 100 // -100..100 -> 0..100

                return (
                  <div key={factionId}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm" style={{ color: SEPIA.warmTan }}>
                        {faction.icon} {faction.name}
                      </span>
                      <span className="text-xs font-bold" style={{ color: SEPIA.gold }}>
                        {rep > 0 ? '+' : ''}{rep}
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: SEPIA.shadowBrown }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(2, normalizedRep)}%`,
                          backgroundColor: SEPIA.darkGold,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Notable choices */}
            {choicesMade.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider mb-2 font-bold" style={{ color: SEPIA.dustyBronze }}>
                  Notable Decisions
                </p>
                <div className="space-y-1">
                  {choicesMade.slice(0, 6).map((choice, i) => (
                    <p key={`${choice.choiceId}-${i}`} className="text-xs" style={{ color: SEPIA.warmTan }}>
                      {'\u2022'} {choice.consequence || `${choice.choiceId.replace(/_/g, ' ')} at ${choice.locationId.replace(/_/g, ' ')}`}
                    </p>
                  ))}
                  {choicesMade.length > 6 && (
                    <p className="text-xs" style={{ color: SEPIA.shadowBrown }}>
                      ...and {choicesMade.length - 6} more decisions along the trail.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Karma balance */}
            <div
              className="mt-4 p-3 rounded-lg"
              style={{
                backgroundColor: 'rgba(42, 31, 20, 0.8)',
                border: `1px solid ${SEPIA.shadowBrown}`,
              }}
            >
              <p className="text-xs uppercase tracking-wider mb-2 font-bold" style={{ color: SEPIA.dustyBronze }}>
                Karma Wallet Final Balance
              </p>
              <div className="flex gap-4 text-sm">
                <span style={{ color: SEPIA.warmTan }}>
                  {'\u{1F32E}'} {balance.neutral} Neutral
                </span>
                <span style={{ color: '#7cb87c' }}>
                  {'\u{1F36A}'} {balance.good} Good
                </span>
                <span style={{ color: '#c97070' }}>
                  {'\u{1FAA8}'} {balance.bad} Bad
                </span>
              </div>
            </div>
          </div>

          {/* ================================================================
              SECTION 6: RANCH REPORT
              ================================================================ */}
          {ranchState.unlocked && (
            <div className="p-6 border-b" style={{ borderColor: SEPIA.shadowBrown }}>
              <SectionHeader title="Ranch Report" icon={'\u{1F3E0}'} />

              <div className="grid grid-cols-2 gap-4 mt-4">
                <StatCard
                  label="Cattle"
                  value={String(ranchState.livestock.cattle)}
                />
                <StatCard
                  label="Horses"
                  value={String(ranchState.livestock.horses)}
                />
                <StatCard
                  label="Chickens"
                  value={String(ranchState.livestock.chickens)}
                />
                <StatCard
                  label="Goats"
                  value={String(ranchState.livestock.goats)}
                />
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: SEPIA.warmTan }}>Fence Tier Achieved:</span>
                  <span className="font-bold" style={{ color: SEPIA.gold }}>
                    Tier {ranchState.fenceTier}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: SEPIA.warmTan }}>Products Sold:</span>
                  <span className="font-bold" style={{ color: SEPIA.gold }}>
                    {ranchState.totalProductsSold}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-sm italic" style={{ color: SEPIA.dustyBronze }}>
                Your ranch at Back of Beyond continues to thrive, a testament to
                hard work and frontier spirit...
              </p>
            </div>
          )}

          {/* ================================================================
              SECTION 7: ACHIEVEMENTS & TRAITS
              ================================================================ */}
          <div className="p-6 border-b" style={{ borderColor: SEPIA.shadowBrown }}>
            <SectionHeader title="Achievements & Traits" icon={'\u{1F3C6}'} />

            {/* Discovered traits */}
            {character && character.traits.length > 0 && (
              <div className="mt-4">
                <p className="text-xs uppercase tracking-wider mb-2 font-bold" style={{ color: SEPIA.dustyBronze }}>
                  Discovered Traits
                </p>
                <div className="space-y-2">
                  {character.traits.map((traitId) => {
                    const trait = CHARACTER_TRAITS[traitId]
                    if (!trait) return null
                    return (
                      <div
                        key={traitId}
                        className="p-2 rounded"
                        style={{
                          backgroundColor: 'rgba(160, 128, 80, 0.1)',
                          border: `1px solid ${SEPIA.shadowBrown}`,
                        }}
                      >
                        <p className="text-sm font-bold" style={{ color: SEPIA.gold }}>
                          {trait.name}
                        </p>
                        <p className="text-xs" style={{ color: SEPIA.warmTan }}>
                          {trait.description}
                        </p>
                        {trait.specialAbility && (
                          <p className="text-xs italic mt-1" style={{ color: SEPIA.dustyBronze }}>
                            Special: {trait.specialAbility}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Stats achievements */}
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wider mb-2 font-bold" style={{ color: SEPIA.dustyBronze }}>
                Notable Achievements
              </p>
              <div className="grid grid-cols-2 gap-2">
                <AchievementBadge
                  label="Days Survived"
                  value={trailState.daysOnTrail}
                  threshold={30}
                />
                <AchievementBadge
                  label="Outlaws Captured"
                  value={capturedOutlaws.length}
                  threshold={1}
                />
                <AchievementBadge
                  label="Miles Traveled"
                  value={trailState.totalMilesTraveled}
                  threshold={1000}
                />
                <AchievementBadge
                  label="Clues Collected"
                  value={mysteryState.collectedClues.length}
                  threshold={5}
                />
                <AchievementBadge
                  label="Easter Eggs Found"
                  value={easterEggsCount}
                  threshold={1}
                />
                <AchievementBadge
                  label="Rivers Crossed"
                  value={trailState.riversCrossed}
                  threshold={2}
                />
              </div>
            </div>
          </div>

          {/* ================================================================
              SECTION 8: DISCOUNT CODE PRESENTATION
              ================================================================ */}
          {discountCode && discountPercent && (
            <div className="p-6 border-b" style={{ borderColor: SEPIA.shadowBrown }}>
              <DiscountPresentation
                code={discountCode}
                tier={discountTier}
                percent={discountPercent}
                endingType={endingType}
              />
            </div>
          )}

          {/* ================================================================
              SECTION 9: MARK TWAIN QUOTE
              ================================================================ */}
          <div
            className="p-6 text-center border-b"
            style={{ borderColor: SEPIA.shadowBrown }}
          >
            <div
              className="mx-auto max-w-md p-4 rounded-lg"
              style={{
                backgroundColor: 'rgba(42, 31, 20, 0.6)',
                border: `1px solid ${SEPIA.shadowBrown}`,
              }}
            >
              <p className="italic text-sm leading-relaxed" style={{ color: SEPIA.warmTan }}>
                &quot;{quote}&quot;
              </p>
              <p className="mt-2 text-xs" style={{ color: SEPIA.dustyBronze }}>
                {'\u2014'} Mark Twain
              </p>
            </div>
          </div>

          {/* ================================================================
              SECTION 10: EXPORT ACTIONS
              ================================================================ */}
          <div
            className="journal-no-print p-6"
            style={{ background: `linear-gradient(180deg, ${SEPIA.deepBrown}, ${SEPIA.medBrown})` }}
          >
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCopy}
                className="py-3 rounded font-bold text-sm transition-colors"
                style={{
                  backgroundColor: copied ? 'rgba(124, 184, 124, 0.3)' : SEPIA.shadowBrown,
                  color: copied ? '#7cb87c' : SEPIA.gold,
                  border: `1px solid ${copied ? '#4a7a4a' : SEPIA.dustyBronze}`,
                }}
              >
                {copied ? '\u2713 Copied!' : '\u{1F4CB} Copy to Clipboard'}
              </button>

              <button
                onClick={handleShare}
                className="py-3 rounded font-bold text-sm transition-colors"
                style={{
                  backgroundColor: shareError ? 'rgba(201, 112, 112, 0.3)' : SEPIA.shadowBrown,
                  color: shareError ? '#c97070' : SEPIA.gold,
                  border: `1px solid ${shareError ? '#7a4a4a' : SEPIA.dustyBronze}`,
                }}
              >
                {shareError ? 'Share Failed' : '\u{1F4E4} Share'}
              </button>

              <button
                onClick={handlePrint}
                className="py-3 rounded font-bold text-sm transition-colors"
                style={{
                  backgroundColor: SEPIA.shadowBrown,
                  color: SEPIA.gold,
                  border: `1px solid ${SEPIA.dustyBronze}`,
                }}
              >
                {'\u{1F5A8}'} Print
              </button>

              <button
                onClick={onClose}
                className="py-3 rounded font-bold text-sm transition-colors"
                style={{
                  backgroundColor: SEPIA.darkGold,
                  color: SEPIA.deepBrown,
                  border: `1px solid ${SEPIA.gold}`,
                }}
              >
                Close Journal
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function SectionHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <h2
          className="font-pixel text-lg tracking-wider"
          style={{ color: SEPIA.gold, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
        >
          {title}
        </h2>
        <div
          className="mt-1 h-px"
          style={{
            background: `linear-gradient(90deg, ${SEPIA.darkGold}, transparent)`,
            width: '200px',
          }}
        />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="p-3 rounded-lg text-center"
      style={{
        backgroundColor: 'rgba(42, 31, 20, 0.8)',
        border: `1px solid ${SEPIA.shadowBrown}`,
      }}
    >
      <p className="text-lg font-bold" style={{ color: SEPIA.gold }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: SEPIA.dustyBronze }}>
        {label}
      </p>
    </div>
  )
}

function AchievementBadge({
  label,
  value,
  threshold,
}: {
  label: string
  value: number
  threshold: number
}) {
  const achieved = value >= threshold
  return (
    <div
      className="p-2 rounded text-center"
      style={{
        backgroundColor: achieved
          ? 'rgba(212, 168, 67, 0.1)'
          : 'rgba(42, 31, 20, 0.5)',
        border: `1px solid ${achieved ? SEPIA.darkGold : SEPIA.shadowBrown}`,
      }}
    >
      <p className="text-sm font-bold" style={{ color: achieved ? SEPIA.gold : SEPIA.shadowBrown }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: achieved ? SEPIA.warmTan : SEPIA.shadowBrown }}>
        {label}
      </p>
    </div>
  )
}

function DiscountPresentation({
  code,
  tier,
  percent,
  endingType,
}: {
  code: string
  tier?: DiscountTier
  percent: number
  endingType: string
}) {
  const tierInfo = tier ? DISCOUNT_TIERS[tier] : null

  // Style based on ending type
  const frameStyles: Record<string, { border: string; bg: string; title: string; icon: string }> = {
    rancher: {
      border: `3px double ${SEPIA.darkGold}`,
      bg: `linear-gradient(135deg, rgba(42,31,20,0.9), rgba(61,43,24,0.9))`,
      title: 'PROPERTY DEED',
      icon: '\u{1F3E0}',
    },
    detective: {
      border: `2px solid ${SEPIA.warmTan}`,
      bg: `linear-gradient(135deg, rgba(30,25,18,0.95), rgba(50,38,25,0.95))`,
      title: 'EVIDENCE ENVELOPE',
      icon: '\u{1F575}',
    },
    gambler: {
      border: `2px solid ${SEPIA.gold}`,
      bg: `linear-gradient(135deg, rgba(20,15,10,0.95), rgba(42,31,20,0.95))`,
      title: 'LUCKY CARD',
      icon: '\u{1F0CF}',
    },
    golden_hooves: {
      border: `3px solid ${SEPIA.gold}`,
      bg: `linear-gradient(135deg, rgba(139,105,20,0.15), rgba(42,31,20,0.95), rgba(139,105,20,0.15))`,
      title: 'TREASURE MAP',
      icon: '\u{1F5FA}',
    },
    default: {
      border: `2px solid ${SEPIA.dustyBronze}`,
      bg: `linear-gradient(180deg, rgba(42,31,20,0.9), rgba(61,43,24,0.9))`,
      title: 'PARCHMENT SCROLL',
      icon: '\u{1F4DC}',
    },
  }

  const frame = frameStyles[endingType] || frameStyles.default

  return (
    <div>
      <SectionHeader title="Your Reward" icon={'\u{1F381}'} />

      <div
        className="mt-4 rounded-lg overflow-hidden text-center"
        style={{
          border: frame.border,
          background: frame.bg,
          boxShadow: `0 4px 20px rgba(212, 168, 67, 0.1), inset 0 0 30px rgba(0,0,0,0.2)`,
        }}
      >
        {/* Frame header */}
        <div className="py-3" style={{ borderBottom: `1px solid ${SEPIA.shadowBrown}` }}>
          <p className="text-xs tracking-[0.4em] uppercase" style={{ color: SEPIA.dustyBronze }}>
            {frame.icon} {frame.title} {frame.icon}
          </p>
        </div>

        {/* Code and details */}
        <div className="p-6">
          {tierInfo && (
            <p className="text-sm mb-2" style={{ color: SEPIA.warmTan }}>
              {tierInfo.badge} {tierInfo.displayName} Rank
            </p>
          )}

          <p
            className="text-2xl md:text-3xl font-mono tracking-widest font-bold my-3"
            style={{ color: SEPIA.gold, textShadow: '0 2px 8px rgba(212,168,67,0.3)' }}
          >
            {code}
          </p>

          <p className="text-lg font-bold" style={{ color: SEPIA.gold }}>
            {percent}% OFF
          </p>

          <p className="mt-3 text-sm" style={{ color: SEPIA.warmTan }}>
            Present at Back of Beyond Ranch, Airbnb
          </p>

          <a
            href="https://airbnb.com/h/backofbeyondranch"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs underline transition-colors"
            style={{ color: SEPIA.dustyBronze }}
            onMouseEnter={(e) => { e.currentTarget.style.color = SEPIA.gold }}
            onMouseLeave={(e) => { e.currentTarget.style.color = SEPIA.dustyBronze }}
          >
            airbnb.com/h/backofbeyondranch
          </a>
        </div>

        {/* Ranch description */}
        <div
          className="px-6 py-4"
          style={{
            borderTop: `1px solid ${SEPIA.shadowBrown}`,
            backgroundColor: 'rgba(0,0,0,0.15)',
          }}
        >
          <p className="text-sm italic leading-relaxed" style={{ color: SEPIA.warmTan }}>
            The real gold was never in the rivers. It was in the sunsets
            over the Sierra foothills, the quiet of a ranch morning, the
            crackle of an evening fire under a canopy of stars. Your
            adventure doesn&apos;t end here {'\u2014'} it continues at Back of Beyond.
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EXPORT
// ============================================================================

export default JournalSouvenir
