'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { type WitnessType, WITNESS_PERSONALITIES } from '../data/clueTemplates'
import { type DialogueTree, type DialogueNode, type DialogueResponse, getDialogueTree } from '../data/dialogueTrees'
import { useCharacter, type StatName, type SkillCheckResult } from '../characterContext'
import { useReputation, type FactionId } from '../reputationContext'
import { useNarrator } from '../narratorContext'
import { useMystery, type CollectedClue } from '../mysteryContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { useNPC } from '../npcContext'
import type { NPCPersonality } from '../data/npcPersonalities'
import { SkillCheck } from './SkillCheck'

interface WitnessDialogueProps {
  witnessType: WitnessType
  location: string
  clue?: CollectedClue  // The clue this witness has
  onClose: () => void
  onClueObtained?: (clue: CollectedClue) => void
}

type DialogueMode = 'checking' | 'dynamic' | 'scripted'

export function WitnessDialogue({ witnessType, location, clue, onClose, onClueObtained }: WitnessDialogueProps) {
  const { getStat, rollSkillCheck } = useCharacter()
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
  const [dialogueMode, setDialogueMode] = useState<DialogueMode>('checking')
  const [customInput, setCustomInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')

  // Scripted dialogue state
  const [dialogueTree] = useState<DialogueTree>(getDialogueTree(witnessType))
  const [currentNodeId, setCurrentNodeId] = useState(dialogueTree.startNode)
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

  const historyEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const witness = WITNESS_PERSONALITIES[witnessType]
  const currentNode = dialogueTree.nodes[currentNodeId]
  const personality = getPersonalityFor(witnessType)
  const npcName = generateNameFor(witnessType, location)

  // Scroll to bottom on new messages
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [dialogueHistory, streamingText])

  // Check Ollama availability on mount
  useEffect(() => {
    async function checkMode() {
      const status = await checkOllamaHealth()
      if (status.available) {
        setDialogueMode('dynamic')
        // Start NPC conversation with clue info
        startConversation(
          witnessType,
          location,
          clue ? { trait: clue.trait || 'unknown', value: clue.value || '' } : undefined
        )
        // Add initial greeting
        const greeting = getInitialGreeting(personality, witnessType)
        addToHistory(npcName, greeting)
      } else {
        setDialogueMode('scripted')
        // Process initial node for scripted mode
        if (currentNode) {
          processNodeEffects(currentNode)
        }
      }
    }
    checkMode()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
        addToHistory('NARRATOR', `You need ${karmaCost}🪙 to do that.`)
        return
      }
      await spendNeutral(karmaCost, `Dialogue: ${response.text.substring(0, 30)}...`)
    }

    addToHistory('YOU', response.displayText || response.text)
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

      setShowSkillCheck({
        stat: response.skillCheck.stat as StatName,
        difficulty: response.skillCheck.difficulty - interactionBonus,
        description: `${response.skillCheck.stat} check to ${response.text.toLowerCase()}`,
        onSuccess: () => {
          setShowSkillCheck(null)
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
    }

    setCurrentNodeId(response.nextNode)
    const nextNode = dialogueTree.nodes[response.nextNode]
    if (nextNode) {
      setTimeout(() => processNodeEffects(nextNode), 300)
    }
  }, [dialogueTree.nodes, witnessType, location, clue, clueObtained, addClue, onClueObtained, modifyReputation, getInteractionBonus, recordPlayerAction, addToHistory, processNodeEffects, canAfford, spendNeutral, earnGood, addBadKarma])

  // Handle skill check result
  const handleSkillCheckResult = useCallback((result: SkillCheckResult) => {
    if (showSkillCheck) {
      if (result.success) {
        setMood('impressed')
        showSkillCheck.onSuccess()
      } else {
        setMood('annoyed')
        showSkillCheck.onFailure()
      }
    }
  }, [showSkillCheck, setMood])

  // Handle close
  const handleClose = useCallback(() => {
    endConversation()
    onClose()
  }, [endConversation, onClose])

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
          <div className="text-right">
            {clueObtained && (
              <span className="text-emerald-400 text-xs">✓ Clue Obtained</span>
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
            {currentNode.responses.map(response => {
              const statValue = response.skillCheck ? getStat(response.skillCheck.stat as StatName) : 0
              const meetsRequirement = !response.skillCheck || statValue >= response.skillCheck.difficulty

              return (
                <button
                  key={response.id}
                  onClick={() => handleSelectResponse(response)}
                  className={`w-full p-4 md:p-3 text-left rounded transition-colors active:scale-[0.99] ${
                    meetsRequirement
                      ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 active:bg-gray-600'
                      : 'bg-gray-900 text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={!meetsRequirement}
                >
                  <span className="text-base md:text-sm">{response.displayText || response.text}</span>
                  {response.skillCheck && (
                    <span className={`ml-2 text-xs ${
                      meetsRequirement ? 'text-amber-400' : 'text-gray-600'
                    }`}>
                      [{response.skillCheck.stat} {response.skillCheck.difficulty}]
                      {!meetsRequirement && ` (You have ${statValue})`}
                    </span>
                  )}
                  {(response.goldCost || response.karmaCost) && (
                    <span className={`ml-2 text-xs ${canAfford('neutral', response.goldCost || response.karmaCost || 0) ? 'text-yellow-400' : 'text-red-400'}`}>
                      {response.goldCost || response.karmaCost}🪙
                    </span>
                  )}
                  {response.karmaGood && response.karmaGood > 0 && (
                    <span className="ml-2 text-amber-400 text-xs">[+{response.karmaGood}🍪]</span>
                  )}
                  {response.karmaGood && response.karmaGood < 0 && (
                    <span className="ml-2 text-red-400 text-xs">[+{Math.abs(response.karmaGood)}🪨]</span>
                  )}
                </button>
              )
            })}
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
