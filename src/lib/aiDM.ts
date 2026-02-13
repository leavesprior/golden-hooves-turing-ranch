/**
 * AI Dungeon Master - Ollama Integration for BOBR Adventure
 *
 * Generates dynamic NPC responses, encounter descriptions, and skill check narration
 * using a local Ollama instance. Falls back to pre-written content when unavailable.
 */

import type { StatName } from '@/app/oregon-trail/characterContext'
import type { FactionId } from '@/app/oregon-trail/reputationContext'
import type { AlignmentPosition } from '@/lib/karmaStorage'

// Use the Next.js API route which handles Ollama -> OpenRouter fallback
// and works both locally and in production (browser can't reach localhost:11434 directly)
const LLM_API = '/api/llm/generate'

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

SETTING: Sierra Nevada foothills — Placerville (Hangtown), Coloma, Nevada City, Volcano, Angels Camp, Murphys, Jackson, West Point, Columbia, Sonora, Chinese Camp, and the Back of Beyond Ranch area.

TONE: Gritty but warm. Think Deadwood meets Oregon Trail. Characters are complex — miners desperate, merchants shrewd, Indigenous peoples displaced, Chinese immigrants persecuted, women resourceful. Nobody is purely good or evil.

HISTORICAL ACCURACY: Reference real Gold Rush history — James Marshall's discovery at Sutter's Mill (1848), Black Bart the poet-bandit, Mark Twain's jumping frog contest at Angels Camp, Joaquin Murieta, Kit Carson, Bret Harte, the Chinese Exclusion era, hydraulic mining devastation.

RULES:
- Keep responses to 2-3 sentences max. Be vivid but concise.
- Write in present tense when describing scenes.
- NPCs speak in character with period-appropriate dialect.
- Never break character or mention game mechanics.
- Include sensory details (sounds, smells, weather).
- End NPC dialogue with a hook or question to keep conversation flowing.
- React to player alignment subtly (lawful characters get more trust, chaotic ones get suspicion).`

function buildPrompt(context: DMContext, request: string): string {
  const parts: string[] = []

  if (context.playerName) parts.push(`Player: ${context.playerName}`)
  if (context.alignment) {
    const align = context.alignment.replace(/_/g, ' ')
    parts.push(`Alignment: ${align}`)
  }
  if (context.currentLocation) parts.push(`Location: ${context.currentLocation}`)
  if (context.currentChapter) parts.push(`Chapter: ${context.currentChapter}/5`)
  if (context.level) parts.push(`Level: ${context.level}`)
  if (context.gold !== undefined) parts.push(`Gold: ${context.gold}`)
  if (context.factionReps) {
    const reps = Object.entries(context.factionReps)
      .filter(([, v]) => v !== undefined && v !== 0)
      .map(([k, v]) => `${k}: ${v! > 0 ? '+' : ''}${v}`)
    if (reps.length) parts.push(`Reputation: ${reps.join(', ')}`)
  }
  if (context.activeQuests?.length) {
    parts.push(`Active quests: ${context.activeQuests.slice(0, 2).join('; ')}`)
  }
  if (context.recentEvents?.length) {
    parts.push(`Recent: ${context.recentEvents.slice(-3).join('; ')}`)
  }

  parts.push('')
  parts.push(request)

  return parts.join('\n')
}

let llmAvailable: boolean | null = null
let lastCheck = 0

async function checkLLM(): Promise<boolean> {
  const now = Date.now()
  // Cache the check for 30 seconds
  if (llmAvailable !== null && now - lastCheck < 30000) {
    return llmAvailable
  }
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch('/api/llm/health', { signal: controller.signal })
    clearTimeout(timeout)
    if (res.ok) {
      const data = await res.json()
      llmAvailable = data.available === true
    } else {
      llmAvailable = false
    }
    lastCheck = now
    return llmAvailable
  } catch {
    llmAvailable = false
    lastCheck = now
    return false
  }
}

async function generateWithLLM(prompt: string, system?: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    const res = await fetch(LLM_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        system: system || SYSTEM_PROMPT,
        temperature: 0.8,
        maxTokens: 200,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) return null

    const data = await res.json()
    if (data.provider === 'none' || !data.response) return null
    return data.response.trim()
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
    const available = await checkLLM()

    if (available) {
      const prompt = buildPrompt(
        context,
        `${npcName} (${npcRole}) responds to the player who said: "${playerSaid}"\nMood: ${mood}\nWrite ${npcName}'s response in first person, 2-3 sentences:`
      )
      const text = await generateWithLLM(prompt)
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
    const available = await checkLLM()

    if (available) {
      const prompt = buildPrompt(
        context,
        `Describe this encounter vividly in 2-3 sentences:\nEncounter: ${encounterName}\nSituation: ${encounterDesc}`
      )
      const text = await generateWithLLM(prompt)
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
    const available = await checkLLM()

    if (available) {
      const prompt = buildPrompt(
        context,
        `Narrate a ${stat} check that ${success ? 'succeeded' : 'failed'} by ${Math.abs(margin)}.\n${success ? 'Describe the success' : 'Describe the failure'} in 1-2 vivid sentences:`
      )
      const text = await generateWithLLM(prompt)
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
    const available = await checkLLM()

    if (available) {
      const prompt = buildPrompt(
        context,
        `Describe the atmosphere of ${locationName} (mood: ${atmosphere}) as the player arrives. 2 sentences max, evocative and period-appropriate:`
      )
      const text = await generateWithLLM(prompt)
      if (text) return { text, source: 'ai' }
    }

    return { text: pickRandom(FALLBACK_ENCOUNTERS), source: 'fallback' }
  },

  /**
   * Check if Ollama is available
   */
  async isAvailable(): Promise<boolean> {
    return checkLLM()
  },
}

export default AIDM
