/**
 * BOBR Conversation Store
 *
 * Persists NPC conversation history to localStorage with session management.
 * Supports conversation memory, visit tracking, and relationship progression.
 */

import type { ConversationTurn, NPCConversationState, NPCMood } from '@/lib/ollama/types'

const STORAGE_KEY = 'bobr_conversation_store'
const STORE_VERSION = '1.0.0'
const MAX_CONVERSATIONS = 50 // Max NPCs to remember
const MAX_TURNS_PER_NPC = 20 // Max turns to keep per NPC

// Stored conversation data (subset of full state for storage efficiency)
interface StoredConversation {
  npcId: string
  witnessType: string
  location: string
  turns: StoredTurn[]
  mood: NPCMood
  trustLevel: number
  cluesRevealed: string[]
  visitCount: number
  firstVisit: number
  lastVisit: number
}

interface StoredTurn {
  speaker: 'player' | 'npc'
  text: string
  timestamp: number
  clueRevealed?: string
}

interface ConversationStoreData {
  version: string
  conversations: Record<string, StoredConversation>
  lastUpdated: number
}

// Default empty store
const defaultStore: ConversationStoreData = {
  version: STORE_VERSION,
  conversations: {},
  lastUpdated: Date.now(),
}

/**
 * ConversationStore - handles localStorage persistence
 */
export const ConversationStore = {
  /**
   * Load store from localStorage
   */
  load(): ConversationStoreData {
    if (typeof window === 'undefined') return { ...defaultStore }

    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return { ...defaultStore }

      const parsed: ConversationStoreData = JSON.parse(data)

      // Version migration
      if (parsed.version !== STORE_VERSION) {
        return this.migrate(parsed)
      }

      return parsed
    } catch (e) {
      console.error('[ConversationStore] Failed to load:', e)
      return { ...defaultStore }
    }
  },

  /**
   * Save store to localStorage
   */
  save(store: ConversationStoreData): boolean {
    if (typeof window === 'undefined') return false

    try {
      store.lastUpdated = Date.now()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
      return true
    } catch (e) {
      console.error('[ConversationStore] Failed to save:', e)
      return false
    }
  },

  /**
   * Migrate from older versions
   */
  migrate(oldStore: Partial<ConversationStoreData>): ConversationStoreData {
    // Simple migration: keep conversations, update version
    return {
      version: STORE_VERSION,
      conversations: oldStore.conversations || {},
      lastUpdated: Date.now(),
    }
  },

  /**
   * Get a specific conversation
   */
  getConversation(npcId: string): StoredConversation | null {
    const store = this.load()
    return store.conversations[npcId] || null
  },

  /**
   * Save or update a conversation
   */
  saveConversation(conversation: NPCConversationState): boolean {
    const store = this.load()

    // Convert to stored format
    const stored: StoredConversation = {
      npcId: conversation.npcId,
      witnessType: conversation.witnessType,
      location: conversation.location,
      turns: conversation.turns.slice(-MAX_TURNS_PER_NPC).map(t => ({
        speaker: t.speaker,
        text: t.text,
        timestamp: t.timestamp,
        clueRevealed: t.clueRevealed,
      })),
      mood: conversation.mood,
      trustLevel: conversation.trustLevel,
      cluesRevealed: conversation.cluesRevealed,
      visitCount: (store.conversations[conversation.npcId]?.visitCount || 0) + 1,
      firstVisit: store.conversations[conversation.npcId]?.firstVisit || Date.now(),
      lastVisit: Date.now(),
    }

    store.conversations[conversation.npcId] = stored

    // Prune old conversations if over limit
    const npcIds = Object.keys(store.conversations)
    if (npcIds.length > MAX_CONVERSATIONS) {
      // Sort by last visit, remove oldest
      const sortedIds = npcIds.sort(
        (a, b) => store.conversations[b].lastVisit - store.conversations[a].lastVisit
      )
      const toRemove = sortedIds.slice(MAX_CONVERSATIONS)
      toRemove.forEach(id => delete store.conversations[id])
    }

    return this.save(store)
  },

  /**
   * Get visit count for an NPC
   */
  getVisitCount(npcId: string): number {
    const conv = this.getConversation(npcId)
    return conv?.visitCount || 0
  },

  /**
   * Check if player has talked to this NPC before
   */
  hasMetBefore(npcId: string): boolean {
    return this.getVisitCount(npcId) > 0
  },

  /**
   * Get all conversations for a location
   */
  getConversationsAtLocation(location: string): StoredConversation[] {
    const store = this.load()
    return Object.values(store.conversations).filter(
      c => c.location.toLowerCase() === location.toLowerCase()
    )
  },

  /**
   * Get all clues revealed by a specific NPC
   */
  getCluesFrom(npcId: string): string[] {
    const conv = this.getConversation(npcId)
    return conv?.cluesRevealed || []
  },

  /**
   * Get all clues revealed at a location
   */
  getCluesAtLocation(location: string): string[] {
    const conversations = this.getConversationsAtLocation(location)
    return conversations.flatMap(c => c.cluesRevealed)
  },

  /**
   * Get conversation summary for an NPC (for display)
   */
  getConversationSummary(npcId: string): {
    exists: boolean
    visitCount: number
    turnCount: number
    lastTopic: string | null
    trustLevel: number
    mood: NPCMood
  } {
    const conv = this.getConversation(npcId)

    if (!conv) {
      return {
        exists: false,
        visitCount: 0,
        turnCount: 0,
        lastTopic: null,
        trustLevel: 5,
        mood: 'neutral',
      }
    }

    // Find last player message as "last topic"
    const lastPlayerTurn = [...conv.turns].reverse().find(t => t.speaker === 'player')

    return {
      exists: true,
      visitCount: conv.visitCount,
      turnCount: conv.turns.length,
      lastTopic: lastPlayerTurn?.text.slice(0, 50) || null,
      trustLevel: conv.trustLevel,
      mood: conv.mood,
    }
  },

  /**
   * Get relationship status across all NPCs
   */
  getRelationshipOverview(): {
    totalNPCsMet: number
    totalCluesRevealed: number
    averageTrust: number
    friendlyNPCs: string[]
    hostileNPCs: string[]
  } {
    const store = this.load()
    const conversations = Object.values(store.conversations)

    if (conversations.length === 0) {
      return {
        totalNPCsMet: 0,
        totalCluesRevealed: 0,
        averageTrust: 5,
        friendlyNPCs: [],
        hostileNPCs: [],
      }
    }

    const totalClues = conversations.reduce((sum, c) => sum + c.cluesRevealed.length, 0)
    const avgTrust = conversations.reduce((sum, c) => sum + c.trustLevel, 0) / conversations.length
    const friendly = conversations.filter(c => c.trustLevel >= 7).map(c => c.npcId)
    const hostile = conversations.filter(c => c.trustLevel <= 3).map(c => c.npcId)

    return {
      totalNPCsMet: conversations.length,
      totalCluesRevealed: totalClues,
      averageTrust: Math.round(avgTrust * 10) / 10,
      friendlyNPCs: friendly,
      hostileNPCs: hostile,
    }
  },

  /**
   * Clear all conversation history
   */
  clear(): boolean {
    if (typeof window === 'undefined') return false

    try {
      localStorage.removeItem(STORAGE_KEY)
      return true
    } catch (e) {
      console.error('[ConversationStore] Failed to clear:', e)
      return false
    }
  },

  /**
   * Export all conversations (for backup)
   */
  export(): string {
    const store = this.load()
    return JSON.stringify(store, null, 2)
  },

  /**
   * Import conversations (from backup)
   */
  import(jsonString: string): boolean {
    try {
      const data: ConversationStoreData = JSON.parse(jsonString)
      if (data.version && data.conversations) {
        return this.save(data)
      }
      return false
    } catch (e) {
      console.error('[ConversationStore] Failed to import:', e)
      return false
    }
  },
}

/**
 * Helper to generate NPC ID consistently
 */
export function generateNPCId(witnessType: string, location: string): string {
  return `${witnessType}_${location.toLowerCase().replace(/\s+/g, '_')}`
}

/**
 * Get greeting based on visit history
 */
export function getVisitBasedGreeting(
  witnessType: string,
  location: string
): 'first' | 'return' | 'familiar' | 'regular' {
  const npcId = generateNPCId(witnessType, location)
  const visitCount = ConversationStore.getVisitCount(npcId)

  if (visitCount === 0) return 'first'
  if (visitCount === 1) return 'return'
  if (visitCount < 5) return 'familiar'
  return 'regular'
}

export type { StoredConversation, StoredTurn, ConversationStoreData }
