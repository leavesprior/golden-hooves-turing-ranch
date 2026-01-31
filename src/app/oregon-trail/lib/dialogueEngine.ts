/**
 * BOBR Dialogue Engine
 *
 * Builds prompts for Ollama NPC conversations and extracts clues from responses.
 * Handles the bridge between game state and LLM generation.
 */

import type { NPCPersonality } from '../data/npcPersonalities'
import type { OutlawTraits } from '../data/outlaws'
import type { ConversationTurn } from '@/lib/ollama/types'

// Clue extraction result
export interface ExtractedClue {
  trait: keyof OutlawTraits
  value: string
  confidence: number // 0-1
  matchedText: string
}

// Trait keywords for clue extraction
const TRAIT_KEYWORDS: Record<keyof OutlawTraits, string[]> = {
  horse: ['horse', 'mare', 'stallion', 'mount', 'steed', 'pony', 'rode', 'riding'],
  hat: ['hat', 'stetson', 'bowler', 'sombrero', 'cap', 'head', 'wore on head'],
  weapon: ['gun', 'pistol', 'colt', 'winchester', 'rifle', 'knife', 'dynamite', 'weapon', 'armed'],
  vice: ['drink', 'whiskey', 'bourbon', 'smoke', 'cigar', 'cigarette', 'gambl', 'cards', 'poker', 'poetry', 'verse'],
  accent: ['spoke', 'talk', 'voice', 'accent', 'sound', 'drawl', 'twang'],
  build: ['tall', 'short', 'thin', 'skinny', 'stocky', 'heavy', 'big', 'small', 'built', 'large', 'slight'],
  mark: ['scar', 'missing', 'limp', 'tattoo', 'eye', 'tooth', 'finger', 'patch', 'walk', 'gold tooth'],
}

// Trait value mappings for extraction
const TRAIT_VALUES: Record<keyof OutlawTraits, Record<string, string>> = {
  horse: {
    'black': 'black',
    'white': 'white',
    'pinto': 'pinto',
    'spotted': 'pinto',
    'palomino': 'palomino',
    'golden': 'palomino',
    'cream': 'palomino',
  },
  hat: {
    'stetson': 'stetson',
    'cowboy': 'stetson',
    'bowler': 'bowler',
    'derby': 'bowler',
    'sombrero': 'sombrero',
    'mexican hat': 'sombrero',
    'wide brim': 'sombrero',
    'no hat': 'none',
    'bare head': 'none',
    'hatless': 'none',
  },
  weapon: {
    'colt': 'colt',
    'revolver': 'colt',
    'six-shooter': 'colt',
    'pistol': 'colt',
    'winchester': 'winchester',
    'rifle': 'winchester',
    'long gun': 'winchester',
    'knife': 'knife',
    'blade': 'knife',
    'bowie': 'knife',
    'dynamite': 'dynamite',
    'explosive': 'dynamite',
    'tnt': 'dynamite',
  },
  vice: {
    'whiskey': 'whiskey',
    'whisky': 'whiskey',
    'bourbon': 'whiskey',
    'drink': 'whiskey',
    'liquor': 'whiskey',
    'cigar': 'cigars',
    'smoke': 'cigars',
    'tobacco': 'cigars',
    'gambl': 'gambling',
    'cards': 'gambling',
    'poker': 'gambling',
    'bet': 'gambling',
    'poetry': 'poetry',
    'verse': 'poetry',
    'rhyme': 'poetry',
    'recite': 'poetry',
  },
  accent: {
    'southern': 'southern',
    'dixie': 'southern',
    'drawl': 'southern',
    'eastern': 'eastern',
    'yankee': 'eastern',
    'city': 'eastern',
    'mexican': 'mexican',
    'spanish': 'mexican',
    'irish': 'irish',
    'brogue': 'irish',
  },
  build: {
    'thin': 'thin',
    'skinny': 'thin',
    'slight': 'thin',
    'wiry': 'thin',
    'average': 'average',
    'normal': 'average',
    'medium': 'average',
    'stocky': 'stocky',
    'heavy': 'stocky',
    'thick': 'stocky',
    'muscular': 'stocky',
    'tall': 'tall',
    'lanky': 'tall',
    'long': 'tall',
  },
  mark: {
    'scar': 'scar_cheek',
    'scarred': 'scar_cheek',
    'missing finger': 'missing_finger',
    'finger gone': 'missing_finger',
    'four finger': 'missing_finger',
    'gold tooth': 'gold_tooth',
    'golden tooth': 'gold_tooth',
    'shiny tooth': 'gold_tooth',
    'tattoo': 'tattoo_arm',
    'ink': 'tattoo_arm',
    'marked arm': 'tattoo_arm',
    'limp': 'limp',
    'walk funny': 'limp',
    'leg': 'limp',
    'eyepatch': 'eyepatch',
    'one eye': 'eyepatch',
    'patch': 'eyepatch',
    'no mark': 'none',
    'nothing unusual': 'none',
  },
}

/**
 * Build the full system prompt for NPC dialogue
 */
export function buildSystemPrompt(
  personality: NPCPersonality,
  location: string,
  availableClue?: { trait: keyof OutlawTraits; value: string },
  gameContext?: {
    narratorMood?: string
    characterDiplomacy?: number
    trustLevel?: number
    visitNumber?: number
  }
): string {
  let prompt = `You are ${personality.name} in ${location} during the California Gold Rush (1850s).

CHARACTER BACKGROUND:
${personality.archetype}

PERSONALITY TRAITS: ${personality.coreTraits.join(', ')}

HOW YOU SPEAK:
- Speech patterns to use: ${personality.speechPatterns.join(' | ')}
- Your quirks: ${personality.quirks.join('; ')}
- Your expertise: ${personality.knowledgeAreas.join(', ')}

${personality.systemPromptAdditions}

CONVERSATION RULES:
1. Stay in character at all times
2. Keep responses to 1-3 sentences unless asked for details
3. Never break the fourth wall or mention being an AI
4. If asked something you don't know, respond in character
5. Match your temperament: ${personality.temperament}`

  // Add clue information if available
  if (availableClue) {
    prompt += `

IMPORTANT WITNESS INFORMATION:
You saw the outlaw who committed a crime. You know this specific detail:
- Their ${availableClue.trait} was "${availableClue.value}"
- Work this information naturally into conversation when asked relevant questions
- Don't volunteer it unprompted - make them ask the right questions
- You can hint at knowing something without immediately revealing it`
  }

  // Add game context modifiers
  if (gameContext) {
    if (gameContext.narratorMood) {
      prompt += `\n\nCURRENT ATMOSPHERE: The overall mood is ${gameContext.narratorMood}. Let this subtly influence your tone.`
    }

    if (gameContext.visitNumber && gameContext.visitNumber > 1) {
      prompt += `\n\nRECOGNITION: You've spoken with this person ${gameContext.visitNumber - 1} time(s) before. Acknowledge the familiarity appropriately.`
    }

    if (gameContext.characterDiplomacy !== undefined) {
      if (gameContext.characterDiplomacy >= 15) {
        prompt += `\n\nPLAYER CHARISMA: This person is exceptionally charming. You find yourself more willing to share.`
      } else if (gameContext.characterDiplomacy <= 5) {
        prompt += `\n\nPLAYER CHARISMA: This person is somewhat off-putting. Be more guarded.`
      }
    }

    if (gameContext.trustLevel !== undefined) {
      if (gameContext.trustLevel >= 8) {
        prompt += `\n\nTRUST LEVEL: You trust this person. Speak more openly.`
      } else if (gameContext.trustLevel <= 2) {
        prompt += `\n\nTRUST LEVEL: You don't trust this person. Be evasive.`
      }
    }
  }

  return prompt
}

/**
 * Build conversation prompt with history
 */
export function buildConversationPrompt(
  playerMessage: string,
  history: ConversationTurn[],
  maxTurns: number = 6,
  npcName: string = 'NPC'
): string {
  const recentHistory = history.slice(-maxTurns)
  const tag = getPersonalityTag(npcName)

  if (recentHistory.length === 0) {
    return `Player: ${playerMessage}\n${tag}:`
  }

  const historyText = recentHistory
    .map(turn => `${turn.speaker === 'player' ? 'Player' : tag}: ${turn.text}`)
    .join('\n')

  return `${historyText}\nPlayer: ${playerMessage}\n${tag}:`
}

// Get tag for NPC responses
function getPersonalityTag(npcName: string = 'NPC'): string {
  return npcName
}

/**
 * Extract clues from NPC response text
 */
export function extractCluesFromResponse(
  response: string,
  availableClue?: { trait: keyof OutlawTraits; value: string }
): ExtractedClue[] {
  const clues: ExtractedClue[] = []
  const responseLower = response.toLowerCase()

  // If we have a specific clue to look for, check that first
  if (availableClue) {
    const { trait, value } = availableClue
    const valueLower = value.toLowerCase()

    // Direct mention of the value
    if (responseLower.includes(valueLower)) {
      clues.push({
        trait,
        value,
        confidence: 0.95,
        matchedText: response,
      })
      return clues // Found the intended clue
    }

    // Check for trait keywords + value
    const traitKeywords = TRAIT_KEYWORDS[trait] || []
    const mentionsTrait = traitKeywords.some(kw => responseLower.includes(kw))

    if (mentionsTrait) {
      // Check for any value mention for this trait
      const valueMap = TRAIT_VALUES[trait] || {}
      for (const [pattern, mappedValue] of Object.entries(valueMap)) {
        if (responseLower.includes(pattern) && mappedValue === value) {
          clues.push({
            trait,
            value,
            confidence: 0.85,
            matchedText: response,
          })
          return clues
        }
      }
    }
  }

  // General clue extraction (scan for any trait mentions)
  for (const [trait, keywords] of Object.entries(TRAIT_KEYWORDS)) {
    const traitKey = trait as keyof OutlawTraits
    const mentionsTrait = keywords.some(kw => responseLower.includes(kw))

    if (mentionsTrait) {
      const valueMap = TRAIT_VALUES[traitKey] || {}
      for (const [pattern, mappedValue] of Object.entries(valueMap)) {
        if (responseLower.includes(pattern)) {
          // Avoid duplicates
          if (!clues.some(c => c.trait === traitKey && c.value === mappedValue)) {
            clues.push({
              trait: traitKey,
              value: mappedValue,
              confidence: 0.6, // Lower confidence for unprompted extraction
              matchedText: response,
            })
          }
        }
      }
    }
  }

  return clues
}

/**
 * Calculate response quality based on player stats and NPC temperament
 */
export function calculateResponseQuality(
  playerStats: { diplomacy: number; shrewdness: number; luck: number },
  personality: NPCPersonality,
  trustLevel: number
): {
  willRevealClue: boolean
  informationQuality: 'full' | 'partial' | 'misleading'
  moodChange?: string
} {
  const baseChance = personality.openness
  const diplomacyBonus = (playerStats.diplomacy - 10) * 0.03
  const trustBonus = (trustLevel - 5) * 0.05
  const luckBonus = (playerStats.luck - 10) * 0.02

  const revealChance = Math.min(0.95, Math.max(0.1, baseChance + diplomacyBonus + trustBonus + luckBonus))

  const willRevealClue = Math.random() < revealChance

  // Information quality based on reliability
  let informationQuality: 'full' | 'partial' | 'misleading' = 'full'
  const reliabilityRoll = Math.random()

  if (reliabilityRoll > personality.reliability) {
    informationQuality = reliabilityRoll > 0.9 ? 'misleading' : 'partial'
  }

  // Mood change based on interaction
  let moodChange: string | undefined
  if (playerStats.diplomacy >= 15) {
    moodChange = 'friendly'
  } else if (playerStats.diplomacy <= 5 && personality.temperament !== 'friendly') {
    moodChange = 'annoyed'
  }

  return { willRevealClue, informationQuality, moodChange }
}

/**
 * Generate example exchanges for few-shot prompting
 */
export function buildFewShotExamples(personality: NPCPersonality): string {
  if (personality.exampleExchanges.length === 0) return ''

  const examples = personality.exampleExchanges
    .slice(0, 2)
    .map(ex => `Player: ${ex.player}\nNPC: ${ex.npc}`)
    .join('\n\n')

  return `\nEXAMPLE EXCHANGES (for tone reference):\n${examples}`
}

/**
 * Clean and validate NPC response
 */
export function cleanNPCResponse(response: string): string {
  return response
    // Remove incomplete sentences at end
    .replace(/[^.!?*"')\]]+$/, '')
    // Remove meta-text
    .replace(/^\[.*?\]\s*/g, '')
    .replace(/\*thinks\*/gi, '')
    .replace(/\*pauses briefly\*/gi, '')
    // Clean excessive punctuation
    .replace(/\.{4,}/g, '...')
    .replace(/!{3,}/g, '!!')
    .replace(/\?{3,}/g, '??')
    // Remove any "NPC:" or "Bartender:" prefixes
    .replace(/^[A-Za-z\s]+:\s*/g, '')
    .trim()
}

/**
 * Check if response seems off-character or broken
 */
export function validateResponse(response: string, personality: NPCPersonality): boolean {
  // Too short
  if (response.length < 10) return false

  // Contains modern terms
  const modernTerms = ['computer', 'internet', 'phone', 'email', 'AI', 'artificial intelligence']
  if (modernTerms.some(term => response.toLowerCase().includes(term))) return false

  // Contains meta-references
  const metaTerms = ['as an AI', 'I cannot', 'I am not able', 'language model', 'assistant']
  if (metaTerms.some(term => response.toLowerCase().includes(term))) return false

  return true
}
