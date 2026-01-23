'use client'

import React, { useState, useCallback } from 'react'
import { type WitnessType, WITNESS_PERSONALITIES } from '../data/clueTemplates'
import { type DialogueTree, type DialogueNode, type DialogueResponse, getDialogueTree } from '../data/dialogueTrees'
import { useCharacter, type StatName, type SkillCheckResult } from '../characterContext'
import { useReputation, type FactionId } from '../reputationContext'
import { useNarrator } from '../narratorContext'
import { useMystery, type CollectedClue } from '../mysteryContext'
import { useKarmaWallet } from '../karmaWalletContext'
import { SkillCheck } from './SkillCheck'

interface WitnessDialogueProps {
  witnessType: WitnessType
  location: string
  clue?: CollectedClue  // The clue this witness has
  onClose: () => void
  onClueObtained?: (clue: CollectedClue) => void
}

export function WitnessDialogue({ witnessType, location, clue, onClose, onClueObtained }: WitnessDialogueProps) {
  const { getStat, rollSkillCheck } = useCharacter()
  const { modifyReputation, getInteractionBonus } = useReputation()
  const { comment, recordPlayerAction, setMood } = useNarrator()
  const { addClue } = useMystery()
  const { canAfford, spendNeutral, earnGood, addBadKarma } = useKarmaWallet()

  const [dialogueTree] = useState<DialogueTree>(getDialogueTree(witnessType))
  const [currentNodeId, setCurrentNodeId] = useState(dialogueTree.startNode)
  const [dialogueHistory, setDialogueHistory] = useState<Array<{ speaker: string; text: string }>>([])
  const [showSkillCheck, setShowSkillCheck] = useState<{
    stat: StatName
    difficulty: number
    description: string
    onSuccess: () => void
    onFailure: () => void
  } | null>(null)
  const [clueObtained, setClueObtained] = useState(false)
  const [isEnded, setIsEnded] = useState(false)

  const witness = WITNESS_PERSONALITIES[witnessType]
  const currentNode = dialogueTree.nodes[currentNodeId]

  // Add dialogue line to history
  const addToHistory = useCallback((speaker: string, text: string) => {
    setDialogueHistory(prev => [...prev, { speaker, text }])
  }, [])

  // Process node effects
  const processNodeEffects = useCallback((node: DialogueNode) => {
    if (node.effect) {
      if (node.effect.grantClue && clue && !clueObtained) {
        // Replace placeholder with actual clue
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
      // Handle clue placeholder for nodes without explicit effect
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

    // Show narrator comment if present
    if (node.narratorComment) {
      setTimeout(() => {
        comment(node.narratorComment!, 'observation')
      }, 500)
    }

    // Auto-advance if no responses
    if (node.nextNode && !node.responses) {
      setTimeout(() => {
        setCurrentNodeId(node.nextNode!)
      }, 1000)
    }

    // Check if dialogue ended
    if (!node.responses && !node.nextNode) {
      setIsEnded(true)
    }
  }, [clue, clueObtained, witnessType, location, addClue, onClueObtained, modifyReputation, comment, addToHistory])

  // Handle selecting a response
  const handleSelectResponse = useCallback(async (response: DialogueResponse) => {
    // Handle karma cost (bribes, etc.) - check affordability first
    const karmaCost = response.goldCost || response.karmaCost || 0
    if (karmaCost > 0) {
      if (!canAfford('neutral', karmaCost)) {
        addToHistory('NARRATOR', `You need ${karmaCost}🪙 to do that.`)
        return
      }
      await spendNeutral(karmaCost, `Dialogue: ${response.text.substring(0, 30)}...`)
    }

    // Add player's response to history
    addToHistory('YOU', response.displayText || response.text)
    recordPlayerAction(`dialogue_${response.id}`)

    // Handle karma rewards/consequences
    if (response.karmaGood && response.karmaGood > 0) {
      // Virtuous choice earns Good Karma
      await earnGood(response.karmaGood, `Virtuous: ${response.text.substring(0, 20)}...`)
    }
    if (response.karmaGood && response.karmaGood < 0) {
      // Evil choice earns Bad Karma
      await addBadKarma(Math.abs(response.karmaGood), `Dark choice: ${response.text.substring(0, 20)}...`)
    }

    // Handle reputation
    if (response.reputationEffect) {
      modifyReputation(
        response.reputationEffect.faction,
        response.reputationEffect.delta,
        response.displayText || response.text,
        location
      )
    }

    // Handle skill check
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
            // Default failure - witness clams up
            addToHistory(getWitnessLabel(witnessType), "I... I don't think I want to say anything more.")
            setIsEnded(true)
          }
        }
      })
      return
    }

    // Grant clue if response does so
    if (response.grantsClue && clue && !clueObtained) {
      addClue(clue)
      setClueObtained(true)
      onClueObtained?.(clue)
    }

    // Move to next node
    setCurrentNodeId(response.nextNode)
    const nextNode = dialogueTree.nodes[response.nextNode]
    if (nextNode) {
      setTimeout(() => processNodeEffects(nextNode), 300)
    }
  }, [dialogueTree.nodes, witnessType, location, clue, clueObtained, addClue, onClueObtained, modifyReputation, getInteractionBonus, recordPlayerAction, addToHistory, processNodeEffects, canAfford, spendNeutral, earnGood, addBadKarma])

  // Process initial node on mount
  React.useEffect(() => {
    if (currentNode) {
      processNodeEffects(currentNode)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border-2 border-amber-700 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-amber-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getWitnessEmoji(witnessType)}</span>
            <div>
              <h2 className="text-amber-300">{getWitnessLabel(witnessType)}</h2>
              <p className="text-gray-500 text-xs">{location}</p>
            </div>
          </div>
          <div className="text-right">
            {clueObtained && (
              <span className="text-emerald-400 text-xs">\u2713 Clue Obtained</span>
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
                <p className="text-sm">{line.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Response Options */}
        {!isEnded && currentNode?.responses && !showSkillCheck && (
          <div className="border-t border-gray-700 p-4 space-y-2">
            {currentNode.responses.map(response => {
              const statValue = response.skillCheck ? getStat(response.skillCheck.stat as StatName) : 0
              const meetsRequirement = !response.skillCheck || statValue >= response.skillCheck.difficulty

              return (
                <button
                  key={response.id}
                  onClick={() => handleSelectResponse(response)}
                  className={`w-full p-3 text-left rounded transition-colors ${
                    meetsRequirement
                      ? 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                      : 'bg-gray-900 text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={!meetsRequirement}
                >
                  <span className="text-sm">{response.displayText || response.text}</span>
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

        {/* End of Dialogue - show when explicitly ended OR when no responses available */}
        {(isEnded || (!currentNode?.responses && !showSkillCheck)) && (
          <div className="border-t border-gray-700 p-4">
            <button
              onClick={onClose}
              className="w-full py-2 bg-amber-700 text-amber-100 rounded hover:bg-amber-600"
            >
              End Conversation
            </button>
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
    bartender: '\ud83c\udf7a',
    shopkeeper: '\ud83c\udfea',
    stable_hand: '\ud83d\udc34',
    traveler: '\ud83e\udded',
    settler: '\ud83c\udfe0',
    native_trader: '\ud83e\udeb6',
    telegraph_operator: '\u26a1',
    sheriff_deputy: '\u2b50',
    prostitute: '\ud83c\udf39',
    preacher: '\u271d\ufe0f',
    drunk: '\ud83c\udf7b',
    child: '\ud83d\udc66'
  }
  return emojis[type] || '\ud83d\udde3\ufe0f'
}

export default WitnessDialogue
