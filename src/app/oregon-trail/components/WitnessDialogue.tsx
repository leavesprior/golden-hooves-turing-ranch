'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { type WitnessType, WITNESS_PERSONALITIES } from '../data/clueTemplates'
import { type DialogueTree, type DialogueNode, type DialogueResponse, type RevisitBehavior, type ProficiencyRequirement, getDialogueTree, type DialogueEffect } from '../data/dialogueTrees'
import { useCharacter, type StatName, type SkillCheckResult, XP_REWARDS, type InvestigationCategory, type ProficiencyLevel } from '../characterContext'
import { useReputation, type FactionId } from '../reputationContext'
import { useNarrator } from '../narratorContext'
import { useMystery, type CollectedClue } from '../mysteryContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useNPC } from '../npcContext'
import type { NPCPersonality } from '../data/npcPersonalities'
import { SkillCheck } from './SkillCheck'
import { ConversationStore, generateNPCId } from '../lib/conversationStore'
import { detectAdamsKeyword } from '../data/adamsEasterEggs'
import { getMoodEntry, trustToMoodLevel, MOOD_SCALE, type MoodLevel } from '../data/npcMoodScale'

interface WitnessDialogueProps {
  witnessType: WitnessType
  location: string
  clue?: CollectedClue  // The clue this witness has
  onClose: () => void
  onClueObtained?: (clue: CollectedClue) => void
}

type DialogueMode = 'checking' | 'dynamic' | 'scripted'

export function WitnessDialogue({ witnessType, location, clue, onClose, onClueObtained }: WitnessDialogueProps) {
  const { getStat, rollSkillCheck, addExperience, addInvestigationXP, getInvestigationLevel, getInvestigationBonus } = useCharacter()
  const { modifyReputation, getInteractionBonus } = useReputation()
  const { comment, recordPlayerAction, setMood, state: narratorState } = useNarrator()
  const { addClue } = useMystery()
  const { canAfford, spendNeutral, earnGood, addBadKarma } = useKarmaWallet()

  // NPC context for dynamic dialogue
  const {
    state: npcState,
    checkOllamaHealth,
    isOllamaReady,
    startConversation,
    endConversation,
    sendMessage,
    sendMessageStream,
    adjustTrust,
    getPersonalityFor,
    generateNameFor,
  } = useNPC()

  // Dialogue mode state
  const [dialogueMode, setDialogueMode] = useState<DialogueMode>('scripted')
  const [ollamaAvailable, setOllamaAvailable] = useState(false)
  const [freeformUnlocked, setFreeformUnlocked] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')

  // Scripted dialogue state
  const [dialogueTree] = useState<DialogueTree>(getDialogueTree(witnessType))
  const npcIdForStore = generateNPCId(witnessType, location)
  const isRevisit = ConversationStore.getVisitCount(npcIdForStore) > 0
  const chosenResponses = ConversationStore.getChosenResponses(npcIdForStore)
  const startNodeId = isRevisit && dialogueTree.revisitStartNode && dialogueTree.nodes[dialogueTree.revisitStartNode]
    ? dialogueTree.revisitStartNode
    : dialogueTree.startNode
  const [currentNodeId, setCurrentNodeId] = useState(startNodeId)
  const [dialogueHistory, setDialogueHistory] = useState<Array<{ speaker: string; text: string; isStreaming?: boolean }>>([])
  const [showSkillCheck, setShowSkillCheck] = useState<{
    stat: StatName
    difficulty: number
    description: string
    onSuccess: () => void
    onFailure: () => void
  } | null>(null)
  const [clueObtained, setClueObtained] = useState(false)
  const [isEnded, setIsEnded] = useState(false)
  const [interviewComplete, setInterviewComplete] = useState(false)

  const historyEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const witness = WITNESS_PERSONALITIES[witnessType]
  const currentNode = dialogueTree.nodes[currentNodeId]
  const personality = getPersonalityFor(witnessType)
  const npcName = generateNameFor(witnessType, location)

  // Check rapport/trust to determine if freeform conversation is unlocked
  const npcId = generateNPCId(witnessType, location)
  const conversationSummary = ConversationStore.getConversationSummary(npcId)
  const visitCount = conversationSummary.visitCount
  const trustLevel = conversationSummary.trustLevel

  // Scroll to bottom on new messages
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [dialogueHistory, streamingText])

  // Check Ollama availability on mount, but always start scripted
  useEffect(() => {
    async function checkMode() {
      const status = await checkOllamaHealth()
      setOllamaAvailable(status.available)

      // Check if freeform is already unlocked by rapport
      const rapportUnlocked = trustLevel >= 7 || (visitCount >= 3 && trustLevel >= 5)
      setFreeformUnlocked(rapportUnlocked)

      if (status.available && rapportUnlocked) {
        // Pre-initialize conversation for when player unlocks freeform
        startConversation(
          witnessType,
          location,
          clue ? { trait: clue.trait || 'unknown', value: clue.value || '' } : undefined
        )
      }

      // Always start with scripted dialogue tree
      setDialogueMode('scripted')
      // Process initial node for scripted mode
      // (handled below since currentNode may not be ready in this tick)
    }
    checkMode()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Process initial scripted node once mode is set
  useEffect(() => {
    if (dialogueMode === 'scripted' && currentNode && dialogueHistory.length === 0) {
      processNodeEffects(currentNode)
    }
  }, [dialogueMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Unlock freeform when an easter egg keyword is detected or trust threshold met
  const checkFreeformUnlock = useCallback((playerText: string) => {
    if (freeformUnlocked) return
    // Easter egg keywords unlock conversation
    const adamsRef = detectAdamsKeyword(playerText)
    if (adamsRef) {
      setFreeformUnlocked(true)
      if (ollamaAvailable) {
        startConversation(
          witnessType,
          location,
          clue ? { trait: clue.trait || 'unknown', value: clue.value || '' } : undefined
        )
      }
      return
    }
  }, [freeformUnlocked, ollamaAvailable, witnessType, location, clue, startConversation])

  // Switch to dynamic/freeform mode
  const enterFreeformMode = useCallback(() => {
    if (!ollamaAvailable) return
    setDialogueMode('dynamic')
    if (!npcState.activeConversation) {
      startConversation(
        witnessType,
        location,
        clue ? { trait: clue.trait || 'unknown', value: clue.value || '' } : undefined
      )
    }
    addToHistory('NARRATOR', `${npcName} seems willing to talk openly...`)
  }, [ollamaAvailable, npcState.activeConversation, witnessType, location, clue, startConversation, npcName]) // eslint-disable-line react-hooks/exhaustive-deps

  // Add dialogue line to history
  const addToHistory = useCallback((speaker: string, text: string, isStreaming?: boolean) => {
    setDialogueHistory(prev => [...prev, { speaker, text, isStreaming }])
  }, [])

  // Update last history item (for streaming)
  const updateLastHistory = useCallback((text: string) => {
    setDialogueHistory(prev => {
      const updated = [...prev]
      if (updated.length > 0) {
        updated[updated.length - 1] = { ...updated[updated.length - 1], text, isStreaming: false }
      }
      return updated
    })
  }, [])

  // Generate initial greeting based on personality and visit history
  function getInitialGreeting(personality: NPCPersonality | null, witnessType: WitnessType): string {
    // Use first speech pattern + archetype flavor
    const patterns = personality?.speechPatterns || []
    const traits = personality?.coreTraits || []

    const greetings: Record<WitnessType, string> = {
      bartender: "*sigh* Another one. What'll it be?",
      shopkeeper: "Oh! A customer! I mean, can I help you? *nervous glance*",
      stable_hand: "*continues brushing horse* ...You need somethin'?",
      traveler: "*looks up from dusty boots* Just passing through... like everyone.",
      settler: "*pauses work* We don't get many visitors. What do you want?",
      native_trader: "*long pause* ...The wind brought you here.",
      telegraph_operator: "Ah! *taps desk* Breaking news! ...Well, not really. What can I do for you?",
      sheriff_deputy: "*touches badge* Official business, I hope. We got enough trouble.",
      prostitute: "Well, hello there, sugar. *knowing look* You look like you need information... or something.",
      preacher: "Blessings upon you, traveler! Have you come seeking salvation... or something else?",
      drunk: "*hiccup* Heyyy... you look familiar. Or... wait, do I know you?",
      child: "*peeks out from hiding spot* ...You're not gonna tell my Ma, are you?"
    }

    return greetings[witnessType] || "Yes? What do you want?"
  }

  // Handle dynamic dialogue input
  const handleDynamicInput = useCallback(async () => {
    if (!customInput.trim() || isStreaming) return

    const message = customInput.trim()
    setCustomInput('')
    addToHistory('YOU', message)
    setIsStreaming(true)
    setStreamingText('')

    // Add placeholder for NPC response
    addToHistory(npcName, '', true)

    try {
      // Try streaming first
      let fullResponse = ''
      const result = await sendMessageStream(
        message,
        (chunk) => {
          fullResponse += chunk
          setStreamingText(fullResponse)
        },
        {
          characterStats: {
            diplomacy: getStat('Diplomacy'),
            shrewdness: getStat('Shrewdness'),
            luck: getStat('Luck'),
          },
          narratorMood: narratorState.mood,
        }
      )

      if (result) {
        // Update the placeholder with final response
        updateLastHistory(result.response)

        // Check if clue was revealed
        if (result.clueRevealed && clue && !clueObtained) {
          addClue(clue)
          setClueObtained(true)
          onClueObtained?.(clue)
          addExperience(XP_REWARDS.CLUE_OBTAINED)
          comment("Interesting... they let something slip.", 'observation')
        }

        // Narrator might comment
        if (Math.random() < 0.2) {
          comment(getRandomNarratorComment(), 'observation')
        }
      } else {
        // Fallback to non-streaming
        const nonStreamResult = await sendMessage(message, {
          characterStats: {
            diplomacy: getStat('Diplomacy'),
            shrewdness: getStat('Shrewdness'),
            luck: getStat('Luck'),
          },
          narratorMood: narratorState.mood,
        })

        if (nonStreamResult) {
          updateLastHistory(nonStreamResult.response)

          if (nonStreamResult.clueRevealed && clue && !clueObtained) {
            addClue(clue)
            setClueObtained(true)
            onClueObtained?.(clue)
            addExperience(XP_REWARDS.CLUE_OBTAINED)
          }
        } else {
          // Total fallback - switch to scripted mode
          updateLastHistory("*clears throat* I... I've said enough. *turns away*")
          setDialogueMode('scripted')
          setIsEnded(true)
        }
      }
    } catch (error) {
      console.error('[WitnessDialogue] Error:', error)
      updateLastHistory("*looks away nervously* I... I don't know anything else.")
    }

    setIsStreaming(false)
    setStreamingText('')
    recordPlayerAction('dynamic_dialogue')
  }, [customInput, isStreaming, npcName, sendMessage, sendMessageStream, getStat, narratorState.mood, clue, clueObtained, addClue, onClueObtained, comment, addToHistory, updateLastHistory, recordPlayerAction])

  // Quick question buttons for dynamic mode
  const quickQuestions = [
    { text: "See any strangers?", question: "Have you seen any strangers pass through here recently?" },
    { text: "Tell me about the crime", question: "What do you know about the recent crime?" },
    { text: "Describe them", question: "Can you describe what they looked like?" },
    { text: "Where'd they go?", question: "Which direction did they head?" },
  ]

  // Process node effects (scripted mode)
  const processNodeEffects = useCallback((node: DialogueNode) => {
    if (node.effect) {
      if (node.effect.grantClue && clue && !clueObtained) {
        const clueText = node.text.replace('[CLUE_PLACEHOLDER]', clue.text)
        addToHistory(getWitnessLabel(witnessType), clueText)
        addClue(clue)
        setClueObtained(true)
        onClueObtained?.(clue)
      } else {
        addToHistory(getWitnessLabel(witnessType), node.text)
      }

      if (node.effect.reputation) {
        modifyReputation(
          node.effect.reputation.faction,
          node.effect.reputation.delta,
          `Conversation with ${witnessType}`,
          location
        )
      }
    } else {
      let text = node.text
      if (text.includes('[CLUE_PLACEHOLDER]') && clue) {
        text = text.replace('[CLUE_PLACEHOLDER]', clue.text)
        if (!clueObtained) {
          addClue(clue)
          setClueObtained(true)
          onClueObtained?.(clue)
        }
      }
      addToHistory(node.speaker === 'witness' ? getWitnessLabel(witnessType) : 'NARRATOR', text)
    }

    if (node.narratorComment) {
      setTimeout(() => {
        comment(node.narratorComment!, 'observation')
      }, 500)
    }

    if (node.nextNode && !node.responses) {
      setTimeout(() => {
        setCurrentNodeId(node.nextNode!)
      }, 1000)
    }

    if (!node.responses && !node.nextNode) {
      setIsEnded(true)
    }
  }, [clue, clueObtained, witnessType, location, addClue, onClueObtained, modifyReputation, comment, addToHistory])

  // Handle selecting a response (scripted mode)
  const handleSelectResponse = useCallback(async (response: DialogueResponse) => {
    const karmaCost = response.goldCost || response.karmaCost || 0
    if (karmaCost > 0) {
      if (!canAfford('neutral', karmaCost)) {
        addToHistory('NARRATOR', `You need ${karmaCost}🌮 to do that.`)
        return
      }
      await spendNeutral(karmaCost, `Dialogue: ${response.text.substring(0, 30)}...`)
    }

    // Record this choice in the conversation store
    const currentResponses = currentNode?.responses || []
    const siblingIds = currentResponses.map(r => r.id)
    ConversationStore.recordChosenResponse(npcIdForStore, response.id, siblingIds)

    // Use alternate text on revisit if applicable
    const displayText = isRevisit && response.alternateText && chosenResponses.includes(response.id)
      ? response.alternateText
      : (response.displayText || response.text)

    addToHistory('YOU', displayText)
    recordPlayerAction(`dialogue_${response.id}`)

    if (response.karmaGood && response.karmaGood > 0) {
      await earnGood(response.karmaGood, `Virtuous: ${response.text.substring(0, 20)}...`)
    }
    if (response.karmaGood && response.karmaGood < 0) {
      await addBadKarma(Math.abs(response.karmaGood), `Dark choice: ${response.text.substring(0, 20)}...`)
    }

    if (response.reputationEffect) {
      modifyReputation(
        response.reputationEffect.faction,
        response.reputationEffect.delta,
        response.displayText || response.text,
        location
      )
    }

    if (response.skillCheck) {
      const interactionBonus = witnessType === 'settler' ? getInteractionBonus('settlers') :
                               witnessType === 'native_trader' ? getInteractionBonus('natives') : 0

      // Apply investigation proficiency bonus to relevant skill checks
      const proficiencyBonus = getInvestigationBonus('witnessInterrogation')
      const effectiveDifficulty = Math.max(1, response.skillCheck.difficulty - interactionBonus - proficiencyBonus)

      setShowSkillCheck({
        stat: response.skillCheck.stat as StatName,
        difficulty: effectiveDifficulty,
        description: `${response.skillCheck.stat} check to ${response.text.toLowerCase()}`,
        onSuccess: () => {
          setShowSkillCheck(null)
          // Grant XP for successful skill check
          addExperience(XP_REWARDS.SKILL_CHECK_SUCCESS)
          setCurrentNodeId(response.nextNode)
          const nextNode = dialogueTree.nodes[response.nextNode]
          if (nextNode) {
            setTimeout(() => processNodeEffects(nextNode), 300)
          }
        },
        onFailure: () => {
          setShowSkillCheck(null)
          if (response.skillCheck!.failNode) {
            setCurrentNodeId(response.skillCheck!.failNode)
            const failNode = dialogueTree.nodes[response.skillCheck!.failNode]
            if (failNode) {
              setTimeout(() => processNodeEffects(failNode), 300)
            }
          } else {
            addToHistory(getWitnessLabel(witnessType), "I... I don't think I want to say anything more.")
            setIsEnded(true)
          }
        }
      })
      return
    }

    if (response.grantsClue && clue && !clueObtained) {
      addClue(clue)
      setClueObtained(true)
      onClueObtained?.(clue)
      addExperience(XP_REWARDS.CLUE_OBTAINED)
    }

    setCurrentNodeId(response.nextNode)
    const nextNode = dialogueTree.nodes[response.nextNode]
    if (nextNode) {
      setTimeout(() => processNodeEffects(nextNode), 300)
    }
  }, [dialogueTree.nodes, witnessType, location, clue, clueObtained, addClue, onClueObtained, modifyReputation, getInteractionBonus, recordPlayerAction, addToHistory, processNodeEffects, canAfford, spendNeutral, earnGood, addBadKarma, currentNode, npcIdForStore, isRevisit, chosenResponses, addExperience, getInvestigationBonus])

  // Handle skill check result
  const handleSkillCheckResult = useCallback((result: SkillCheckResult) => {
    if (showSkillCheck) {
      if (result.success) {
        setMood('impressed')
        // Critical success grants extra XP
        if (result.criticalSuccess) {
          addExperience(XP_REWARDS.SKILL_CHECK_CRITICAL - XP_REWARDS.SKILL_CHECK_SUCCESS) // Extra on top of success XP
        }
        showSkillCheck.onSuccess()
      } else {
        setMood('annoyed')
        showSkillCheck.onFailure()
      }
    }
  }, [showSkillCheck, setMood, addExperience])

  // Handle close - grant XP for completing the interview
  const handleClose = useCallback(() => {
    if (dialogueHistory.length > 1 && !interviewComplete) {
      addExperience(XP_REWARDS.WITNESS_INTERVIEW)
      addInvestigationXP('witnessInterrogation', 10)
      setInterviewComplete(true)
    }
    endConversation()
    onClose()
  }, [endConversation, onClose, dialogueHistory.length, interviewComplete, addExperience, addInvestigationXP])

  // Get random narrator comment
  function getRandomNarratorComment(): string {
    const comments = [
      "The witness seems nervous...",
      "Something about their tone suggests they know more.",
      "You notice their eyes dart to the door.",
      "They're holding something back.",
      "An interesting choice of words...",
    ]
    return comments[Math.floor(Math.random() * comments.length)]
  }

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-amber-700 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-amber-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getWitnessEmoji(witnessType)}</span>
            <div>
              <h2 className="text-amber-300">
                {dialogueMode === 'dynamic' ? npcName : getWitnessLabel(witnessType)}
              </h2>
              <p className="text-gray-500 text-xs">
                {location}
                {dialogueMode === 'dynamic' && npcState.ollamaModel && (
                  <span className="ml-2 text-emerald-600">✨ AI</span>
                )}
              </p>
            </div>
          </div>
          {/* Mood Indicator */}
          {dialogueMode !== 'checking' && npcState.activeConversation && (() => {
            const trust = npcState.activeConversation.trustLevel
            const moodLevel = trustToMoodLevel(trust)
            const moodInfo = MOOD_SCALE[moodLevel]
            return (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-500"
                style={{
                  backgroundColor: moodInfo.bgColor,
                  border: `1px solid ${moodInfo.borderColor}`,
                }}
                title={moodInfo.description}
              >
                <span className="text-lg">{moodInfo.face}</span>
                <div className="text-right">
                  <p className="text-xs font-bold" style={{ color: moodInfo.color }}>
                    {moodInfo.label}
                  </p>
                  {/* 5-pip mood bar */}
                  <div className="flex gap-0.5 mt-0.5">
                    {([1, 2, 3, 4, 5] as MoodLevel[]).map(level => (
                      <div
                        key={level}
                        className="w-2 h-1.5 rounded-sm transition-colors duration-300"
                        style={{
                          backgroundColor: level <= moodLevel
                            ? moodInfo.color
                            : 'rgba(90, 64, 32, 0.3)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          <div className="text-right">
            {clueObtained && (
              <span className="text-emerald-400 text-xs">&#10003; Clue Obtained</span>
            )}
            {dialogueMode === 'checking' && (
              <span className="text-gray-500 text-xs animate-pulse">Connecting...</span>
            )}
          </div>
        </div>

        {/* Dialogue History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {dialogueHistory.map((line, index) => (
            <div
              key={index}
              className={`flex ${line.speaker === 'YOU' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-3 rounded-lg ${
                line.speaker === 'YOU'
                  ? 'bg-blue-900/50 text-blue-200'
                  : line.speaker === 'NARRATOR'
                  ? 'bg-purple-900/50 text-purple-200 italic'
                  : 'bg-gray-800 text-gray-200'
              }`}>
                <p className="text-xs text-gray-500 mb-1">{line.speaker}</p>
                <p className="text-sm">
                  {line.isStreaming ? (
                    <span className="animate-pulse">{streamingText || '...'}</span>
                  ) : (
                    line.text
                  )}
                </p>
              </div>
            </div>
          ))}
          <div ref={historyEndRef} />
        </div>

        {/* Dynamic Mode Input */}
        {dialogueMode === 'dynamic' && !isEnded && (
          <div className="border-t border-gray-700 p-4 space-y-3">
            {/* Quick questions */}
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCustomInput(q.question)
                    inputRef.current?.focus()
                  }}
                  disabled={isStreaming}
                  className="px-4 py-2.5 md:px-3 md:py-1 text-sm md:text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700 active:bg-gray-600 disabled:opacity-50"
                >
                  {q.text}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDynamicInput()}
                placeholder="Ask something..."
                disabled={isStreaming}
                className="flex-1 px-4 py-3 md:px-3 md:py-2 text-base md:text-sm bg-gray-800 text-gray-200 border border-gray-700 rounded focus:border-amber-600 outline-none disabled:opacity-50"
              />
              <button
                onClick={handleDynamicInput}
                disabled={isStreaming || !customInput.trim()}
                className="px-5 py-3 md:px-4 md:py-2 text-base md:text-sm bg-amber-700 text-amber-100 rounded hover:bg-amber-600 active:bg-amber-500 disabled:opacity-50"
              >
                {isStreaming ? '...' : 'Ask'}
              </button>
            </div>

            {/* End conversation button */}
            <button
              onClick={handleClose}
              disabled={isStreaming}
              className="w-full py-3 md:py-2 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 active:bg-gray-600 text-base md:text-sm"
            >
              End Conversation
            </button>
          </div>
        )}

        {/* Scripted Mode Response Options */}
        {dialogueMode === 'scripted' && !isEnded && currentNode?.responses && !showSkillCheck && (
          <div className="border-t border-gray-700 p-4 space-y-2">
            {currentNode.responses
              .filter(response => {
                // On revisit, hide responses marked 'hide' that were already chosen
                if (isRevisit && response.revisitBehavior === 'hide' && chosenResponses.includes(response.id)) {
                  return false
                }
                // Filter by proficiency requirement
                if (response.requiresProficiency) {
                  const profLevels: ProficiencyLevel[] = ['novice', 'apprentice', 'journeyman', 'expert', 'master']
                  const requiredIdx = profLevels.indexOf(response.requiresProficiency)
                  const currentIdx = profLevels.indexOf(getInvestigationLevel('witnessInterrogation'))
                  if (currentIdx < requiredIdx) return false
                }
                return true
              })
              .map(response => {
              const proficiencyBonus = getInvestigationBonus('witnessInterrogation')
              const effectiveDifficulty = response.skillCheck
                ? Math.max(1, response.skillCheck.difficulty - proficiencyBonus)
                : 0
              const statValue = response.skillCheck ? getStat(response.skillCheck.stat as StatName) : 0
              const meetsRequirement = !response.skillCheck || statValue >= effectiveDifficulty
              const karmaCost = response.goldCost || response.karmaCost || 0
              const canAffordCost = karmaCost <= 0 || canAfford('neutral', karmaCost)
              const isAvailable = meetsRequirement && canAffordCost

              // Memory indicators
              const wasPreviouslyChosen = chosenResponses.includes(response.id)
              const isDimmed = isRevisit && response.revisitBehavior === 'show_dimmed' && wasPreviouslyChosen
              const isNewOption = isRevisit && !wasPreviouslyChosen && !response.revisitBehavior

              // Use alternate text on revisit if applicable
              const shouldUseAlternate = isRevisit && response.revisitBehavior === 'show_alternate' && wasPreviouslyChosen && response.alternateText
              const responseText = shouldUseAlternate
                ? response.alternateText!
                : (response.displayText || response.text)

              // Determine alignment label for this option
              const alignmentLabel = getAlignmentLabel(response)

              return (
                <button
                  key={response.id}
                  onClick={() => {
                    checkFreeformUnlock(response.text)
                    handleSelectResponse(response)
                  }}
                  className={`w-full p-4 md:p-3 text-left rounded transition-colors active:scale-[0.99] ${
                    isDimmed
                      ? 'bg-gray-900/40 text-gray-500 hover:bg-gray-800/60'
                      : isAvailable
                      ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 active:bg-gray-600'
                      : 'bg-gray-900/60 text-gray-600 cursor-not-allowed opacity-75'
                  }`}
                  disabled={!isAvailable}
                >
                  <div className="flex items-start gap-2">
                    {/* Alignment icon */}
                    {alignmentLabel && (
                      <span className="text-xs mt-0.5 opacity-70 shrink-0">{alignmentLabel}</span>
                    )}
                    {/* Lock icon for unavailable options */}
                    {!isAvailable && (
                      <span className="text-xs mt-0.5 shrink-0 text-gray-600">🔒</span>
                    )}
                    {/* Proficiency icon for gated options */}
                    {response.requiresProficiency && (
                      <span className="text-xs mt-0.5 shrink-0 text-emerald-400" title={`Requires ${response.requiresProficiency} investigation skill`}>🔍</span>
                    )}
                    <div className="flex-1">
                      {/* Skill check label in Fallout style - before the text */}
                      {response.skillCheck && (
                        <span className={`font-mono text-xs mr-1 ${
                          meetsRequirement ? 'text-amber-400' : 'text-red-500'
                        }`}>
                          [{response.skillCheck.stat} {effectiveDifficulty}]
                          {proficiencyBonus > 0 && (
                            <span className="text-emerald-400 text-[10px] ml-0.5">-{proficiencyBonus}</span>
                          )}
                        </span>
                      )}
                      <span className="text-base md:text-sm">
                        {responseText}
                      </span>
                      {/* Memory indicators */}
                      {isDimmed && (
                        <span className="ml-2 text-xs text-gray-600 italic">(asked before)</span>
                      )}
                      {isNewOption && (
                        <span className="ml-2 text-xs text-emerald-500 font-medium">(new)</span>
                      )}
                      {/* Stat gap indicator for failed checks */}
                      {response.skillCheck && !meetsRequirement && (
                        <span className="ml-2 text-xs text-red-500/70 italic">
                          (Need {effectiveDifficulty}, have {statValue})
                        </span>
                      )}
                    </div>
                    {/* Cost indicators on the right */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {karmaCost > 0 && (
                        <span className={`text-xs ${canAffordCost ? 'text-yellow-400' : 'text-red-400'}`}>
                          {karmaCost}🌮
                        </span>
                      )}
                      {response.karmaGood && response.karmaGood > 0 && (
                        <span className="text-amber-400 text-xs">+{response.karmaGood}🍪</span>
                      )}
                      {response.karmaGood && response.karmaGood < 0 && (
                        <span className="text-red-400 text-xs">+{Math.abs(response.karmaGood)}🪨</span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
            {/* Speak freely option — unlocked via rapport or easter egg */}
            {freeformUnlocked && ollamaAvailable && (
              <button
                onClick={enterFreeformMode}
                className="w-full p-4 md:p-3 text-left rounded transition-colors active:scale-[0.99] bg-indigo-900/50 text-indigo-200 hover:bg-indigo-800/50 active:bg-indigo-700/50 border border-indigo-600/30"
              >
                <span className="text-xs mr-2 opacity-70">✨</span>
                <span className="text-base md:text-sm italic">[Speak freely...]</span>
              </button>
            )}
          </div>
        )}

        {/* End of Dialogue */}
        {(isEnded || (dialogueMode === 'scripted' && !currentNode?.responses && !showSkillCheck)) && (
          <div className="border-t border-gray-700 p-4">
            <button
              onClick={handleClose}
              className="w-full py-3 md:py-2 bg-amber-700 text-amber-100 rounded hover:bg-amber-600 active:bg-amber-500 text-base md:text-sm"
            >
              End Conversation
            </button>
          </div>
        )}

        {/* Loading state */}
        {dialogueMode === 'checking' && (
          <div className="border-t border-gray-700 p-4 text-center text-gray-500">
            <p className="animate-pulse">Connecting to witness...</p>
          </div>
        )}
      </div>

      {/* Skill Check Modal */}
      {showSkillCheck && (
        <SkillCheck
          stat={showSkillCheck.stat}
          difficulty={showSkillCheck.difficulty}
          description={showSkillCheck.description}
          onResult={handleSkillCheckResult}
          onCancel={() => {
            setShowSkillCheck(null)
            addToHistory('YOU', '*backs down*')
          }}
        />
      )}
    </div>
  )
}

// Get alignment label emoji for a dialogue response
function getAlignmentLabel(response: DialogueResponse): string {
  const lawful = response.karmaLawful || 0
  const good = response.karmaGood || 0

  // Determine alignment flavor
  if (lawful > 0 && good > 0) return '⚖️😇' // Lawful Good
  if (lawful > 0 && good < 0) return '⚖️😈' // Lawful Evil
  if (lawful > 0 && good === 0) return '⚖️' // Lawful
  if (lawful < 0 && good > 0) return '🎲😇' // Chaotic Good
  if (lawful < 0 && good < 0) return '🎲😈' // Chaotic Evil
  if (lawful < 0 && good === 0) return '🎲' // Chaotic
  if (good > 0) return '😇' // Good
  if (good < 0) return '😈' // Evil
  if (response.skillCheck) return '🎯' // Skill check
  return '🌮' // Neutral (taco)
}

// Helper functions
function getWitnessLabel(type: WitnessType): string {
  const labels: Record<WitnessType, string> = {
    bartender: 'The Bartender',
    shopkeeper: 'The Shopkeeper',
    stable_hand: 'The Stable Hand',
    traveler: 'A Traveler',
    settler: 'A Settler',
    native_trader: 'Native Trader',
    telegraph_operator: 'Telegraph Operator',
    sheriff_deputy: 'Deputy Sheriff',
    prostitute: 'A Woman',
    preacher: 'The Preacher',
    drunk: 'A Drunk',
    child: 'A Child'
  }
  return labels[type] || 'Witness'
}

function getWitnessEmoji(type: WitnessType): string {
  const emojis: Record<WitnessType, string> = {
    bartender: '🍺',
    shopkeeper: '🏪',
    stable_hand: '🐴',
    traveler: '🧭',
    settler: '🏠',
    native_trader: '🪶',
    telegraph_operator: '⚡',
    sheriff_deputy: '⭐',
    prostitute: '🌹',
    preacher: '✝️',
    drunk: '🍻',
    child: '👦'
  }
  return emojis[type] || '🗣️'
}

export default WitnessDialogue
