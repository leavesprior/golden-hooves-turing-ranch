import { NextResponse } from 'next/server'

/**
 * Server-side LLM health check
 *
 * Returns which LLM provider is currently available.
 */

const OLLAMA_URL = process.env.LLM_OLLAMA_URL || 'http://localhost:11434'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct'

async function checkOllama(): Promise<{ available: boolean; model: string | null }> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal })
    clearTimeout(timeout)

    if (!response.ok) return { available: false, model: null }

    const data = await response.json()
    const models = data.models?.map((m: { name: string }) => m.name.split(':')[0]) || []
    const preferred = ['llama3.2', 'llama3.1', 'llama3', 'mistral', 'gemma2', 'phi3']

    for (const p of preferred) {
      const found = models.find((m: string) => m.includes(p))
      if (found) return { available: true, model: found }
    }

    return { available: models.length > 0, model: data.models?.[0]?.name || null }
  } catch {
    return { available: false, model: null }
  }
}

export async function GET() {
  const ollama = await checkOllama()

  return NextResponse.json({
    ollama: {
      available: ollama.available,
      model: ollama.model,
      url: OLLAMA_URL,
    },
    openrouter: {
      available: !!OPENROUTER_API_KEY,
      model: OPENROUTER_MODEL,
    },
    activeProvider: ollama.available ? 'ollama' : OPENROUTER_API_KEY ? 'openrouter' : 'none',
  })
}
