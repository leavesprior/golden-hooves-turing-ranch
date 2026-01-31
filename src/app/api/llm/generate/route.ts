import { NextRequest, NextResponse } from 'next/server'

/**
 * Server-side LLM proxy route
 *
 * Tries local Ollama (via Cloudflare tunnel) first, then falls back to
 * OpenRouter when the local machine is asleep/unreachable.
 *
 * Environment variables:
 *   LLM_OLLAMA_URL      - Ollama endpoint (e.g. https://ollama.your-tunnel.com)
 *   OPENROUTER_API_KEY   - OpenRouter API key for fallback
 *   OPENROUTER_MODEL     - Model to use on OpenRouter (default: meta-llama/llama-3.1-8b-instruct)
 *   LLM_OLLAMA_TIMEOUT   - Timeout in ms for Ollama connection (default: 5000)
 */

const OLLAMA_URL = process.env.LLM_OLLAMA_URL || 'http://localhost:11434'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct'
const OLLAMA_TIMEOUT = parseInt(process.env.LLM_OLLAMA_TIMEOUT || '5000', 10)

interface GenerateRequestBody {
  prompt: string
  system?: string
  context?: number[]
  temperature?: number
  maxTokens?: number
}

/**
 * Try Ollama first. Returns null if unavailable.
 */
async function tryOllama(body: GenerateRequestBody, model: string): Promise<Response | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT)

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: body.prompt,
        system: body.system,
        context: body.context,
        stream: false,
        options: {
          temperature: body.temperature ?? 0.7,
          num_predict: body.maxTokens ?? 256,
          stop: ['\n\n', 'Player:', 'User:', '['],
        },
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) return null
    return response
  } catch {
    return null
  }
}

/**
 * Fallback to OpenRouter (OpenAI-compatible API).
 */
async function tryOpenRouter(body: GenerateRequestBody): Promise<Response | null> {
  if (!OPENROUTER_API_KEY) return null

  try {
    const messages: { role: string; content: string }[] = []
    if (body.system) {
      messages.push({ role: 'system', content: body.system })
    }
    messages.push({ role: 'user', content: body.prompt })

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://backofbeyondranch.farm',
        'X-Title': 'Golden Frog Trail',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        temperature: body.temperature ?? 0.7,
        max_tokens: body.maxTokens ?? 256,
        stop: ['\n\n', 'Player:', 'User:', '['],
      }),
    })

    if (!response.ok) return null
    return response
  } catch {
    return null
  }
}

/**
 * Discover the best available Ollama model.
 */
async function getOllamaModel(): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal })
    clearTimeout(timeout)

    if (!response.ok) return null

    const data = await response.json()
    const models = data.models?.map((m: { name: string }) => m.name.split(':')[0]) || []

    const preferred = ['llama3.2', 'llama3.1', 'llama3', 'mistral', 'gemma2', 'phi3']
    for (const p of preferred) {
      const found = models.find((m: string) => m.includes(p))
      if (found) return found
    }
    return data.models?.[0]?.name || null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const body: GenerateRequestBody = await request.json()

  if (!body.prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  // Try Ollama first
  const ollamaModel = await getOllamaModel()
  if (ollamaModel) {
    const ollamaResponse = await tryOllama(body, ollamaModel)
    if (ollamaResponse) {
      const data = await ollamaResponse.json()
      return NextResponse.json({
        response: data.response,
        context: data.context,
        provider: 'ollama',
        model: ollamaModel,
        done: true,
      })
    }
  }

  // Fallback to OpenRouter
  const openRouterResponse = await tryOpenRouter(body)
  if (openRouterResponse) {
    const data = await openRouterResponse.json()
    const text = data.choices?.[0]?.message?.content || ''
    return NextResponse.json({
      response: text,
      provider: 'openrouter',
      model: OPENROUTER_MODEL,
      done: true,
    })
  }

  // Both providers failed
  return NextResponse.json({
    response: null,
    provider: 'none',
    error: 'No LLM provider available',
    done: true,
  }, { status: 503 })
}
