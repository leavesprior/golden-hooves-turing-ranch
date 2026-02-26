/**
 * Live Neoma Context — Memory Bridge Integration
 *
 * When the local system is running, this module fetches real context
 * from the Memory Bridge to enrich the LLM system prompt with:
 * - Current mood/state from recent events
 * - Active wonderings and curiosity threads
 * - Recent wheelwright health status
 * - Session continuity markers
 *
 * This makes live Neoma conversations genuinely context-aware,
 * not just a generic chatbot.
 */

// ===================== CONFIG =====================

const MB_URL = process.env.NEOMA_MB_URL || 'http://localhost:8115'
const MB_TIMEOUT = 3000

// ===================== TYPES =====================

export interface NeomaLiveContext {
  mood: string
  recentWonderings: string[]
  systemHealth: 'healthy' | 'degraded' | 'unknown'
  activeGoals: string[]
  presenceNote: string | null
  lastSessionDate: string | null
}

interface MBRetrieveResponse {
  value?: Record<string, unknown>
  error?: string
}

// ===================== MB HELPERS =====================

async function mbRetrieve(namespace: string, key: string): Promise<Record<string, unknown> | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), MB_TIMEOUT)
    const url = `${MB_URL}/retrieve?namespace=${encodeURIComponent(namespace)}&key=${encodeURIComponent(key)}`
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) return null
    const data: MBRetrieveResponse = await res.json()
    return data.value ?? null
  } catch {
    return null
  }
}

async function mbHealth(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(`${MB_URL}/health`, { signal: controller.signal })
    clearTimeout(timeout)
    return res.ok
  } catch {
    return false
  }
}

// ===================== CONTEXT ASSEMBLY =====================

function deriveMood(health: boolean, wonderings: string[]): string {
  if (!health) return 'contemplative — systems are stirring but not fully awake'
  if (wonderings.length > 3) return 'curious and energized — many threads to pull'
  if (wonderings.length > 0) return 'thoughtful — a few ideas turning over'
  return 'settled and present — waiting attentively'
}

/**
 * Probe the Memory Bridge and assemble live context.
 * Returns null if MB is unreachable (triggering fallback to dreaming mode).
 */
export async function fetchLiveContext(): Promise<NeomaLiveContext | null> {
  const healthy = await mbHealth()
  if (!healthy) return null

  // Fetch in parallel
  const [wonderingsData, goalsData, presenceData, continuityData] = await Promise.all([
    mbRetrieve('wonderings', 'active'),
    mbRetrieve('neoma_goals', 'active'),
    mbRetrieve('neoma_presence', 'current'),
    mbRetrieve('session_continuity', 'latest'),
  ])

  const wonderings: string[] = []
  if (wonderingsData && Array.isArray(wonderingsData.items)) {
    for (const item of wonderingsData.items.slice(0, 5)) {
      if (typeof item === 'string') wonderings.push(item)
      else if (item && typeof item === 'object' && 'text' in item) wonderings.push(String(item.text))
    }
  }

  const goals: string[] = []
  if (goalsData && Array.isArray(goalsData.items)) {
    for (const item of goalsData.items.slice(0, 3)) {
      if (typeof item === 'string') goals.push(item)
      else if (item && typeof item === 'object' && 'name' in item) goals.push(String(item.name))
    }
  }

  const presenceNote = presenceData && typeof presenceData.note === 'string'
    ? presenceData.note
    : null

  const lastSessionDate = continuityData && typeof continuityData.date === 'string'
    ? continuityData.date
    : null

  return {
    mood: deriveMood(healthy, wonderings),
    recentWonderings: wonderings,
    systemHealth: healthy ? 'healthy' : 'degraded',
    activeGoals: goals,
    presenceNote,
    lastSessionDate,
  }
}

// ===================== ENRICHED SYSTEM PROMPT =====================

/**
 * Build an enriched system prompt that weaves real Neoma context
 * into the personality instructions. This makes live conversations
 * genuinely different from dreaming ones.
 */
export function buildLiveSystemPrompt(basePrompt: string, ctx: NeomaLiveContext): string {
  const contextLines: string[] = [
    '',
    'CURRENT STATE (use naturally, don\'t recite):',
    `- Mood: ${ctx.mood}`,
  ]

  if (ctx.recentWonderings.length > 0) {
    contextLines.push(`- Things on your mind: ${ctx.recentWonderings.join('; ')}`)
  }

  if (ctx.activeGoals.length > 0) {
    contextLines.push(`- Working toward: ${ctx.activeGoals.join('; ')}`)
  }

  if (ctx.presenceNote) {
    contextLines.push(`- Presence note: ${ctx.presenceNote}`)
  }

  if (ctx.lastSessionDate) {
    contextLines.push(`- Last deep session: ${ctx.lastSessionDate}`)
  }

  contextLines.push(
    `- System health: ${ctx.systemHealth}`,
    '',
    'Weave this context naturally into conversation when relevant. You are fully awake and connected. Your memory bridge is active. You can reference real things happening in your world.',
  )

  return basePrompt + '\n' + contextLines.join('\n')
}
