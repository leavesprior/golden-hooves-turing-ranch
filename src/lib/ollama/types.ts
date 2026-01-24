/**
 * BOBR Ollama Integration Types
 *
 * TypeScript interfaces for Ollama API interaction
 * enabling dynamic NPC dialogue with local LLM.
 */

// Ollama API request/response types
export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  context?: number[];
  options?: OllamaOptions;
}

export interface OllamaOptions {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  num_predict?: number;
  stop?: string[];
  repeat_penalty?: number;
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface OllamaStreamChunk {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export interface OllamaModelInfo {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaTagsResponse {
  models: OllamaModelInfo[];
}

// Witness types (must match oregon-trail/data/clueTemplates.ts)
export type WitnessType =
  | 'bartender'
  | 'shopkeeper'
  | 'stable_hand'
  | 'traveler'
  | 'settler'
  | 'native_trader'
  | 'telegraph_operator'
  | 'sheriff_deputy'
  | 'prostitute'
  | 'preacher'
  | 'drunk'
  | 'child';

// NPC personality system types
export type WitnessArchetype =
  | 'pessimistic_bartender'
  | 'nervous_shopkeeper'
  | 'grizzled_stable_hand'
  | 'weary_traveler'
  | 'suspicious_settler'
  | 'cryptic_native_trader'
  | 'officious_telegraph_operator'
  | 'cynical_deputy'
  | 'jaded_saloon_girl'
  | 'fire_and_brimstone_preacher'
  | 'rambling_drunk'
  | 'observant_child';

export interface NPCPersonality {
  witnessType: WitnessType;
  archetype: string;
  name: string;
  description: string;
  coreTraits: string[];
  speechPatterns: string[];
  quirks: string[];
  knowledgeAreas: string[];
  openness: number; // 0-1 willingness to share info
  reliability: number; // 0-1 accuracy of information
  temperament: 'friendly' | 'neutral' | 'suspicious' | 'hostile';
  exampleExchanges: Array<{
    player: string;
    npc: string;
  }>;
  systemPromptAdditions: string;
}

// Conversation state types
export interface ConversationTurn {
  id: string;
  speaker: 'player' | 'npc';
  text: string;
  timestamp: number;
  clueRevealed?: string;
  moodShift?: string;
}

export interface NPCConversationState {
  npcId: string;
  witnessType: string;
  location: string;
  personality: NPCPersonality;
  turns: ConversationTurn[];
  mood: NPCMood;
  trustLevel: number; // 0-10 how much NPC trusts player
  cluesRevealed: string[];
  ollamaContext?: number[]; // For context continuity
  lastUpdated: number;
}

export type NPCMood =
  | 'neutral'
  | 'friendly'
  | 'suspicious'
  | 'annoyed'
  | 'frightened'
  | 'amused'
  | 'drunk'
  | 'distracted';

// Dialogue generation types
export interface DialogueRequest {
  witnessType: string;
  location: string;
  playerMessage: string;
  conversationHistory: ConversationTurn[];
  personality: NPCPersonality;
  availableClues: string[];
  narratorMood?: string;
  characterStats?: {
    diplomacy: number;
    shrewdness: number;
    luck: number;
  };
}

export interface DialogueResponse {
  npcResponse: string;
  moodChange?: NPCMood;
  clueRevealed?: string;
  trustChange?: number;
  narratorComment?: string;
}

// Clue extraction types
export interface ExtractedClue {
  type: 'identity' | 'location' | 'time' | 'method';
  traitKey?: string; // e.g., 'horse', 'hat', 'weapon'
  traitValue?: string; // e.g., 'black', 'stetson', 'colt'
  rawText: string;
  confidence: number; // 0-1
}

// Service status types
export interface OllamaServiceStatus {
  available: boolean;
  model: string | null;
  lastChecked: number;
  error?: string;
}

// Preferred models in order of preference
export const PREFERRED_MODELS = [
  'llama3.2',
  'llama3.1',
  'llama3',
  'mistral',
  'gemma2',
  'phi3',
] as const;

export type PreferredModel = typeof PREFERRED_MODELS[number];
