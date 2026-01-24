'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { ollamaService } from '@/lib/ollama/ollamaService'
import type {
  NPCConversationState,
  ConversationTurn,
  NPCMood,
  OllamaServiceStatus,
} from '@/lib/ollama/types'
import {
  NPC_PERSONALITIES,
  buildNPCSystemPrompt,
  getPersonality,
  generateNPCName,
  type NPCPersonality,
} from './data/npcPersonalities'
import type { WitnessType } from './data/clueTemplates'

// Storage key for conversation persistence
const NPC_STORAGE_KEY = 'bobr_npc_conversations'

interface NPCState {
  // Ollama service status
  ollamaAvailable: boolean
  ollamaModel: string | null
  lastHealthCheck: number

  // Active conversation
  activeConversation: NPCConversationState | null
  isGenerating: boolean
  streamingText: string

  // All conversations (for memory)
  conversations: Record<string, NPCConversationState>

  // Settings
  useOllama: boolean // User preference
}

interface NPCContextValue {
  state: NPCState

  // Service management
  checkOllamaHealth: () => Promise<OllamaServiceStatus>
  setUseOllama: (use: boolean) => void
  isOllamaReady: () => boolean

  // Conversation management
  startConversation: (
    witnessType: WitnessType,
    location: string,
    availableClue?: { trait: string; value: string }
  ) => NPCConversationState
  endConversation: () => void
  getConversation: (npcId: string) => NPCConversationState | null
  hasConversedWith: (witnessType: WitnessType, location: string) => boolean

  // Dialogue generation
  sendMessage: (
    message: string,
    options?: {
      characterStats?: { diplomacy: number; shrewdness: number; luck: number }
      narratorMood?: string
    }
  ) => Promise<{ response: string; clueRevealed?: string } | null>
  sendMessageStream: (
    message: string,
    onChunk: (chunk: string) => void,
    options?: {
      characterStats?: { diplomacy: number; shrewdness: number; luck: number }
      narratorMood?: string
    }
  ) => Promise<{ response: string; clueRevealed?: string } | null>

  // Mood and trust
  updateNPCMood: (mood: NPCMood) => void
  adjustTrust: (delta: number) => void

  // Utilities
  getPersonalityFor: (witnessType: WitnessType) => NPCPersonality
  generateNameFor: (witnessType: WitnessType, location: string) => string
  clearConversationHistory: () => void
}

const defaultState: NPCState = {
  ollamaAvailable: false,
  ollamaModel: null,
  lastHealthCheck: 0,
  activeConversation: null,
  isGenerating: false,
  streamingText: '',
  conversations: {},
  useOllama: true,
}

const NPCContext = createContext<NPCContextValue | undefined>(undefined)

export function NPCProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NPCState>(defaultState)

  // Load saved conversations on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const saved = localStorage.getItem(NPC_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setState(prev => ({
          ...prev,
          conversations: parsed.conversations || {},
          useOllama: parsed.useOllama ?? true,
        }))
      }
    } catch (e) {
      console.error('[NPCContext] Failed to load saved conversations:', e)
    }

    // Check Ollama on mount
    checkOllamaHealth()
  }, [])

  // Save conversations when they change
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(NPC_STORAGE_KEY, JSON.stringify({
        conversations: state.conversations,
        useOllama: state.useOllama,
      }))
    } catch (e) {
      console.error('[NPCContext] Failed to save conversations:', e)
    }
  }, [state.conversations, state.useOllama])

  // Check Ollama health
  const checkOllamaHealth = useCallback(async (): Promise<OllamaServiceStatus> => {
    const status = await ollamaService.checkHealth(true)
    setState(prev => ({
      ...prev,
      ollamaAvailable: status.available,
      ollamaModel: status.model,
      lastHealthCheck: Date.now(),
    }))
    return status
  }, [])

  // Toggle Ollama usage
  const setUseOllama = useCallback((use: boolean) => {
    setState(prev => ({ ...prev, useOllama: use }))
  }, [])

  // Check if Ollama is ready
  const isOllamaReady = useCallback((): boolean => {
    return state.ollamaAvailable && state.useOllama
  }, [state.ollamaAvailable, state.useOllama])

  // Generate unique NPC ID
  const getNPCId = (witnessType: WitnessType, location: string): string => {
    return `${witnessType}_${location.toLowerCase().replace(/\s+/g, '_')}`
  }

  // Start a new conversation
  const startConversation = useCallback((
    witnessType: WitnessType,
    location: string,
    availableClue?: { trait: string; value: string }
  ): NPCConversationState => {
    const npcId = getNPCId(witnessType, location)
    const personality = getPersonality(witnessType)

    // Check for existing conversation
    const existing = state.conversations[npcId]
    if (existing) {
      setState(prev => ({
        ...prev,
        activeConversation: existing,
      }))
      return existing
    }

    // Create new conversation
    const newConversation: NPCConversationState = {
      npcId,
      witnessType,
      location,
      personality,
      turns: [],
      mood: personality.temperament === 'hostile' ? 'suspicious' : 'neutral',
      trustLevel: personality.temperament === 'friendly' ? 6 : personality.temperament === 'suspicious' ? 3 : 5,
      cluesRevealed: [],
      lastUpdated: Date.now(),
    }

    // Store available clue as metadata
    if (availableClue) {
      (newConversation as NPCConversationState & { availableClue?: typeof availableClue }).availableClue = availableClue
    }

    setState(prev => ({
      ...prev,
      activeConversation: newConversation,
      conversations: {
        ...prev.conversations,
        [npcId]: newConversation,
      },
    }))

    return newConversation
  }, [state.conversations])

  // End current conversation
  const endConversation = useCallback(() => {
    if (!state.activeConversation) return

    setState(prev => ({
      ...prev,
      activeConversation: null,
      isGenerating: false,
      streamingText: '',
    }))
  }, [state.activeConversation])

  // Get existing conversation
  const getConversation = useCallback((npcId: string): NPCConversationState | null => {
    return state.conversations[npcId] || null
  }, [state.conversations])

  // Check if player has conversed with this NPC
  const hasConversedWith = useCallback((witnessType: WitnessType, location: string): boolean => {
    const npcId = getNPCId(witnessType, location)
    const conv = state.conversations[npcId]
    return conv ? conv.turns.length > 0 : false
  }, [state.conversations])

  // Build conversation history for prompt
  const buildConversationHistory = (turns: ConversationTurn[]): string => {
    if (turns.length === 0) return ''

    return turns
      .slice(-6) // Keep last 6 turns for context
      .map(turn => `${turn.speaker === 'player' ? 'Player' : 'NPC'}: ${turn.text}`)
      .join('\n')
  }

  // Check if clue was revealed in response
  const checkClueRevealed = (
    response: string,
    availableClue?: { trait: string; value: string }
  ): string | undefined => {
    if (!availableClue) return undefined

    const { trait, value } = availableClue
    const valueLower = value.toLowerCase()
    const responseLower = response.toLowerCase()

    // Check if the clue value appears in response
    if (responseLower.includes(valueLower)) {
      return `${trait}: ${value}`
    }

    // Check for trait-specific keywords
    const traitKeywords: Record<string, string[]> = {
      horse: ['horse', 'mare', 'stallion', 'mount', 'rode'],
      hat: ['hat', 'wore', 'head', 'stetson', 'bowler', 'sombrero'],
      weapon: ['gun', 'pistol', 'rifle', 'knife', 'weapon', 'armed'],
      vice: ['drink', 'smoke', 'gambl', 'whiskey', 'cigar', 'cards'],
      accent: ['spoke', 'talk', 'voice', 'accent', 'sound'],
      build: ['tall', 'short', 'thin', 'stocky', 'big', 'small', 'built'],
      mark: ['scar', 'missing', 'limp', 'tattoo', 'eye', 'tooth'],
    }

    const keywords = traitKeywords[trait] || []
    const mentionsTrait = keywords.some(kw => responseLower.includes(kw))

    if (mentionsTrait && responseLower.includes(valueLower)) {
      return `${trait}: ${value}`
    }

    return undefined
  }

  // Send message (non-streaming)
  const sendMessage = useCallback(async (
    message: string,
    options?: {
      characterStats?: { diplomacy: number; shrewdness: number; luck: number }
      narratorMood?: string
    }
  ): Promise<{ response: string; clueRevealed?: string } | null> => {
    if (!state.activeConversation) return null

    setState(prev => ({ ...prev, isGenerating: true }))

    const conv = state.activeConversation
    const availableClue = (conv as NPCConversationState & { availableClue?: { trait: string; value: string } }).availableClue

    // Add player message to history
    const playerTurn: ConversationTurn = {
      id: `turn_${Date.now()}_player`,
      speaker: 'player',
      text: message,
      timestamp: Date.now(),
    }

    // Try Ollama if available
    if (isOllamaReady()) {
      const systemPrompt = buildNPCSystemPrompt(
        conv.personality,
        conv.location,
        availableClue,
        options?.narratorMood
      )

      const history = buildConversationHistory(conv.turns)
      const prompt = history ? `${history}\nPlayer: ${message}\nNPC:` : `Player: ${message}\nNPC:`

      const result = await ollamaService.generateNPCDialogue(
        prompt,
        systemPrompt,
        conv.ollamaContext,
        { temperature: 0.8, maxTokens: 200 }
      )

      if (result) {
        const clueRevealed = checkClueRevealed(result.response, availableClue)

        const npcTurn: ConversationTurn = {
          id: `turn_${Date.now()}_npc`,
          speaker: 'npc',
          text: result.response,
          timestamp: Date.now(),
          clueRevealed,
        }

        // Update conversation
        const updatedConv: NPCConversationState = {
          ...conv,
          turns: [...conv.turns, playerTurn, npcTurn],
          ollamaContext: result.context,
          cluesRevealed: clueRevealed
            ? [...conv.cluesRevealed, clueRevealed]
            : conv.cluesRevealed,
          lastUpdated: Date.now(),
        }

        setState(prev => ({
          ...prev,
          isGenerating: false,
          activeConversation: updatedConv,
          conversations: {
            ...prev.conversations,
            [conv.npcId]: updatedConv,
          },
        }))

        return { response: result.response, clueRevealed }
      }
    }

    // Fallback: return null to signal WitnessDialogue should use scripted dialogue
    setState(prev => ({ ...prev, isGenerating: false }))
    return null
  }, [state.activeConversation, isOllamaReady])

  // Send message with streaming
  const sendMessageStream = useCallback(async (
    message: string,
    onChunk: (chunk: string) => void,
    options?: {
      characterStats?: { diplomacy: number; shrewdness: number; luck: number }
      narratorMood?: string
    }
  ): Promise<{ response: string; clueRevealed?: string } | null> => {
    if (!state.activeConversation) return null
    if (!isOllamaReady()) return null

    setState(prev => ({ ...prev, isGenerating: true, streamingText: '' }))

    const conv = state.activeConversation
    const availableClue = (conv as NPCConversationState & { availableClue?: { trait: string; value: string } }).availableClue

    // Add player message to history
    const playerTurn: ConversationTurn = {
      id: `turn_${Date.now()}_player`,
      speaker: 'player',
      text: message,
      timestamp: Date.now(),
    }

    const systemPrompt = buildNPCSystemPrompt(
      conv.personality,
      conv.location,
      availableClue,
      options?.narratorMood
    )

    const history = buildConversationHistory(conv.turns)
    const prompt = history ? `${history}\nPlayer: ${message}\nNPC:` : `Player: ${message}\nNPC:`

    let fullResponse = ''
    const stream = ollamaService.streamNPCDialogue(
      prompt,
      systemPrompt,
      conv.ollamaContext,
      { temperature: 0.8, maxTokens: 200 }
    )

    try {
      for await (const chunk of stream) {
        fullResponse += chunk
        setState(prev => ({ ...prev, streamingText: fullResponse }))
        onChunk(chunk)
      }

      // Get final result
      const result = await stream.return(null)
      const finalContext = typeof result.value === 'object' && result.value !== null ? result.value.context : undefined

      const clueRevealed = checkClueRevealed(fullResponse, availableClue)

      const npcTurn: ConversationTurn = {
        id: `turn_${Date.now()}_npc`,
        speaker: 'npc',
        text: fullResponse,
        timestamp: Date.now(),
        clueRevealed,
      }

      // Update conversation
      const updatedConv: NPCConversationState = {
        ...conv,
        turns: [...conv.turns, playerTurn, npcTurn],
        ollamaContext: finalContext,
        cluesRevealed: clueRevealed
          ? [...conv.cluesRevealed, clueRevealed]
          : conv.cluesRevealed,
        lastUpdated: Date.now(),
      }

      setState(prev => ({
        ...prev,
        isGenerating: false,
        streamingText: '',
        activeConversation: updatedConv,
        conversations: {
          ...prev.conversations,
          [conv.npcId]: updatedConv,
        },
      }))

      return { response: fullResponse, clueRevealed }
    } catch (error) {
      console.error('[NPCContext] Stream error:', error)
      setState(prev => ({ ...prev, isGenerating: false, streamingText: '' }))
      return null
    }
  }, [state.activeConversation, isOllamaReady])

  // Update NPC mood
  const updateNPCMood = useCallback((mood: NPCMood) => {
    if (!state.activeConversation) return

    setState(prev => {
      if (!prev.activeConversation) return prev

      const updatedConv = {
        ...prev.activeConversation,
        mood,
        lastUpdated: Date.now(),
      }

      return {
        ...prev,
        activeConversation: updatedConv,
        conversations: {
          ...prev.conversations,
          [updatedConv.npcId]: updatedConv,
        },
      }
    })
  }, [state.activeConversation])

  // Adjust trust level
  const adjustTrust = useCallback((delta: number) => {
    if (!state.activeConversation) return

    setState(prev => {
      if (!prev.activeConversation) return prev

      const newTrust = Math.max(0, Math.min(10, prev.activeConversation.trustLevel + delta))
      const updatedConv = {
        ...prev.activeConversation,
        trustLevel: newTrust,
        lastUpdated: Date.now(),
      }

      return {
        ...prev,
        activeConversation: updatedConv,
        conversations: {
          ...prev.conversations,
          [updatedConv.npcId]: updatedConv,
        },
      }
    })
  }, [state.activeConversation])

  // Get personality for witness type
  const getPersonalityFor = useCallback((witnessType: WitnessType): NPCPersonality => {
    return getPersonality(witnessType)
  }, [])

  // Generate name for NPC
  const generateNameFor = useCallback((witnessType: WitnessType, location: string): string => {
    return generateNPCName(witnessType, location)
  }, [])

  // Clear all conversation history
  const clearConversationHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      conversations: {},
      activeConversation: null,
    }))
    if (typeof window !== 'undefined') {
      localStorage.removeItem(NPC_STORAGE_KEY)
    }
  }, [])

  const contextValue: NPCContextValue = {
    state,
    checkOllamaHealth,
    setUseOllama,
    isOllamaReady,
    startConversation,
    endConversation,
    getConversation,
    hasConversedWith,
    sendMessage,
    sendMessageStream,
    updateNPCMood,
    adjustTrust,
    getPersonalityFor,
    generateNameFor,
    clearConversationHistory,
  }

  return (
    <NPCContext.Provider value={contextValue}>
      {children}
    </NPCContext.Provider>
  )
}

export function useNPC() {
  const context = useContext(NPCContext)
  if (!context) {
    throw new Error('useNPC must be used within an NPCProvider')
  }
  return context
}

export type { NPCContextValue, NPCState }
