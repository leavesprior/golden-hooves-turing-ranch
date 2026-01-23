'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  useRPG,
  DialogueNode,
  DialogueChoice,
  SkillCheckResult,
  SKILL_DISPLAY_NAMES,
  FEATS,
} from '@/lib/rpgContext'

// CSS Pixel Art Portrait Components (48x48 style)
function NarratorPortrait() {
  return (
    <div
      className="relative"
      style={{ width: '48px', height: '48px', imageRendering: 'pixelated' }}
    >
      {/* Scroll background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #d4c4a8 0%, #c4b498 50%, #b4a488 100%)',
          border: '2px solid #8a7a5a',
          borderRadius: '2px',
        }}
      />
      {/* Scroll lines */}
      <div className="absolute" style={{ top: '12px', left: '8px', right: '8px', height: '2px', background: '#8a7a5a' }} />
      <div className="absolute" style={{ top: '20px', left: '8px', right: '8px', height: '2px', background: '#8a7a5a' }} />
      <div className="absolute" style={{ top: '28px', left: '8px', right: '12px', height: '2px', background: '#8a7a5a' }} />
      <div className="absolute" style={{ top: '36px', left: '8px', right: '16px', height: '2px', background: '#8a7a5a' }} />
      {/* Quill */}
      <div
        className="absolute"
        style={{
          bottom: '4px',
          right: '4px',
          width: '12px',
          height: '16px',
          background: 'linear-gradient(180deg, #fff 0%, #ddd 100%)',
          clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
          transform: 'rotate(-30deg)',
        }}
      />
    </div>
  )
}

function PlayerPortrait() {
  return (
    <div
      className="relative"
      style={{ width: '48px', height: '48px', imageRendering: 'pixelated' }}
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #4a6a9a 0%, #3a5a8a 100%)',
          border: '2px solid #2a4a7a',
          borderRadius: '2px',
        }}
      />
      {/* Hat */}
      <div
        className="absolute"
        style={{
          top: '2px',
          left: '10px',
          width: '28px',
          height: '10px',
          background: 'linear-gradient(180deg, #8B4513 0%, #654321 100%)',
          borderRadius: '4px 4px 0 0',
        }}
      />
      {/* Hat brim */}
      <div
        className="absolute"
        style={{
          top: '11px',
          left: '6px',
          width: '36px',
          height: '4px',
          background: 'linear-gradient(180deg, #654321 0%, #3d2b1f 100%)',
        }}
      />
      {/* Face */}
      <div
        className="absolute"
        style={{
          top: '15px',
          left: '12px',
          width: '24px',
          height: '18px',
          background: 'linear-gradient(180deg, #deb887 0%, #d2a679 100%)',
          borderRadius: '2px',
        }}
      />
      {/* Eyes */}
      <div className="absolute bg-[#2a1a0a]" style={{ top: '20px', left: '16px', width: '4px', height: '4px', borderRadius: '50%' }} />
      <div className="absolute bg-[#2a1a0a]" style={{ top: '20px', left: '28px', width: '4px', height: '4px', borderRadius: '50%' }} />
      {/* Smile */}
      <div
        className="absolute"
        style={{
          top: '27px',
          left: '18px',
          width: '12px',
          height: '4px',
          borderBottom: '2px solid #8a6a4a',
          borderRadius: '0 0 6px 6px',
        }}
      />
      {/* Beard stubble */}
      <div className="absolute bg-[#8a7a6a]" style={{ top: '30px', left: '14px', width: '20px', height: '3px', opacity: 0.5 }} />
      {/* Bandana/neckerchief */}
      <div
        className="absolute"
        style={{
          top: '35px',
          left: '14px',
          width: '20px',
          height: '8px',
          background: 'linear-gradient(180deg, #cc4444 0%, #aa3333 100%)',
        }}
      />
    </div>
  )
}

function WagonMasterPortrait() {
  return (
    <div
      className="relative"
      style={{ width: '48px', height: '48px', imageRendering: 'pixelated' }}
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #5a4a3a 0%, #4a3a2a 100%)',
          border: '2px solid #3a2a1a',
          borderRadius: '2px',
        }}
      />
      {/* Wide-brimmed hat */}
      <div
        className="absolute"
        style={{
          top: '4px',
          left: '6px',
          width: '36px',
          height: '8px',
          background: 'linear-gradient(180deg, #3a3a3a 0%, #2a2a2a 100%)',
          borderRadius: '2px 2px 0 0',
        }}
      />
      <div
        className="absolute"
        style={{
          top: '11px',
          left: '2px',
          width: '44px',
          height: '5px',
          background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
        }}
      />
      {/* Face - weathered */}
      <div
        className="absolute"
        style={{
          top: '16px',
          left: '12px',
          width: '24px',
          height: '18px',
          background: 'linear-gradient(180deg, #c49a6c 0%, #b08858 100%)',
          borderRadius: '2px',
        }}
      />
      {/* Squinting eyes */}
      <div className="absolute bg-[#2a1a0a]" style={{ top: '21px', left: '15px', width: '6px', height: '2px' }} />
      <div className="absolute bg-[#2a1a0a]" style={{ top: '21px', left: '27px', width: '6px', height: '2px' }} />
      {/* Mustache */}
      <div
        className="absolute"
        style={{
          top: '27px',
          left: '14px',
          width: '20px',
          height: '4px',
          background: '#4a4a4a',
          borderRadius: '0 0 4px 4px',
        }}
      />
      {/* Collar */}
      <div
        className="absolute"
        style={{
          top: '36px',
          left: '10px',
          width: '28px',
          height: '10px',
          background: 'linear-gradient(180deg, #6a5a4a 0%, #5a4a3a 100%)',
        }}
      />
    </div>
  )
}

function DefaultPortrait() {
  return (
    <div
      className="relative"
      style={{ width: '48px', height: '48px', imageRendering: 'pixelated' }}
    >
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #4a4a5a 0%, #3a3a4a 100%)',
          border: '2px solid #2a2a3a',
          borderRadius: '2px',
        }}
      />
      {/* Question mark silhouette */}
      <div
        className="absolute inset-0 flex items-center justify-center font-[var(--font-pixel)] text-2xl"
        style={{ color: '#6a6a7a' }}
      >
        ?
      </div>
    </div>
  )
}

interface DialogueBoxProps {
  node: DialogueNode
  onClose: () => void
}

export default function DialogueBox({ node, onClose }: DialogueBoxProps) {
  const {
    selectChoice,
    advanceDialogue,
    session,
    rollSkillCheck,
    getSkillBonus,
    hasItem,
    hasFeat,
    processDialogue,
    getNPCMood,
  } = useRPG()
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const [showChoices, setShowChoices] = useState(false)
  const [skillCheckResult, setSkillCheckResult] = useState<SkillCheckResult | null>(null)
  const [showSkillRoll, setShowSkillRoll] = useState(false)

  // Process the dialogue node for NPC-driven variations
  const processedNode = processDialogue(node)

  // Get player name from session, fallback to 'Tobias' for legacy compatibility
  const playerName = session?.playerName || 'Tobias'

  // Replace placeholders in dialogue text with actual values
  const processDialogueText = (text: string): string => {
    return text
      .replace(/\{playerName\}/g, playerName)
      .replace(/\bTobias\b/g, playerName)  // Replace "Tobias" with player's name
  }

  // Process the text for name substitution
  const finalText = processDialogueText(processedNode.text)

  // Typewriter effect
  useEffect(() => {
    setDisplayedText('')
    setIsTyping(true)
    setShowChoices(false)

    let index = 0
    const timer = setInterval(() => {
      if (index < finalText.length) {
        setDisplayedText(finalText.slice(0, index + 1))
        index++
      } else {
        clearInterval(timer)
        setIsTyping(false)
        if (processedNode.choices && processedNode.choices.length > 0) {
          setTimeout(() => setShowChoices(true), 300)
        }
      }
    }, 30) // Typing speed

    return () => clearInterval(timer)
  }, [finalText, processedNode.choices])

  // Skip typing animation or advance dialogue
  const handleSkip = useCallback(() => {
    if (isTyping) {
      setDisplayedText(finalText)
      setIsTyping(false)
      if (processedNode.choices && processedNode.choices.length > 0) {
        setShowChoices(true)
      }
    } else if (!processedNode.choices || processedNode.choices.length === 0) {
      // Always call advanceDialogue() so giveItem/giveXP processing happens
      // advanceDialogue() handles closing when there's no nextNode
      advanceDialogue()
    }
  }, [isTyping, finalText, processedNode, advanceDialogue])

  // Check if a choice's requirements are met (not including skill checks which are rolled)
  const checkRequirements = useCallback((choice: DialogueChoice): { met: boolean; reason?: string } => {
    if (!session) return { met: false, reason: 'No session' }

    // Legacy stat requirement
    if (choice.requirement) {
      const statValue = session.stats[choice.requirement.stat]
      if (statValue < choice.requirement.min) {
        return { met: false, reason: `Requires ${choice.requirement.stat}: ${choice.requirement.min}` }
      }
    }

    // Attribute check (automatic pass/fail, not rolled)
    if (choice.attributeCheck) {
      const attrValue = session.character.attributes[choice.attributeCheck.attribute]
      if (attrValue < choice.attributeCheck.min) {
        const attrName = choice.attributeCheck.attribute.toUpperCase()
        return { met: false, reason: `Requires ${attrName} ${choice.attributeCheck.min}+` }
      }
    }

    // Level requirement
    if (choice.levelRequirement && session.character.level < choice.levelRequirement) {
      return { met: false, reason: `Requires Level ${choice.levelRequirement}` }
    }

    // Item requirement
    if (choice.itemRequirement && !hasItem(choice.itemRequirement)) {
      return { met: false, reason: `Requires item: ${choice.itemRequirement}` }
    }

    // Feat requirement
    if (choice.featRequirement && !hasFeat(choice.featRequirement)) {
      const featName = FEATS[choice.featRequirement]?.name || choice.featRequirement
      return { met: false, reason: `Requires feat: ${featName}` }
    }

    return { met: true }
  }, [session, hasItem, hasFeat])

  // Handle choice selection
  const handleChoice = useCallback((index: number) => {
    const choice = processedNode.choices?.[index]
    if (!choice) return

    // Check all requirements except skill checks
    const reqCheck = checkRequirements(choice)
    if (!reqCheck.met) return

    // If choice has a skill check, roll it
    if (choice.skillCheck) {
      const result = rollSkillCheck(choice.skillCheck.skill, choice.skillCheck.dc)
      setSkillCheckResult(result)
      setShowSkillRoll(true)

      // Show roll result for 2 seconds then proceed
      setTimeout(() => {
        setShowSkillRoll(false)
        setSkillCheckResult(null)
        // Select the choice with skill check result - rpgContext will handle navigation
        selectChoice(index, result)
      }, 2000)
      return
    }

    selectChoice(index)
  }, [node, checkRequirements, rollSkillCheck, selectChoice])

  // Speaker avatar/name styling with portraits
  const getSpeakerStyle = (speaker: string) => {
    switch (speaker.toLowerCase()) {
      case 'narrator':
        return { Portrait: NarratorPortrait, color: 'var(--pixel-gold-light)', name: 'Narrator' }
      case 'tobias':
      case 'player':
        // Use the player's chosen name instead of hardcoded "Tobias"
        return { Portrait: PlayerPortrait, color: 'var(--pixel-forest-light)', name: playerName }
      case 'wagon master':
      case 'wagonmaster':
        return { Portrait: WagonMasterPortrait, color: 'var(--pixel-earth-light)', name: 'Wagon Master' }
      default:
        return { Portrait: DefaultPortrait, color: 'var(--pixel-ui-text)', name: speaker }
    }
  }

  const speaker = getSpeakerStyle(processedNode.speaker)

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 p-4"
      onClick={handleSkip}
    >
      <div className="max-w-2xl mx-auto">
        {/* Dialogue Box */}
        <div className="bg-[var(--pixel-bg-dark)] border-4 border-[var(--pixel-gold-mid)] p-4 relative">
          {/* Speaker Name */}
          <div className="absolute -top-4 left-16 sm:left-20 bg-[var(--pixel-bg-dark)] px-3 py-1 border-2 border-[var(--pixel-gold-mid)]">
            <span className="font-[var(--font-pixel)] text-[12px] sm:text-[14px]" style={{ color: speaker.color }}>
              {speaker.name}
            </span>
          </div>

          {/* Portrait + Text Layout */}
          <div className="flex gap-4">
            {/* Portrait */}
            <div className="flex-shrink-0 hidden sm:block">
              <div className="border-2 border-[var(--pixel-gold-dark)] shadow-lg">
                <speaker.Portrait />
              </div>
            </div>

            {/* Text Content */}
            <div className="flex-1 min-h-[80px] pt-2">
              <p className="font-[var(--font-pixel)] text-[14px] sm:text-[16px] leading-relaxed text-[var(--pixel-ui-text)]">
                {displayedText}
                {isTyping && <span className="animate-pulse">▌</span>}
              </p>
            </div>
          </div>

          {/* Skill Check Roll Animation */}
          {showSkillRoll && skillCheckResult && (
            <div className="mt-4 p-4 border-2 border-[var(--pixel-gold-mid)] bg-[var(--pixel-bg-mid)] text-center animate-pulse">
              <div className="font-[var(--font-pixel)] text-[16px] sm:text-[18px] mb-2">
                <span className="text-[var(--pixel-gold-light)]">Skill Check!</span>
              </div>
              <div className="font-[var(--font-pixel)] text-[14px] sm:text-[16px] space-x-2">
                <span className="text-[var(--pixel-ui-text)]">Roll: {skillCheckResult.roll}</span>
                <span className="text-[var(--pixel-gold-mid)]">+</span>
                <span className="text-[var(--pixel-ui-text)]">Bonus: {skillCheckResult.total - skillCheckResult.roll}</span>
                <span className="text-[var(--pixel-gold-mid)]">=</span>
                <span className="text-[var(--pixel-gold-light)] font-bold">{skillCheckResult.total}</span>
                <span className="text-[var(--pixel-ui-border)]">vs DC {skillCheckResult.dc}</span>
              </div>
              <div className={`font-[var(--font-pixel)] text-[18px] sm:text-[20px] mt-2 ${
                skillCheckResult.success ? 'text-[var(--pixel-forest-light)]' : 'text-[var(--pixel-fire-orange)]'
              }`}>
                {skillCheckResult.success ? 'SUCCESS!' : 'FAILED'}
                {skillCheckResult.margin !== 0 && (
                  <span className="text-[12px] ml-2">
                    ({skillCheckResult.margin > 0 ? '+' : ''}{skillCheckResult.margin})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Choices */}
          {showChoices && processedNode.choices && !showSkillRoll && (
            <div className="mt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
              {processedNode.choices.map((choice, index) => {
                const reqCheck = checkRequirements(choice)
                const hasSkillCheck = !!choice.skillCheck

                return (
                  <button
                    key={index}
                    onClick={() => handleChoice(index)}
                    disabled={!reqCheck.met}
                    className={`
                      w-full text-left p-3 border-2 transition-all
                      font-[var(--font-pixel)] text-[12px] sm:text-[14px]
                      ${reqCheck.met
                        ? 'border-[var(--pixel-ui-border)] bg-[var(--pixel-bg-mid)] hover:bg-[var(--pixel-gold-dark)] hover:border-[var(--pixel-gold-mid)] text-[var(--pixel-ui-text)]'
                        : 'border-[var(--pixel-fire-orange)] bg-[var(--pixel-bg-dark)] text-[var(--pixel-ui-border)] cursor-not-allowed'
                      }
                    `}
                  >
                    <span className="text-[var(--pixel-gold-light)] mr-2">{index + 1}.</span>
                    {choice.text}

                    {/* Skill Check indicator */}
                    {hasSkillCheck && choice.skillCheck && (
                      <span className="ml-2 text-[var(--pixel-sky-blue)]">
                        [{SKILL_DISPLAY_NAMES[choice.skillCheck.skill]} DC {choice.skillCheck.dc}]
                        <span className="text-[var(--pixel-ui-border)] text-[10px] ml-1">
                          (+{getSkillBonus(choice.skillCheck.skill)})
                        </span>
                      </span>
                    )}

                    {/* Legacy stat effect */}
                    {choice.effect && (
                      <span className="ml-2 text-[var(--pixel-forest-light)]">
                        (+{choice.effect.stat})
                      </span>
                    )}

                    {/* XP reward indicator */}
                    {choice.giveXP && (
                      <span className="ml-2 text-[var(--pixel-gold-mid)]">
                        (+{choice.giveXP} XP)
                      </span>
                    )}

                    {/* Item reward indicator */}
                    {choice.giveItem && (
                      <span className="ml-2 text-[var(--pixel-earth-light)]">
                        (Get: {choice.giveItem.name})
                      </span>
                    )}

                    {/* Requirement not met */}
                    {!reqCheck.met && reqCheck.reason && (
                      <span className="ml-2 text-[var(--pixel-fire-orange)]">
                        ({reqCheck.reason})
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Continue indicator */}
          {!isTyping && (!processedNode.choices || processedNode.choices.length === 0) && (
            <div className="text-right mt-2">
              <span className="font-[var(--font-pixel)] text-[10px] sm:text-[12px] text-[var(--pixel-gold-mid)] animate-pulse">
                Click or press Space to continue...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
