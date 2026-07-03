import { NextRequest, NextResponse } from 'next/server'
import { rateLimitOk, clientIpFrom } from '@/lib/markerSession'

// Abuse limits — this route proxies to an LLM (local Ollama today, billed
// OpenRouter the moment a key is set), so an unbounded/unauthenticated caller is
// a cost/DoS hole. Cap the inputs and rate-limit per IP.
const MAX_PROMPT_CHARS = 4000
const MAX_SYSTEM_CHARS = 2000
const MAX_TOKENS_CAP = 512
const MAX_CONTEXT_LEN = 4096

const clampInt = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : fallback
  return Math.min(max, Math.max(min, n))
}
const clampNum = (v: unknown, min: number, max: number, fallback: number): number => {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback
  return Math.min(max, Math.max(min, n))
}

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
  // Same-origin guard: reject a cross-site browser caller (the open-proxy vector).
  // A present Origin whose host differs from ours is blocked; non-browser callers
  // that omit Origin still pass (they can't be CSRF'd).
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      if (new URL(origin).host !== request.headers.get('host')) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
  }

  // Per-IP rate limit (shared token-bucket helper).
  const ip = clientIpFrom(request.headers)
  if (!rateLimitOk(ip)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }

  // Parse defensively — a malformed body must be a 400, not an unhandled 500.
  let raw: Partial<GenerateRequestBody>
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const prompt = typeof raw.prompt === 'string' ? raw.prompt.slice(0, MAX_PROMPT_CHARS) : ''
  if (!prompt.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  // Clamp every attacker-controlled field so cost/compute can't be run up.
  const body: GenerateRequestBody = {
    prompt,
    system: typeof raw.system === 'string' ? raw.system.slice(0, MAX_SYSTEM_CHARS) : undefined,
    context: Array.isArray(raw.context)
      ? raw.context.slice(0, MAX_CONTEXT_LEN).filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
      : undefined,
    temperature: clampNum(raw.temperature, 0, 2, 0.7),
    maxTokens: clampInt(raw.maxTokens, 1, MAX_TOKENS_CAP, 256),
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
