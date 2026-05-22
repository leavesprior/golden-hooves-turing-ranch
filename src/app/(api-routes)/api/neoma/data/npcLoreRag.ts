/**
 * NPC Lore RAG — "memory lane" retrieval client (FLAG-GATED, OFF BY DEFAULT)
 * --------------------------------------------------------------------------
 * Retrieves an APPROXIMATE slice of ranch lore / Gold-Country atmosphere / past
 * conversation summaries to enrich an NPC turn, so immersion compounds over time.
 *
 * Design: /home/granny/Documents/neoma/turbovec_npc_rag_design_20260522.md
 *
 * turbovec is Python-only with no Node binding, so retrieval lives behind a small
 * local HTTP sidecar (neoma_npc_rag.py). This module is the route's client to it.
 *
 * ⚠️ GATED — NOT YET LIVE. Two preconditions before this may be enabled for players:
 *   1. The Python sidecar (turbovec + nomic-embed-text) must be built + running.
 *   2. Grok-before review is MANDATORY (this touches memory architecture).
 * Until then NEOMA_NPC_RAG_ENABLED is unset and every call here is a silent no-op
 * returning '' — the NPC engine behaves exactly as if this module did not exist.
 *
 * HARD CONSTRAINT: lore + atmosphere + vibe-level conversation memory ONLY. Never
 * exact game state — no scores, inventory, clue-completion booleans, discount codes,
 * or karma totals. The NPC remembers feelings, not a database.
 */

const RAG_ENABLED = process.env.NEOMA_NPC_RAG_ENABLED === '1'
const RAG_URL = process.env.NEOMA_NPC_RAG_URL || 'http://localhost:8123'
// Tight budget: this runs BEFORE the ~5s Ollama call, so it must be cheap or skipped.
const RAG_TIMEOUT_MS = 250
const MAX_SLICES = 3

interface RagRetrieveResponse {
  slices?: string[]
}

/**
 * Fetch an approximate lore slice for the current NPC turn. Returns '' on any
 * condition — flag off, sidecar down, timeout, malformed payload — so the caller
 * can pass the result straight through; an empty block is simply omitted from the
 * prompt. Never throws.
 */
export async function fetchNpcLore(characterId: string, query: string): Promise<string> {
  if (!RAG_ENABLED) return ''
  if (!query || !query.trim()) return ''

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), RAG_TIMEOUT_MS)
    const res = await fetch(`${RAG_URL}/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId, query, k: MAX_SLICES }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) return ''
    const data: RagRetrieveResponse = await res.json()
    if (!Array.isArray(data.slices) || data.slices.length === 0) return ''
    return data.slices
      .filter(s => typeof s === 'string' && s.trim())
      .slice(0, MAX_SLICES)
      .map(s => `- ${s.trim()}`)
      .join('\n')
  } catch {
    // Timeout, network error, bad JSON — degrade silently to the static prompt.
    return ''
  }
}

/** Whether the lane is actually live (flag on). For diagnostics/telemetry only. */
export function isNpcLoreRagEnabled(): boolean {
  return RAG_ENABLED
}
