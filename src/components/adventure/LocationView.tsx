'use client'

import React, { useState, useCallback } from 'react'
import {
  getLocationById as getChapterLocation,
  type ChapterLocation,
  type LocationNPC,
  type LocationService,
  type DiscoveryClue,
} from '@/app/adventure/data/chapterLocations'
import type { StatName, SkillCheckResult } from '@/app/oregon-trail/characterContext'
import { playSFX } from '@/app/oregon-trail/lib/audioManager'
import { DOSMessage } from '@/components/ui/DOSMessage'

interface LocationViewProps {
  locationId: string
  onReturnToMap: () => void
  onNPCTalk: (npc: LocationNPC) => void
  onSkillCheck: (stat: StatName, difficulty: number) => SkillCheckResult
  onEarnKarma: (amount: number, memo: string) => void
  onSpendKarma?: (amount: number, memo: string) => boolean
  onAddXP: (amount: number) => void
  onClueAnswered?: (clue: DiscoveryClue, correct: boolean) => void
  onGameStateChanged?: () => void
  playerStats: Record<StatName, number>
}

type ViewMode = 'main' | 'npc_list' | 'services' | 'search' | 'clues'
  | 'svc_shop' | 'svc_sheriff' | 'svc_inn' | 'svc_blacksmith' | 'svc_saloon' | 'svc_stable' | 'svc_church'

const SERVICE_ICONS: Record<string, string> = {
  shop: '\uD83D\uDED2',
  inn: '\uD83C\uDFE8',
  blacksmith: '\u2692\uFE0F',
  saloon: '\uD83C\uDF7A',
  church: '\u26EA',
  sheriff: '\u2B50',
  stable: '\uD83D\uDC0E',
}

const ATMOSPHERE_GRADIENTS: Record<string, string> = {
  bustling: 'from-amber-950 via-stone-950 to-black',
  peaceful: 'from-emerald-950 via-stone-950 to-black',
  dangerous: 'from-red-950 via-stone-950 to-black',
  orderly: 'from-blue-950 via-stone-950 to-black',
  ancient: 'from-purple-950 via-stone-950 to-black',
  historic: 'from-amber-950 via-yellow-950 to-black',
  mysterious: 'from-indigo-950 via-stone-950 to-black',
  secretive: 'from-indigo-950 via-stone-950 to-black',
  charming: 'from-pink-950 via-stone-950 to-black',
  rough: 'from-orange-950 via-stone-950 to-black',
  haunting: 'from-gray-950 via-stone-950 to-black',
  dark: 'from-slate-950 via-stone-950 to-black',
  elegant: 'from-rose-950 via-stone-950 to-black',
  festive: 'from-amber-950 via-stone-950 to-black',
  wondrous: 'from-cyan-950 via-stone-950 to-black',
  majestic: 'from-emerald-950 via-stone-950 to-black',
  hopeful: 'from-amber-950 via-stone-950 to-black',
  industrial: 'from-orange-950 via-stone-950 to-black',
  rustic: 'from-yellow-950 via-stone-950 to-black',
  official: 'from-blue-950 via-stone-950 to-black',
  nostalgic: 'from-amber-950 via-stone-950 to-black',
  wild: 'from-green-950 via-stone-950 to-black',
}

// ========================================
// SHOP INVENTORY
// ========================================

interface ShopItem {
  id: string
  name: string
  icon: string
  flavor: string
  cost: number
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'rope', name: 'Sturdy Rope', icon: '\uD83E\uDE62', flavor: 'Fifty feet of hemp rope. Essential for river crossings and mountain passes.', cost: 15 },
  { id: 'medicine', name: 'Trail Medicine', icon: '\uD83E\uDDEA', flavor: 'A pouch of dried herbs and tinctures. Keeps fever and snakebite at bay.', cost: 20 },
  { id: 'rations', name: 'Dry Rations', icon: '\uD83E\uDD69', flavor: 'Hardtack, jerky, and dried fruit. Not tasty, but it keeps you moving.', cost: 10 },
  { id: 'ammo', name: 'Ammunition Box', icon: '\uD83D\uDCA5', flavor: 'A box of .44 caliber rounds. The frontier respects a loaded gun.', cost: 25 },
  { id: 'lantern', name: 'Oil Lantern', icon: '\uD83E\uDE94', flavor: 'A brass lantern with a full reservoir. Light in dark places.', cost: 18 },
]

export function LocationView({
  locationId,
  onReturnToMap,
  onNPCTalk,
  onSkillCheck,
  onEarnKarma,
  onSpendKarma,
  onAddXP,
  onClueAnswered,
  onGameStateChanged,
  playerStats,
}: LocationViewProps) {
  const [view, setView] = useState<ViewMode>('main')
  const [searchResult, setSearchResult] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [clueAnswer, setClueAnswer] = useState('')
  const [activeClue, setActiveClue] = useState<DiscoveryClue | null>(null)
  const [clueResult, setClueResult] = useState<{ correct: boolean; message: string } | null>(null)
  const [answeredClueIds, setAnsweredClueIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem('bobr_answered_clues')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })

  // Service interaction state
  const [svcMessage, setSvcMessage] = useState<string | null>(null)
  const [svcSuccess, setSvcSuccess] = useState<boolean | null>(null)
  const [purchasedItems, setPurchasedItems] = useState<Set<string>>(new Set())

  // All hooks must be called before any early returns (React rules-of-hooks)
  const handleSubmitClueAnswer = useCallback((clue: DiscoveryClue) => {
    const trimmed = clueAnswer.trim().toLowerCase()
    const isCorrect = clue.acceptableAnswers.some(a => a.toLowerCase() === trimmed)

    if (isCorrect) {
      onAddXP(clue.xpReward)
      onEarnKarma(clue.karmaReward.good, `Clue: ${clue.id}`)
      setClueResult({ correct: true, message: 'Correct! Your knowledge of the trail serves you well.' })
      const updated = new Set(answeredClueIds)
      updated.add(clue.id)
      setAnsweredClueIds(updated)
      try { localStorage.setItem('bobr_answered_clues', JSON.stringify([...updated])) } catch {}
      onClueAnswered?.(clue, true)
      onGameStateChanged?.()
    } else {
      setClueResult({ correct: false, message: 'Not quite right. Perhaps the hint can guide you...' })
      onClueAnswered?.(clue, false)
    }
    setClueAnswer('')
  }, [clueAnswer, answeredClueIds, onAddXP, onEarnKarma, onClueAnswered, onGameStateChanged])

  const handleSearch = useCallback(() => {
    setIsSearching(true)
    setTimeout(() => {
      const result = onSkillCheck('Expertise', 10)
      if (result.success) {
        onAddXP(15)
        setSearchResult('You search the area carefully and find something interesting. Your investigation skills have improved.')
      } else {
        onAddXP(5)
        setSearchResult('You search thoroughly but find nothing of note. The area has been picked clean.')
      }
      setIsSearching(false)
      onGameStateChanged?.()
    }, 1500)
  }, [onSkillCheck, onAddXP, onGameStateChanged])

  const location = getChapterLocation(locationId)
  if (!location) {
    return (
      <div className="p-4 text-center">
        <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-fire-orange)]">
          Location not found: {locationId}
        </p>
        <button onClick={onReturnToMap} className="mt-2 font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] underline">
          Return to Map
        </button>
      </div>
    )
  }

  const gradient = ATMOSPHERE_GRADIENTS[location.atmosphere] ?? 'from-stone-950 to-black'
  const unansweredClues = (location.discoveryClues ?? []).filter(c => !answeredClueIds.has(c.id))

  // Open a service sub-view, resetting messages
  const openService = (svcType: string) => {
    setSvcMessage(null)
    setSvcSuccess(null)
    const viewKey = `svc_${svcType}` as ViewMode
    setView(viewKey)
  }

  // Back button to services list
  const backToServices = () => {
    setSvcMessage(null)
    setSvcSuccess(null)
    setView('services')
  }

  // Shared service panel header
  const SvcHeader = ({ icon, title }: { icon: string; title: string }) => (
    <div className="mb-3">
      <button
        onClick={backToServices}
        className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] mb-2"
      >
        {'\u2190'} BACK
      </button>
      <h3 className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)]">
        {icon} {title}
      </h3>
    </div>
  )

  // Result message display
  const SvcResult = () => {
    if (!svcMessage) return null
    return (
      <div className={`mt-3 p-2 border-2 ${
        svcSuccess ? 'border-green-700 bg-green-950/30' : svcSuccess === false ? 'border-red-700 bg-red-950/30' : 'border-[var(--pixel-ui-border)] bg-black/30'
      }`}>
        <DOSMessage text={svcMessage} speed={20} sfxEvery={0} className={`font-[var(--font-pixel)] text-[9px] whitespace-pre-line ${
          svcSuccess ? 'text-green-400' : svcSuccess === false ? 'text-red-400' : 'text-[var(--pixel-ui-text)]'
        }`} />
      </div>
    )
  }

  // Perform a skill check with visible feedback
  const doServiceCheck = (stat: StatName, dc: number, successMsg: string, failMsg: string, successXP: number, failXP: number) => {
    const result = onSkillCheck(stat, dc)
    const rolled = `[${stat} check: rolled ${result.total} vs DC ${dc}]`
    if (result.success) {
      onAddXP(successXP)
      setSvcSuccess(true)
      setSvcMessage(`${rolled}\n${successMsg} (+${successXP} XP)`)
    } else {
      onAddXP(failXP)
      setSvcSuccess(false)
      setSvcMessage(`${rolled}\n${failMsg} (+${failXP} XP)`)
    }
    onGameStateChanged?.()
  }

  return (
    <div className={`bg-gradient-to-b ${gradient} min-h-[500px] animate-slide-in-up`}>
      {/* Location Header */}
      <div className="p-4 border-b-2 border-[var(--pixel-ui-border)]/30">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-gold-light)]">
              {location.icon} {location.name}
            </h2>
            <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-70 mt-1">
              {location.description}
            </p>
          </div>
          <button
            onClick={onReturnToMap}
            className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] px-3 py-1 border border-[var(--pixel-ui-border)] hover:border-[var(--pixel-gold-dark)]"
          >
            {'\u2190'} MAP
          </button>
        </div>
        {location.historicalFact && (
          <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-earth-light)] mt-2 italic opacity-60">
            &quot;{location.historicalFact}&quot;
          </p>
        )}
      </div>

      {/* Main Actions */}
      {view === 'main' && (
        <div className="p-4 space-y-3">
          {/* NPC interactions */}
          {location.npcs.length > 0 && (
            <button
              onClick={() => setView('npc_list')}
              className="w-full text-left p-3 bg-black/30 border-2 border-[var(--pixel-ui-border)] hover:border-[var(--pixel-gold-dark)] transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">
                    {'\uD83D\uDDE3\uFE0F'} TALK TO PEOPLE
                  </span>
                  <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-50 mt-1">
                    {location.npcs.length} {location.npcs.length === 1 ? 'person' : 'people'} here
                  </p>
                </div>
                <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">{'\u25B6'}</span>
              </div>
            </button>
          )}

          {/* Services */}
          {location.services.length > 0 && (
            <button
              onClick={() => setView('services')}
              className="w-full text-left p-3 bg-black/30 border-2 border-[var(--pixel-ui-border)] hover:border-[var(--pixel-gold-dark)] transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">
                    {'\uD83C\uDFE0'} VISIT ESTABLISHMENTS
                  </span>
                  <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-50 mt-1">
                    {location.services.map(s => s.name).join(', ')}
                  </p>
                </div>
                <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">{'\u25B6'}</span>
              </div>
            </button>
          )}

          {/* Search area */}
          <button
            onClick={() => setView('search')}
            className="w-full text-left p-3 bg-black/30 border-2 border-[var(--pixel-ui-border)] hover:border-[var(--pixel-gold-dark)] transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">
                  {'\uD83D\uDD0D'} SEARCH THE AREA
                </span>
                <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-50 mt-1">
                  Look for clues, items, and hidden paths
                </p>
              </div>
              <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">{'\u25B6'}</span>
            </div>
          </button>

          {/* Investigation (if clues available) */}
          {location.clueIds && location.clueIds.length > 0 && (
            <div className="p-3 bg-[var(--pixel-gold-dark)]/20 border-2 border-[var(--pixel-gold-mid)]/50">
              <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
                {'\uD83D\uDCCB'} ACTIVE INVESTIGATION
              </span>
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-70 mt-1">
                Clues may be found here. Talk to witnesses and search carefully.
              </p>
            </div>
          )}

          {/* Discovery Clues */}
          {unansweredClues.length > 0 && (
            <button
              onClick={() => setView('clues')}
              className="w-full text-left p-3 bg-[var(--pixel-fire-orange)]/10 border-2 border-[var(--pixel-fire-orange)]/50 hover:border-[var(--pixel-fire-orange)] transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-fire-orange)]">
                    {'\u2753'} DISCOVERY CLUES
                  </span>
                  <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-50 mt-1">
                    {unansweredClues.length} clue{unansweredClues.length !== 1 ? 's' : ''} to discover — answer for XP and rewards
                  </p>
                </div>
                <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-fire-orange)]">{'\u25B6'}</span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* NPC List */}
      {view === 'npc_list' && (
        <div className="p-4 space-y-2">
          <button
            onClick={() => setView('main')}
            className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] mb-2"
          >
            {'\u2190'} BACK
          </button>
          <h3 className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] mb-3">
            PEOPLE AT {location.name.toUpperCase()}
          </h3>
          {location.npcs.map(npc => {
            const hasSkillCheck = npc.skillCheckStat && npc.skillCheckDC
            const canPass = hasSkillCheck
              ? (playerStats[npc.skillCheckStat!] ?? 0) >= (npc.skillCheckDC! - 2)
              : true

            return (
              <button
                key={npc.id}
                onClick={() => onNPCTalk(npc)}
                className="w-full text-left p-3 bg-black/30 border-2 border-[var(--pixel-ui-border)] hover:border-[var(--pixel-gold-dark)] transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">
                      {npc.name}
                    </span>
                    <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-50">
                      {npc.role}
                    </p>
                    <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-40 mt-1">
                      {npc.dialogueHint}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {npc.faction && (
                      <span className="font-[var(--font-pixel)] text-[7px] px-1 border border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)]">
                        {npc.faction}
                      </span>
                    )}
                    {hasSkillCheck && (
                      <span className={`font-[var(--font-pixel)] text-[7px] px-1 border ${
                        canPass
                          ? 'text-[var(--pixel-forest-light)] border-[var(--pixel-forest-dark)]'
                          : 'text-[var(--pixel-fire-orange)] border-[var(--pixel-fire-red)]'
                      }`}>
                        {npc.skillCheckStat} DC{npc.skillCheckDC}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Services List */}
      {view === 'services' && (
        <div className="p-4 space-y-2">
          <button
            onClick={() => setView('main')}
            className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] mb-2"
          >
            {'\u2190'} BACK
          </button>
          <h3 className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] mb-3">
            ESTABLISHMENTS
          </h3>
          {location.services.map(service => (
            <button
              key={service.type}
              onClick={() => openService(service.type)}
              className="w-full text-left p-3 bg-black/30 border-2 border-[var(--pixel-ui-border)] hover:border-[var(--pixel-gold-dark)] transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{SERVICE_ICONS[service.type] ?? '\uD83C\uDFE0'}</span>
                    <span className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">
                      {service.name}
                    </span>
                  </div>
                  <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-60">
                    {service.description}
                  </p>
                </div>
                <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">{'\u25B6'}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ===================== SHOP ===================== */}
      {view === 'svc_shop' && (
        <div className="p-4">
          <SvcHeader icon={SERVICE_ICONS.shop} title="GENERAL STORE" />
          <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-70 mb-3 italic">
            You browse the goods on display. Dust motes dance in the lamplight as the shopkeeper watches.
          </p>
          <div className="space-y-2">
            {SHOP_ITEMS.map(item => {
              const bought = purchasedItems.has(item.id)
              return (
                <div key={item.id} className="p-2 bg-black/30 border-2 border-[var(--pixel-ui-border)] flex items-start gap-3">
                  <span className="text-lg shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">{item.name}</span>
                      <span className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)] shrink-0">{item.cost} karma</span>
                    </div>
                    <p className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-ui-text)] opacity-50 mt-1">{item.flavor}</p>
                  </div>
                  <button
                    disabled={bought}
                    onClick={() => {
                      const spent = onSpendKarma?.(item.cost, `Bought ${item.name}`)
                      if (spent) {
                        playSFX('coin')
                        setPurchasedItems(prev => new Set(prev).add(item.id))
                        onAddXP(3)
                        setSvcSuccess(true)
                        setSvcMessage(`Purchased ${item.name}! The shopkeeper nods approvingly.`)
                      } else {
                        setSvcSuccess(false)
                        setSvcMessage('Not enough karma to afford that.')
                      }
                    }}
                    className={`shrink-0 font-[var(--font-pixel)] text-[9px] px-2 py-1 border transition-all ${
                      bought
                        ? 'text-green-500 border-green-800 opacity-60 cursor-default'
                        : 'text-[var(--pixel-gold-light)] border-[var(--pixel-gold-dark)] hover:bg-[var(--pixel-gold-dark)]/20'
                    }`}
                  >
                    {bought ? 'OWNED' : 'BUY'}
                  </button>
                </div>
              )
            })}
          </div>
          <SvcResult />
        </div>
      )}

      {/* ===================== INN ===================== */}
      {view === 'svc_inn' && (
        <div className="p-4">
          <SvcHeader icon={SERVICE_ICONS.inn} title="INN" />
          <div className="p-3 bg-black/30 border-2 border-[var(--pixel-ui-border)]">
            <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-70 italic mb-3">
              You rest at the inn. The warmth of the fire and a proper bed ease the weariness from your bones.
            </p>
            <button
              onClick={() => {
                onEarnKarma(0, 'Rested at inn')
                onAddXP(5)
                setSvcSuccess(true)
                setSvcMessage('You feel rested and restored. (+5 XP)')
              }}
              className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-forest-light)] border border-[var(--pixel-forest-dark)] px-3 py-1 hover:bg-[var(--pixel-forest-dark)]/20 transition-all"
            >
              REST (Restores Health)
            </button>
          </div>
          <SvcResult />
        </div>
      )}

      {/* ===================== SHERIFF ===================== */}
      {view === 'svc_sheriff' && (
        <div className="p-4">
          <SvcHeader icon={SERVICE_ICONS.sheriff} title="SHERIFF&apos;S OFFICE" />
          <div className="p-3 bg-black/30 border-2 border-[var(--pixel-ui-border)]">
            <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-70 italic mb-3">
              The sheriff listens to your report, chewing tobacco thoughtfully. He leans back and studies a map on the wall.
            </p>
            <button
              onClick={() => {
                doServiceCheck(
                  'Shrewdness', 10,
                  'You piece together a new lead! The sheriff tips his hat in respect.',
                  'Nothing new turns up this time. The trail has gone cold.',
                  10, 3,
                )
                onEarnKarma(1, 'Investigated at sheriff')
              }}
              className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-gold-light)] border border-[var(--pixel-gold-dark)] px-3 py-1 hover:bg-[var(--pixel-gold-dark)]/20 transition-all"
            >
              REPORT / INVESTIGATE
            </button>
          </div>
          <SvcResult />
        </div>
      )}

      {/* ===================== BLACKSMITH ===================== */}
      {view === 'svc_blacksmith' && (
        <div className="p-4">
          <SvcHeader icon={SERVICE_ICONS.blacksmith} title="BLACKSMITH" />
          <div className="p-3 bg-black/30 border-2 border-[var(--pixel-ui-border)]">
            <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-70 italic mb-3">
              The forge glows hot. The blacksmith wipes soot from his brow and looks at your worn equipment.
            </p>
            <button
              onClick={() => {
                doServiceCheck(
                  'Durability', 10,
                  'Your equipment is restored! The smith hammers out every dent with expert precision.',
                  'The smith does what he can. Some wear remains, but it will hold... for now.',
                  10, 3,
                )
              }}
              className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-gold-light)] border border-[var(--pixel-gold-dark)] px-3 py-1 hover:bg-[var(--pixel-gold-dark)]/20 transition-all"
            >
              REPAIR GEAR
            </button>
          </div>
          <SvcResult />
        </div>
      )}

      {/* ===================== SALOON ===================== */}
      {view === 'svc_saloon' && (
        <div className="p-4">
          <SvcHeader icon={SERVICE_ICONS.saloon} title="SALOON" />
          <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-70 italic mb-3">
            Piano music drifts through tobacco smoke. The bartender polishes a glass and eyes you from across the bar.
          </p>
          <div className="space-y-2">
            <div className="p-3 bg-black/30 border-2 border-[var(--pixel-ui-border)]">
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-50 mb-2">
                Buy drinks for the locals. Good for your reputation if you can hold a conversation.
              </p>
              <button
                onClick={() => {
                  const result = onSkillCheck('Diplomacy', 10)
                  const rolled = `[Diplomacy check: rolled ${result.total} vs DC 10]`
                  if (result.success) {
                    onAddXP(8)
                    onEarnKarma(2, 'Bought a round at the saloon')
                    setSvcSuccess(true)
                    setSvcMessage(`${rolled}\nThe crowd cheers! Your generosity is noted by all factions. (+8 XP, +2 karma)`)
                  } else {
                    onAddXP(3)
                    setSvcSuccess(false)
                    setSvcMessage(`${rolled}\nYou buy a round but spill half of it. The crowd is unimpressed. (+3 XP)`)
                  }
                }}
                className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-gold-light)] border border-[var(--pixel-gold-dark)] px-3 py-1 hover:bg-[var(--pixel-gold-dark)]/20 transition-all"
              >
                {'\uD83C\uDF7B'} BUY A ROUND
              </button>
            </div>
            <div className="p-3 bg-black/30 border-2 border-[var(--pixel-ui-border)]">
              <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-50 mb-2">
                Keep your ears open. Shrewd travelers pick up useful gossip in places like this.
              </p>
              <button
                onClick={() => {
                  const result = onSkillCheck('Shrewdness', 12)
                  const rolled = `[Shrewdness check: rolled ${result.total} vs DC 12]`
                  if (result.success) {
                    onAddXP(10)
                    const rumors = [
                      'Heard tell of a hidden cache near the old mine road...',
                      'A stranger passed through last week asking about the canyon trail.',
                      'The native traders know a shortcut through the mountains.',
                      'They say the fort has doubled its patrols on the south road.',
                      'A merchant lost a shipment near the river crossing. Might be worth a look.',
                    ]
                    const rumor = rumors[Math.floor(Math.random() * rumors.length)]
                    setSvcSuccess(true)
                    setSvcMessage(`${rolled}\nYou overhear something interesting: "${rumor}" (+10 XP)`)
                  } else {
                    onAddXP(3)
                    setSvcSuccess(false)
                    setSvcMessage(`${rolled}\nThe locals clam up when you lean in. Nothing useful tonight. (+3 XP)`)
                  }
                }}
                className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-gold-light)] border border-[var(--pixel-gold-dark)] px-3 py-1 hover:bg-[var(--pixel-gold-dark)]/20 transition-all"
              >
                {'\uD83D\uDC42'} LISTEN TO RUMORS
              </button>
            </div>
          </div>
          <SvcResult />
        </div>
      )}

      {/* ===================== STABLE ===================== */}
      {view === 'svc_stable' && (
        <div className="p-4">
          <SvcHeader icon={SERVICE_ICONS.stable} title="STABLE" />
          <div className="p-3 bg-black/30 border-2 border-[var(--pixel-ui-border)]">
            <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-70 italic mb-3">
              The stable smells of hay and leather. Horses stamp and snort in their stalls. A seasoned hand can always find work here.
            </p>
            <button
              onClick={() => {
                doServiceCheck(
                  'Expertise', 10,
                  'You tend the animals with a steady hand. The stablemaster is impressed with your skill.',
                  'You do your best, but the horses are skittish today. At least you tried.',
                  10, 3,
                )
              }}
              className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-gold-light)] border border-[var(--pixel-gold-dark)] px-3 py-1 hover:bg-[var(--pixel-gold-dark)]/20 transition-all"
            >
              TEND ANIMALS
            </button>
          </div>
          <SvcResult />
        </div>
      )}

      {/* Fallback for church or other service types without custom panel */}
      {view === 'svc_church' && (
        <div className="p-4">
          <SvcHeader icon={SERVICE_ICONS.church ?? '\u26EA'} title="CHURCH" />
          <div className="p-3 bg-black/30 border-2 border-[var(--pixel-ui-border)]">
            <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] opacity-70 italic mb-3">
              The quiet interior offers a moment of peace. Candlelight flickers against the wooden walls.
            </p>
            <button
              onClick={() => {
                playSFX('success')
                onAddXP(5)
                onEarnKarma(1, 'Prayed at church')
                setSvcSuccess(true)
                setSvcMessage('You spend a moment in quiet reflection. It steadies your resolve. (+5 XP, +1 karma)')
              }}
              className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-forest-light)] border border-[var(--pixel-forest-dark)] px-3 py-1 hover:bg-[var(--pixel-forest-dark)]/20 transition-all"
            >
              PRAY
            </button>
          </div>
          <SvcResult />
        </div>
      )}

      {/* Search */}
      {view === 'search' && (
        <div className="p-4">
          <button
            onClick={() => { setView('main'); setSearchResult(null) }}
            className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] mb-2"
          >
            {'\u2190'} BACK
          </button>
          <h3 className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-light)] mb-3">
            SEARCH: {location.name.toUpperCase()}
          </h3>
          <div className="bg-black/30 border-2 border-[var(--pixel-ui-border)] p-4">
            {isSearching ? (
              <div className="text-center">
                <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] animate-pulse">
                  Searching...
                </p>
              </div>
            ) : searchResult ? (
              <div>
                <DOSMessage text={searchResult} speed={20} sfxEvery={0} className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)]" />
                <button
                  onClick={() => setSearchResult(null)}
                  className="mt-3 font-[var(--font-pixel)] text-[9px] text-[var(--pixel-gold-light)] border border-[var(--pixel-gold-dark)] px-2 py-1"
                >
                  SEARCH AGAIN
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] mb-3">
                  You survey the area around {location.name}. An Expertise check determines what you find.
                </p>
                <button
                  onClick={handleSearch}
                  className="font-[var(--font-pixel)] text-[11px] bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold-mid)] text-[var(--pixel-gold-light)] px-6 py-2 hover:bg-[var(--pixel-gold-mid)] transition-all"
                >
                  {'\uD83D\uDD0D'} SEARCH
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Discovery Clues */}
      {view === 'clues' && (
        <div className="p-4 space-y-3">
          <button
            onClick={() => { setView('main'); setActiveClue(null); setClueResult(null) }}
            className="font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] hover:text-[var(--pixel-gold-light)] mb-2"
          >
            {'\u2190'} BACK
          </button>
          <h3 className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-fire-orange)] mb-3">
            DISCOVERY CLUES AT {location.name.toUpperCase()}
          </h3>

          {!activeClue ? (
            <div className="space-y-2">
              {unansweredClues.map(clue => (
                <button
                  key={clue.id}
                  onClick={() => { setActiveClue(clue); setClueResult(null) }}
                  className="w-full text-left p-3 bg-black/30 border-2 border-[var(--pixel-ui-border)] hover:border-[var(--pixel-fire-orange)] transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">
                        {clue.question}
                      </span>
                      <div className="flex gap-2 mt-1">
                        <span className={`font-[var(--font-pixel)] text-[7px] px-1 border ${
                          clue.difficulty === 'easy' ? 'text-green-400 border-green-800' :
                          clue.difficulty === 'medium' ? 'text-yellow-400 border-yellow-800' :
                          'text-red-400 border-red-800'
                        }`}>
                          {clue.difficulty.toUpperCase()}
                        </span>
                        <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-gold-light)]">
                          +{clue.xpReward} XP
                        </span>
                        {clue.isListingClue && (
                          <span className="font-[var(--font-pixel)] text-[7px] text-[var(--pixel-fire-orange)] border border-[var(--pixel-fire-orange)]/50 px-1">
                            RANCH CLUE
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">{'\u25B6'}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-black/30 border-2 border-[var(--pixel-fire-orange)]/50 p-4">
              <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)] mb-3">
                {activeClue.question}
              </p>

              {/* Hint */}
              <div className="mb-3 p-2 bg-[var(--pixel-gold-dark)]/20 border border-[var(--pixel-gold-dark)]">
                <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)]">
                  HINT: {activeClue.hintText}
                </p>
                {activeClue.hintUrl && (
                  <a
                    href={`${activeClue.hintUrl}?utm_source=bobr_game&utm_medium=clue&utm_campaign=discovery_${activeClue.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 font-[var(--font-pixel)] text-[9px] bg-[var(--pixel-fire-orange)] text-[var(--pixel-bg-dark)] px-3 py-1 border border-[var(--pixel-ui-border)] hover:bg-[var(--pixel-gold-mid)] transition-colors"
                  >
                    SEARCH THE LISTING
                  </a>
                )}
              </div>

              {/* Answer input */}
              {clueResult ? (
                <div className={`p-3 border-2 ${clueResult.correct ? 'border-green-600 bg-green-950/30' : 'border-red-600 bg-red-950/30'}`}>
                  <p className={`font-[var(--font-pixel)] text-[10px] ${clueResult.correct ? 'text-green-400' : 'text-red-400'}`}>
                    {clueResult.correct ? '\u2713' : '\u2717'} {clueResult.message}
                  </p>
                  {clueResult.correct && (
                    <p className="font-[var(--font-pixel)] text-[8px] text-[var(--pixel-gold-light)] mt-1">
                      +{activeClue.xpReward} XP earned
                    </p>
                  )}
                  <button
                    onClick={() => {
                      if (clueResult.correct) {
                        setActiveClue(null)
                        setClueResult(null)
                        if (unansweredClues.length <= 1) setView('main')
                      } else {
                        setClueResult(null)
                      }
                    }}
                    className="mt-2 font-[var(--font-pixel)] text-[9px] text-[var(--pixel-ui-text)] border border-[var(--pixel-ui-border)] px-3 py-1 hover:text-[var(--pixel-gold-light)]"
                  >
                    {clueResult.correct ? 'NEXT CLUE' : 'TRY AGAIN'}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clueAnswer}
                    onChange={(e) => setClueAnswer(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && clueAnswer.trim()) handleSubmitClueAnswer(activeClue) }}
                    placeholder="Type your answer..."
                    className="flex-1 bg-black/50 border-2 border-[var(--pixel-ui-border)] text-[var(--pixel-ui-text)] font-[var(--font-pixel)] text-[10px] px-2 py-1 focus:border-[var(--pixel-fire-orange)] outline-none"
                  />
                  <button
                    onClick={() => handleSubmitClueAnswer(activeClue)}
                    disabled={!clueAnswer.trim()}
                    className="font-[var(--font-pixel)] text-[10px] bg-[var(--pixel-fire-orange)] text-[var(--pixel-bg-dark)] px-3 py-1 border-2 border-[var(--pixel-ui-border)] hover:bg-[var(--pixel-gold-mid)] disabled:opacity-40 transition-colors"
                  >
                    SUBMIT
                  </button>
                </div>
              )}

              <button
                onClick={() => { setActiveClue(null); setClueResult(null) }}
                className="mt-3 font-[var(--font-pixel)] text-[8px] text-[var(--pixel-ui-text)] opacity-50 hover:opacity-100"
              >
                {'\u2190'} Back to clue list
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
