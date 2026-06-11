'use client'

import { useEffect, useState } from 'react'
import { PixelNavigation, PixelButton, PixelCard } from '@/components/pixel'
import type { Character as OTCharacter } from '@/app/oregon-trail/characterContext'
import {
  useRPG,
  TRAITS,
  FEATS,
  XP_TABLE,
  SKILL_DISPLAY_NAMES,
  SKILL_ATTRIBUTES,
  getTierIndex,
  type AttributeName,
  type SkillName,
  type GraphicsTier,
} from '@/lib/rpgContext'

// Graphics tier display info
const TIER_INFO: Record<GraphicsTier, { name: string; color: string; icon: string; desc: string }> = {
  retro_4bit: { name: '4-bit Retro', color: '#8a8a8a', icon: '🎮', desc: 'Muted colors, simple graphics' },
  classic_8bit: { name: '8-bit Classic', color: '#6aaa72', icon: '🕹️', desc: 'Basic textures, clearer colors' },
  enhanced_16bit: { name: '16-bit Enhanced', color: '#f4d76b', icon: '✨', desc: 'Rich textures, vibrant colors' },
  modern_32bit: { name: '32-bit Modern', color: '#ff8844', icon: '🌟', desc: 'Full palette, dynamic effects' },
}
import { chapters } from '@/lib/chapters'
import { getPickById } from '@/app/adventure/data/advantages'

// Attribute display info
const ATTRIBUTE_INFO: Record<AttributeName, { name: string; abbr: string; desc: string; color: string }> = {
  str: { name: 'Strength', abbr: 'STR', desc: 'Mining & hauling', color: 'var(--pixel-fire-red)' },
  dex: { name: 'Dexterity', abbr: 'DEX', desc: 'Panning & precision', color: 'var(--pixel-forest-light)' },
  con: { name: 'Constitution', abbr: 'CON', desc: 'Endurance & health', color: 'var(--pixel-earth-light)' },
  int: { name: 'Intelligence', abbr: 'INT', desc: 'Geology & business', color: 'var(--pixel-sky-light)' },
  wis: { name: 'Wisdom', abbr: 'WIS', desc: 'Survival & intuition', color: 'var(--pixel-gold-light)' },
  cha: { name: 'Charisma', abbr: 'CHA', desc: 'Negotiation & trust', color: 'var(--pixel-fire-orange)' },
}

export default function CharacterSheetPage() {
  const { session, loadGame, getSkillBonus, getAttributeModifier, graphicsTier, getChaptersCompleted } = useRPG()

  // B-ROUTE-02 fix: RPGProvider does NOT auto-hydrate `session` from
  // localStorage — only an explicit loadGame() call restores it. On direct
  // entry to /adventure/character (fresh page load), session is null even
  // though a saved game exists, so the page wrongly showed "No Character
  // Found". Hydrate once; loadGame() is idempotent (safe under Strict Mode
  // double-invoke) and a no-op when no save exists.
  useEffect(() => {
    if (!session) loadGame()
  }, [session, loadGame])

  // P1-4 fix: the S.A.D.D.L.E. adventure flow stores its canonical character
  // at `bobr_ot_character` (written by CharacterProvider) — never at the
  // legacy `bobr_rpg_session` that useRPG hydrates from. Read it as a
  // fallback so a live character renders instead of "No Character Found".
  const [otCharacter, setOtCharacter] = useState<OTCharacter | null>(null)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('bobr_ot_character')
      if (saved) {
        const parsed = JSON.parse(saved) as OTCharacter
        if (parsed?.name && parsed?.stats) setOtCharacter(parsed)
      }
    } catch {}
  }, [])

  if (!session && otCharacter) {
    return (
      <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
        <PixelNavigation />

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header with Name & Level */}
          <div className="bg-gradient-to-r from-[var(--pixel-gold-dark)] to-[var(--pixel-earth-dark)] border-4 border-[var(--pixel-gold-mid)] p-4 mb-6">
            <h1 className="font-[var(--font-pixel)] text-[16px] sm:text-[20px] text-[var(--pixel-gold-light)]">
              {otCharacter.name}
            </h1>
            <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)]">
              {otCharacter.background.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} • Level {otCharacter.level ?? 1}
            </p>
            <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)] mt-1">
              XP: <span className="text-[var(--pixel-gold-light)]">{otCharacter.experience ?? 0}</span>
              {otCharacter.experienceToNextLevel ? ` / ${otCharacter.experienceToNextLevel}` : ''}
            </p>
          </div>

          {/* S.A.D.D.L.E. Stats */}
          <PixelCard title="S.A.D.D.L.E. Stats">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(otCharacter.stats).map(([stat, val]) => (
                <div key={stat} className="bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] p-3 text-center">
                  <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">{stat}</p>
                  <p className="font-[var(--font-pixel)] text-[16px] text-[var(--pixel-ui-text)]">{val}</p>
                </div>
              ))}
            </div>
          </PixelCard>

          {/* Traits */}
          {(otCharacter.traits?.length ?? 0) > 0 && (
            <div className="mt-6">
              <PixelCard title="Traits">
                <div className="space-y-2">
                  {otCharacter.traits.map((traitId) => {
                    const pick = getPickById(traitId)
                    return (
                      <div key={traitId} className="p-2 bg-[var(--pixel-gold-dark)] border border-[var(--pixel-gold-mid)]">
                        <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
                          {pick?.name ?? traitId}
                        </p>
                        {(pick?.specialAbility ?? pick?.description) && (
                          <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">
                            {pick?.specialAbility ?? pick?.description}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </PixelCard>
            </div>
          )}

          {/* Back Button */}
          <div className="mt-8 text-center">
            <PixelButton href="/adventure/play" variant="blue" size="md">
              Back to Adventure
            </PixelButton>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
        <PixelNavigation />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <PixelCard title="No Character Found">
            <p className="font-[var(--font-pixel)] text-[12px] text-[var(--pixel-ui-text)] mb-4">
              You need to start an adventure first!
            </p>
            <PixelButton href="/adventure" variant="gold" size="md">
              Start Adventure
            </PixelButton>
          </PixelCard>
        </div>
      </div>
    )
  }

  const { character, stats, inventory, chapters: chapterProgress, npcStates, completedObjectives } = session
  const currentXP = character.xp
  const currentLevel = character.level
  const nextLevelXP = XP_TABLE[currentLevel + 1] || XP_TABLE[10]
  const prevLevelXP = XP_TABLE[currentLevel] || 0
  const xpProgress = Math.min(100, ((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100)

  // Collect all known facts from NPCs
  const allKnownFacts = Object.values(npcStates).flatMap(npc => npc.knownFacts || [])

  return (
    <div className="min-h-screen bg-[var(--pixel-bg-dark)]">
      <PixelNavigation />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header with Name & Level */}
        <div className="bg-gradient-to-r from-[var(--pixel-gold-dark)] to-[var(--pixel-earth-dark)] border-4 border-[var(--pixel-gold-mid)] p-4 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h1 className="font-[var(--font-pixel)] text-[16px] sm:text-[20px] text-[var(--pixel-gold-light)]">
                {session.playerName}
              </h1>
              <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)]">
                Gold Rush Prospector • Level {currentLevel}
              </p>
              {character.traits.length > 0 && (
                <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-forest-light)] mt-1">
                  {character.traits.map(t => TRAITS[t]?.name ?? getPickById(t)?.name ?? t).join(', ')}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)]">
                Score: <span className="text-[var(--pixel-gold-light)]">{session.totalScore}</span>
              </p>
              <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-ui-text)]">
                Chapter: <span className="text-[var(--pixel-gold-light)]">{session.currentChapter}/5</span>
              </p>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-[11px] sm:text-[12px] font-[var(--font-pixel)] text-[var(--pixel-ui-text)] mb-1">
              <span>XP: {currentXP}</span>
              <span>Next Level: {nextLevelXP}</span>
            </div>
            <div className="h-4 bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-ui-border)] relative">
              <div
                className="h-full bg-gradient-to-r from-[var(--pixel-gold-mid)] to-[var(--pixel-gold-light)] transition-all"
                style={{ width: `${xpProgress}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center font-[var(--font-pixel)] text-[11px] text-[var(--pixel-bg-dark)]">
                {Math.floor(xpProgress)}%
              </span>
            </div>
          </div>

          {/* Graphics Tier Display */}
          <div className="mt-4 bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] p-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[20px]">{TIER_INFO[graphicsTier].icon}</span>
                <div>
                  <p className="font-[var(--font-pixel)] text-[10px] sm:text-[12px]" style={{ color: TIER_INFO[graphicsTier].color }}>
                    {TIER_INFO[graphicsTier].name}
                  </p>
                  <p className="font-[var(--font-pixel)] text-[11px] sm:text-[12px] text-[var(--pixel-ui-text)]">
                    {TIER_INFO[graphicsTier].desc}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                {(['retro_4bit', 'classic_8bit', 'enhanced_16bit', 'modern_32bit'] as GraphicsTier[]).map((tier, idx) => (
                  <div
                    key={tier}
                    className="w-4 h-4 border-2 transition-all"
                    style={{
                      borderColor: getTierIndex(graphicsTier) >= idx ? TIER_INFO[tier].color : 'var(--pixel-bg-dark)',
                      backgroundColor: getTierIndex(graphicsTier) >= idx ? TIER_INFO[tier].color : 'transparent',
                      opacity: getTierIndex(graphicsTier) >= idx ? 1 : 0.3,
                    }}
                    title={TIER_INFO[tier].name}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Attributes */}
            <PixelCard title="Attributes">
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(character.attributes) as AttributeName[]).map((attr) => {
                  const val = character.attributes[attr]
                  const mod = getAttributeModifier(attr)
                  const info = ATTRIBUTE_INFO[attr]

                  return (
                    <div
                      key={attr}
                      className="bg-[var(--pixel-bg-mid)] border-2 border-[var(--pixel-ui-border)] p-3 flex items-center gap-3"
                    >
                      <div
                        className="w-12 h-12 flex items-center justify-center border-2 text-[16px] sm:text-[18px] font-[var(--font-pixel)]"
                        style={{ borderColor: info.color, color: info.color }}
                      >
                        {val}
                      </div>
                      <div>
                        <p className="font-[var(--font-pixel)] text-[12px] sm:text-[14px] text-[var(--pixel-gold-light)]">
                          {info.name}
                        </p>
                        <p className="font-[var(--font-pixel)] text-[11px] sm:text-[12px] text-[var(--pixel-ui-text)]">
                          {info.desc}
                        </p>
                        <p className={`font-[var(--font-pixel)] text-[10px] ${mod >= 0 ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-red)]'}`}>
                          Modifier: {mod >= 0 ? '+' : ''}{mod}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Attribute Points */}
              {character.attributePoints > 0 && (
                <div className="mt-4 p-2 bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold-mid)] text-center">
                  <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
                    {character.attributePoints} Attribute Point{character.attributePoints > 1 ? 's' : ''} Available!
                  </p>
                </div>
              )}
            </PixelCard>

            {/* Legacy Stats */}
            <PixelCard title="Prospector Stats">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-[var(--pixel-bg-mid)] border border-[var(--pixel-ui-border)] p-2">
                  <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">Wisdom</p>
                  <p className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-gold-light)]">{stats.wisdom}</p>
                </div>
                <div className="bg-[var(--pixel-bg-mid)] border border-[var(--pixel-ui-border)] p-2">
                  <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">Trust</p>
                  <p className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-forest-light)]">{stats.trust}</p>
                </div>
                <div className="bg-[var(--pixel-bg-mid)] border border-[var(--pixel-ui-border)] p-2">
                  <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">Luck</p>
                  <p className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-sky-light)]">{stats.luck}</p>
                </div>
                <div className="bg-[var(--pixel-bg-mid)] border border-[var(--pixel-ui-border)] p-2">
                  <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">Gold</p>
                  <p className="font-[var(--font-pixel)] text-[14px] text-[var(--pixel-gold-mid)]">{stats.gold}</p>
                </div>
              </div>
            </PixelCard>

            {/* HP & Stamina */}
            <PixelCard title="Vitals">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] mb-1">
                    <span>HP</span>
                    <span>{character.hp}/{character.maxHp}</span>
                  </div>
                  <div className="h-4 bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-fire-red)]">
                    <div
                      className="h-full bg-[var(--pixel-fire-red)]"
                      style={{ width: `${(character.hp / character.maxHp) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] mb-1">
                    <span>Stamina</span>
                    <span>{character.stamina}/{character.maxStamina}</span>
                  </div>
                  <div className="h-4 bg-[var(--pixel-bg-dark)] border-2 border-[var(--pixel-forest-mid)]">
                    <div
                      className="h-full bg-[var(--pixel-forest-mid)]"
                      style={{ width: `${(character.stamina / character.maxStamina) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </PixelCard>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Skills */}
            <PixelCard title="Skills">
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {(Object.keys(SKILL_DISPLAY_NAMES) as SkillName[]).map((skill) => {
                  const ranks = character.skills[skill]
                  const bonus = getSkillBonus(skill)
                  const attr = SKILL_ATTRIBUTES[skill]

                  return (
                    <div
                      key={skill}
                      className="flex justify-between items-center p-2 bg-[var(--pixel-bg-mid)] border border-[var(--pixel-ui-border)]"
                    >
                      <div>
                        <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">
                          {SKILL_DISPLAY_NAMES[skill]}
                        </p>
                        <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-border)]">
                          ({ATTRIBUTE_INFO[attr].abbr})
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-[var(--font-pixel)] text-[12px] ${bonus >= 0 ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-red)]'}`}>
                          {bonus >= 0 ? '+' : ''}{bonus}
                        </p>
                        {ranks > 0 && (
                          <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-gold-mid)]">
                            {ranks} ranks
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Skill Points */}
              {character.skillPoints > 0 && (
                <div className="mt-4 p-2 bg-[var(--pixel-gold-dark)] border-2 border-[var(--pixel-gold-mid)] text-center">
                  <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
                    {character.skillPoints} Skill Point{character.skillPoints > 1 ? 's' : ''} Available!
                  </p>
                </div>
              )}
            </PixelCard>

            {/* Inventory */}
            <PixelCard title={`Inventory (${inventory.length})`}>
              {inventory.length > 0 ? (
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {inventory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 bg-[var(--pixel-bg-mid)] border border-[var(--pixel-ui-border)]"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
                          {item.name}
                        </p>
                        <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] text-center py-4">
                  No items collected yet
                </p>
              )}
            </PixelCard>

            {/* Traits & Feats */}
            {(character.traits.length > 0 || character.feats.length > 0) && (
              <PixelCard title="Traits & Feats">
                <div className="space-y-2">
                  {character.traits.map((traitId) => {
                    // Trait IDs may come from the legacy TRAITS table or, for the
                    // S.A.D.D.L.E. flow, the advantage/pick table — resolve from
                    // either and never crash on an unknown id (B3).
                    const trait = TRAITS[traitId]
                    const pick = trait ? undefined : getPickById(traitId)
                    const name = trait?.name ?? pick?.name ?? traitId
                    const description = trait?.description ?? pick?.specialAbility ?? pick?.description ?? ''
                    return (
                      <div key={traitId} className="p-2 bg-[var(--pixel-gold-dark)] border border-[var(--pixel-gold-mid)]">
                        <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
                          {name}
                        </p>
                        <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">
                          {description}
                        </p>
                      </div>
                    )
                  })}
                  {character.feats.map((featId) => {
                    const feat = FEATS[featId]
                    return (
                      <div key={featId} className="p-2 bg-[var(--pixel-forest-dark)] border border-[var(--pixel-forest-mid)]">
                        <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-forest-light)]">
                          {feat.name}
                        </p>
                        <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)]">
                          {feat.description}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </PixelCard>
            )}
          </div>
        </div>

        {/* Knowledge & Quest Log */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* Special Knowledge */}
          <PixelCard title="Special Knowledge">
            {allKnownFacts.length > 0 ? (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {allKnownFacts.map((fact, i) => (
                  <p key={i} className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)]">
                    • {fact.replace(/_/g, ' ')}
                  </p>
                ))}
              </div>
            ) : (
              <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-ui-text)] text-center py-4">
                No special knowledge learned yet
              </p>
            )}
          </PixelCard>

          {/* Quest Log */}
          <PixelCard title="Quest Log">
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {Object.values(chapters).map((chapter) => {
                const progress = chapterProgress[chapter.id]
                const chapterObjectives = completedObjectives.filter(obj => obj.startsWith(`ch${chapter.id}_`))

                return (
                  <div key={chapter.id} className="p-2 bg-[var(--pixel-bg-mid)] border border-[var(--pixel-ui-border)]">
                    <div className="flex justify-between items-center">
                      <p className="font-[var(--font-pixel)] text-[10px] text-[var(--pixel-gold-light)]">
                        Ch.{chapter.id}: {chapter.title}
                      </p>
                      <span className={`font-[var(--font-pixel)] text-[11px] ${progress.completed ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-ui-text)]'}`}>
                        {progress.completed ? 'Complete' : chapter.id <= session.currentChapter ? 'In Progress' : 'Locked'}
                      </span>
                    </div>
                    {chapterObjectives.length > 0 && (
                      <p className="font-[var(--font-pixel)] text-[11px] text-[var(--pixel-ui-text)] mt-1">
                        {chapterObjectives.length} objective{chapterObjectives.length > 1 ? 's' : ''} complete
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </PixelCard>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <PixelButton href="/adventure" variant="blue" size="md">
            Back to Adventure
          </PixelButton>
        </div>
      </div>
    </div>
  )
}
