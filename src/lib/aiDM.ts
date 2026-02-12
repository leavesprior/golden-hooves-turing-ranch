/**
 * AI Dungeon Master - Ollama Integration for BOBR Adventure
 *
 * Generates dynamic NPC responses, encounter descriptions, and skill check narration
 * using a local Ollama instance. Falls back to pre-written content when unavailable.
 */

import type { StatName } from '@/app/oregon-trail/characterContext'
import type { FactionId } from '@/app/oregon-trail/reputationContext'
import type { AlignmentPosition } from '@/lib/karmaStorage'

const OLLAMA_URL = 'http://localhost:11434/api/generate'
const OLLAMA_TIMEOUT = 8000 // 8s timeout
const MODEL = 'llama3.2' // Default model, can be overridden

export interface DMContext {
  playerName: string
  alignment?: AlignmentPosition
  stats?: Record<string, number>
  factionReps?: Partial<Record<FactionId, number>>
  currentLocation?: string
  currentChapter?: number
  activeQuests?: string[]
  recentEvents?: string[]
  gold?: number
  level?: number
}

export interface DMResponse {
  text: string
  source: 'ai' | 'fallback'
  suggestions?: string[]
}

const SYSTEM_PROMPT = `You are the Dungeon Master for a Gold Rush adventure set in 1850s California Gold Country.
Your tone is: atmospheric, historically grounded, with dry frontier humor.
Keep responses to 2-3 sentences max. Be vivid but concise.
Never break character. Reference real Gold Country history when appropriate.
Towns include: Volcano, Angels Camp, Murphys, Jackson, West Point, Columbia, Sonora.
Historical figures: Mark Twain, Black Bart, Joaquin Murieta, Kit Carson, Bret Harte.`

function buildPrompt(context: DMContext, request: string): string {
  const parts = [SYSTEM_PROMPT, '']

  if (context.playerName) parts.push(`Player: ${context.playerName}`)
  if (context.alignment) parts.push(`Alignment: ${context.alignment.replace(/_/g, ' ')}`)
  if (context.currentLocation) parts.push(`Location: ${context.currentLocation}`)
  if (context.currentChapter) parts.push(`Chapter: ${context.currentChapter}/5`)
  if (context.level) parts.push(`Level: ${context.level}`)
  if (context.gold !== undefined) parts.push(`Gold: ${context.gold}`)
  if (context.recentEvents?.length) {
    parts.push(`Recent: ${context.recentEvents.slice(-3).join('; ')}`)
  }

  parts.push('')
  parts.push(request)

  return parts.join('\n')
}

let ollamaAvailable: boolean | null = null
let lastCheck = 0

async function checkOllama(): Promise<boolean> {
  const now = Date.now()
  // Cache the check for 30 seconds
  if (ollamaAvailable !== null && now - lastCheck < 30000) {
    return ollamaAvailable
  }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch('http://localhost:11434/api/tags', { signal: controller.signal })
    clearTimeout(timeout)
    ollamaAvailable = res.ok
    lastCheck = now
    return ollamaAvailable
  } catch {
    ollamaAvailable = false
    lastCheck = now
    return false
  }
}

async function generateWithOllama(prompt: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT)

    const res = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.8,
          top_p: 0.9,
          num_predict: 150,
        },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) return null

    const data = await res.json()
    return data.response?.trim() || null
  } catch {
    return null
  }
}

// ============================================
// FALLBACK CONTENT
// ============================================

const FALLBACK_NPC_RESPONSES: Record<string, string[]> = {
  default: [
    'The stranger eyes you warily. "Not much to say to a traveler I don\'t know."',
    '"Gold Country has a way of testing people. We\'ll see what it makes of you."',
    '"Been quiet around here lately. Too quiet, some might say."',
  ],
  friendly: [
    '"Well met, friend! Pull up a chair and rest your bones."',
    '"Always good to see a fresh face in these parts. What brings you through?"',
    '"You look like someone who knows which end of a pickaxe to hold."',
  ],
  hostile: [
    '"State your business or move along. We don\'t cotton to strangers."',
    '"Last person who asked too many questions ended up at the bottom of the creek."',
    '"I\'ve got nothing to say to the likes of you."',
  ],
  mysterious: [
    '"Some things in these hills are better left undiscovered... but not by you, perhaps."',
    '"The old-timers tell stories about this place. Most folk don\'t listen. That\'s their mistake."',
    '"I\'ve seen things in the mines that don\'t have names. Be careful where you dig."',
  ],
}

const FALLBACK_ENCOUNTERS: string[] = [
  'The trail narrows as it winds through a stand of ancient oaks. Acorns crunch underfoot.',
  'A red-tailed hawk circles overhead, riding the thermals off the Sierra foothills.',
  'You pass a rusted sluice box abandoned by the creekside. Gold fever came and went here.',
  'The smell of pine pitch fills the air. Somewhere nearby, a woodpecker hammers relentlessly.',
  'A weathered sign points in two directions. Both arrows have been shot through with bullet holes.',
  'The creek runs clear and cold over smooth stones. A trout flashes silver in the shallows.',
  'You spot bootprints in the mud — fresh ones, heading the same direction you\'re going.',
  'An abandoned campfire still smolders. Whoever was here left in a hurry.',
  'Wild mustard blooms yellow across the hillside. The old miners called it "gold" as a joke.',
  'A coyote watches from a rocky outcrop, then vanishes like smoke.',
]

const FALLBACK_SKILL_NARRATION: Record<string, { success: string[]; failure: string[] }> = {
  Agility: {
    success: [
      'Quick as a rattlesnake, you react just in time.',
      'Your reflexes serve you well — frontier life has made you fast.',
    ],
    failure: [
      'Too slow. The frontier doesn\'t wait for the unprepared.',
      'You stumble at the crucial moment. Practice makes perfect.',
    ],
  },
  Diplomacy: {
    success: [
      'Your words find their mark. Even the suspicious seem willing to listen.',
      'A silver tongue is worth more than silver in these parts.',
    ],
    failure: [
      'Your words fall flat. Some folks can\'t be talked around.',
      'You misjudge the situation. Best to let tempers cool.',
    ],
  },
  Shrewdness: {
    success: [
      'Your keen eye catches what others miss. Nothing gets past you.',
      'The pieces click into place. You see the truth beneath the surface.',
    ],
    failure: [
      'The clues don\'t add up — not yet. Keep looking.',
      'You were so sure, but the truth slips away like creek water.',
    ],
  },
  Durability: {
    success: [
      'You grit your teeth and push through. The frontier forges iron will.',
      'Pain is temporary. You\'ve endured worse on the trail.',
    ],
    failure: [
      'Your body protests. Even the toughest have limits.',
      'The strain is too much this time. Rest and try again.',
    ],
  },
  Expertise: {
    success: [
      'Your knowledge of the land pays dividends once again.',
      'Experience is the best teacher, and you\'ve been a good student.',
    ],
    failure: [
      'Book learning only goes so far out here. This requires hands-on experience.',
      'You thought you knew, but the frontier has more lessons to teach.',
    ],
  },
  Luck: {
    success: [
      'Fortune favors you today. Don\'t push it.',
      'Lady Luck smiles. The creek gives up its secrets.',
    ],
    failure: [
      'Not your lucky day. The creek keeps its gold hidden.',
      'Fortune is fickle in Gold Country. She\'ll come around again.',
    ],
  },
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ============================================
// PUBLIC API
// ============================================

export const AIDM = {
  /**
   * Generate an NPC response (dynamic with AI, or fallback)
   */
  async npcResponse(
    context: DMContext,
    npcName: string,
    npcRole: string,
    playerSaid: string,
    mood: 'friendly' | 'hostile' | 'mysterious' | 'default' = 'default',
  ): Promise<DMResponse> {
    const available = await checkOllama()

    if (available) {
      const prompt = buildPrompt(
        context,
        `${npcName} (${npcRole}) responds to the player who said: "${playerSaid}"\nMood: ${mood}\nWrite ${npcName}'s response in first person, 2-3 sentences:`
      )
      const text = await generateWithOllama(prompt)
      if (text) return { text, source: 'ai' }
    }

    // Fallback
    const pool = FALLBACK_NPC_RESPONSES[mood] ?? FALLBACK_NPC_RESPONSES.default
    return { text: pickRandom(pool), source: 'fallback' }
  },

  /**
   * Generate a travel/encounter description
   */
  async encounterDescription(
    context: DMContext,
    encounterName: string,
    encounterDesc: string,
  ): Promise<DMResponse> {
    const available = await checkOllama()

    if (available) {
      const prompt = buildPrompt(
        context,
        `Describe this encounter vividly in 2-3 sentences:\nEncounter: ${encounterName}\nSituation: ${encounterDesc}`
      )
      const text = await generateWithOllama(prompt)
      if (text) return { text, source: 'ai' }
    }

    return { text: encounterDesc, source: 'fallback' }
  },

  /**
   * Generate skill check narration
   */
  async skillCheckNarration(
    context: DMContext,
    stat: StatName,
    success: boolean,
    margin: number,
  ): Promise<DMResponse> {
    const available = await checkOllama()

    if (available) {
      const prompt = buildPrompt(
        context,
        `Narrate a ${stat} check that ${success ? 'succeeded' : 'failed'} by ${Math.abs(margin)}.\n${success ? 'Describe the success' : 'Describe the failure'} in 1-2 vivid sentences:`
      )
      const text = await generateWithOllama(prompt)
      if (text) return { text, source: 'ai' }
    }

    // Fallback
    const pool = FALLBACK_SKILL_NARRATION[stat] ?? FALLBACK_SKILL_NARRATION.Expertise
    const texts = success ? pool.success : pool.failure
    return { text: pickRandom(texts), source: 'fallback' }
  },

  /**
   * Generate a random atmospheric description for a location
   */
  async locationAtmosphere(
    context: DMContext,
    locationName: string,
    atmosphere: string,
  ): Promise<DMResponse> {
    const available = await checkOllama()

    if (available) {
      const prompt = buildPrompt(
        context,
        `Describe the atmosphere of ${locationName} (mood: ${atmosphere}) as the player arrives. 2 sentences max, evocative and period-appropriate:`
      )
      const text = await generateWithOllama(prompt)
      if (text) return { text, source: 'ai' }
    }

    return { text: pickRandom(FALLBACK_ENCOUNTERS), source: 'fallback' }
  },

  /**
   * Check if Ollama is available
   */
  async isAvailable(): Promise<boolean> {
    return checkOllama()
  },
}

export default AIDM
