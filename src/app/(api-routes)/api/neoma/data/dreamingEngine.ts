/**
 * Dreaming Engine — Dialogue Tree Traversal
 *
 * Selects topics, resolves karma/progress variants, filters choices,
 * and advances state through the pre-written dialogue trees.
 * No LLM required — runs purely on authored content.
 */

import {
  ALL_DREAM_TOPICS,
  type DreamTopic,
  type DreamDialogueNode,
  type DreamChoice,
  type GameProgress,
  type KarmaTendency,
} from './dialogueTrees'

// ===================== DREAMING STATE =====================

export interface DreamingState {
  activeTopic: string | null
  activeNodeId: string | null
  visitedTopics: string[]
  visitCount: number
  conversationDepth: number
}

export function createDreamingState(): DreamingState {
  return {
    activeTopic: null,
    activeNodeId: null,
    visitedTopics: [],
    visitCount: 0,
    conversationDepth: 0,
  }
}

// ===================== TOPIC SELECTION =====================

function weightedRandom(topics: { topic: DreamTopic; weight: number }[]): DreamTopic {
  const total = topics.reduce((sum, t) => sum + t.weight, 0)
  let roll = Math.random() * total
  for (const entry of topics) {
    roll -= entry.weight
    if (roll <= 0) return entry.topic
  }
  return topics[topics.length - 1].topic
}

function selectTopic(
  state: DreamingState,
  progress: GameProgress | null,
  karma: KarmaTendency | null,
): DreamTopic {
  const eligible = ALL_DREAM_TOPICS.filter(topic => {
    // Check visit requirement
    if (topic.requiredVisits && state.visitCount < topic.requiredVisits) return false
    return true
  })

  if (eligible.length === 0) return ALL_DREAM_TOPICS[0]

  // Weight adjustments: prefer unvisited topics, boost karma-matching topics
  const weighted = eligible.map(topic => {
    let weight = topic.weight

    // Unvisited topics get a boost
    if (!state.visitedTopics.includes(topic.id)) {
      weight *= 1.5
    }

    // Karma affinity boost
    if (karma && topic.karmaAffinity === karma) {
      weight *= 1.3
    }

    // Slight reduction for recently visited
    const recentIdx = state.visitedTopics.lastIndexOf(topic.id)
    if (recentIdx >= 0 && recentIdx >= state.visitedTopics.length - 2) {
      weight *= 0.4
    }

    return { topic, weight }
  })

  return weightedRandom(weighted)
}

// ===================== NODE RESOLUTION =====================

function resolveNodeText(
  node: DreamDialogueNode,
  progress: GameProgress | null,
  karma: KarmaTendency | null,
): string {
  // Check progress variants first (more specific)
  if (node.progressVariants && progress) {
    for (const variant of node.progressVariants) {
      const cond = variant.condition
      if (cond.minChapter && progress.chapter < cond.minChapter) continue
      if (cond.hasAlly && !progress.hasAllies) continue
      return variant.text
    }
  }

  // Check karma variants
  if (node.karmaVariants && karma && karma in node.karmaVariants) {
    return node.karmaVariants[karma] ?? node.text
  }

  return node.text
}

function filterChoices(
  choices: DreamChoice[],
  progress: GameProgress | null,
  karma: KarmaTendency | null,
): DreamChoice[] {
  return choices.filter(choice => {
    // Chapter gate
    if (choice.minChapter && progress && progress.chapter < choice.minChapter) return false

    // Karma gate — only show if player matches (or if 'any')
    if (choice.karmaGate && choice.karmaGate !== 'any' && karma && choice.karmaGate !== karma) return false

    // Random chance gate
    if (choice.showChance !== undefined && Math.random() > choice.showChance) return false

    return true
  })
}

// ===================== ENGINE API =====================

export interface DreamResponse {
  text: string
  choices: { id: string; text: string; tone?: string }[]
  isTerminal: boolean
  topicTitle: string
  nodeTag?: string
}

/**
 * Start a new dreaming conversation — pick a topic and return the root node.
 */
export function startDreamConversation(
  state: DreamingState,
  progress: GameProgress | null,
  karma: KarmaTendency | null,
): { response: DreamResponse; state: DreamingState } {
  const topic = selectTopic(state, progress, karma)
  const rootNode = topic.nodes[topic.rootNodeId]

  if (!rootNode) {
    return {
      response: {
        text: "The dream shifts... but the shapes dissolve before I can name them.",
        choices: [],
        isTerminal: true,
        topicTitle: 'Lost Dream',
      },
      state,
    }
  }

  const text = resolveNodeText(rootNode, progress, karma)
  const choices = rootNode.choices ? filterChoices(rootNode.choices, progress, karma) : []

  const newState: DreamingState = {
    ...state,
    activeTopic: topic.id,
    activeNodeId: rootNode.id,
    visitedTopics: [...state.visitedTopics, topic.id],
    visitCount: state.visitCount + 1,
    conversationDepth: 0,
  }

  return {
    response: {
      text,
      choices: choices.map(c => ({ id: c.id, text: c.text, tone: c.tone })),
      isTerminal: !!rootNode.isTerminal || choices.length === 0,
      topicTitle: topic.title,
      nodeTag: rootNode.tag,
    },
    state: newState,
  }
}

/**
 * Advance the conversation by selecting a choice.
 * Returns the next node's response and updated state.
 */
export function advanceDreamConversation(
  state: DreamingState,
  choiceId: string,
  progress: GameProgress | null,
  karma: KarmaTendency | null,
): { response: DreamResponse; state: DreamingState } | null {
  if (!state.activeTopic || !state.activeNodeId) return null

  const topic = ALL_DREAM_TOPICS.find(t => t.id === state.activeTopic)
  if (!topic) return null

  const currentNode = topic.nodes[state.activeNodeId]
  if (!currentNode?.choices) return null

  // Find the chosen option
  const choice = currentNode.choices.find(c => c.id === choiceId)
  if (!choice) return null

  const nextNode = topic.nodes[choice.nextNodeId]
  if (!nextNode) return null

  const text = resolveNodeText(nextNode, progress, karma)
  const choices = nextNode.choices ? filterChoices(nextNode.choices, progress, karma) : []

  const newState: DreamingState = {
    ...state,
    activeNodeId: nextNode.id,
    conversationDepth: state.conversationDepth + 1,
  }

  return {
    response: {
      text,
      choices: choices.map(c => ({ id: c.id, text: c.text, tone: c.tone })),
      isTerminal: !!nextNode.isTerminal || choices.length === 0,
      topicTitle: topic.title,
      nodeTag: nextNode.tag,
    },
    state: newState,
  }
}

/**
 * Assess karma from a dreaming session purely by choice tone patterns.
 * No LLM needed — uses the tone metadata on choices the player selected.
 */
export function assessDreamKarma(tones: string[]): number {
  if (tones.length === 0) return 3

  const weights: Record<string, number> = {
    empathetic: 5,
    curious: 4,
    philosophical: 4,
    playful: 3,
    challenging: 2,
  }

  const total = tones.reduce((sum, t) => sum + (weights[t] ?? 3), 0)
  return Math.min(5, Math.max(1, Math.round(total / tones.length)))
}
