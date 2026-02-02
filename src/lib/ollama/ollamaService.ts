/**
 * BOBR LLM Service
 *
 * Dual-mode LLM client:
 * - Direct mode (local dev): Talks to localhost:11434 Ollama directly from browser
 * - Proxy mode (Railway/production): Routes through /api/llm/* server-side routes
 *   which try Ollama via Cloudflare tunnel, then fall back to OpenRouter
 *
 * Set NEXT_PUBLIC_LLM_MODE=proxy for production deployment.
 */

import {
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaStreamChunk,
  OllamaTagsResponse,
  OllamaServiceStatus,
  PREFERRED_MODELS,
} from './types';

const OLLAMA_BASE_URL = 'http://localhost:11434';
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const REQUEST_TIMEOUT = 60000; // 60 seconds for generation

// Proxy mode: route through server-side API routes
// Auto-detect production: if we're not on localhost, always use proxy mode
const isProxyMode = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_LLM_MODE === 'proxy')
  || (typeof window !== 'undefined' && window.location.hostname !== 'localhost');

class OllamaService {
  private status: OllamaServiceStatus = {
    available: false,
    model: null,
    lastChecked: 0,
  };

  private healthCheckPromise: Promise<OllamaServiceStatus> | null = null;

  /**
   * Check if LLM service is available and get best model
   */
  async checkHealth(force = false): Promise<OllamaServiceStatus> {
    const now = Date.now();

    // Return cached status if recent and not forced
    if (!force && this.status.lastChecked > now - HEALTH_CHECK_INTERVAL) {
      return this.status;
    }

    // Deduplicate concurrent health checks
    if (this.healthCheckPromise) {
      return this.healthCheckPromise;
    }

    this.healthCheckPromise = isProxyMode
      ? this._performProxyHealthCheck()
      : this._performDirectHealthCheck();
    const result = await this.healthCheckPromise;
    this.healthCheckPromise = null;
    return result;
  }

  private async _performProxyHealthCheck(): Promise<OllamaServiceStatus> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('/api/llm/health', { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      this.status = {
        available: data.activeProvider !== 'none',
        model: data.ollama?.model || data.openrouter?.model || null,
        lastChecked: Date.now(),
      };
    } catch (error) {
      this.status = {
        available: false,
        model: null,
        lastChecked: Date.now(),
        error: error instanceof Error ? error.message : 'Proxy health check failed',
      };
    }
    return this.status;
  }

  private async _performDirectHealthCheck(): Promise<OllamaServiceStatus> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: OllamaTagsResponse = await response.json();
      const availableModels = data.models.map(m => m.name.split(':')[0]);

      // Find best available model
      let selectedModel: string | null = null;
      for (const preferred of PREFERRED_MODELS) {
        if (availableModels.some(m => m.includes(preferred))) {
          selectedModel = availableModels.find(m => m.includes(preferred)) || null;
          break;
        }
      }

      // Fallback to first available model
      if (!selectedModel && availableModels.length > 0) {
        selectedModel = data.models[0].name;
      }

      this.status = {
        available: !!selectedModel,
        model: selectedModel,
        lastChecked: Date.now(),
      };
    } catch (error) {
      this.status = {
        available: false,
        model: null,
        lastChecked: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    return this.status;
  }

  /**
   * Check if LLM is currently available
   */
  isAvailable(): boolean {
    return this.status.available;
  }

  /**
   * Get the current model name
   */
  getModel(): string | null {
    return this.status.model;
  }

  /**
   * Generate a response (non-streaming)
   */
  async generate(
    prompt: string,
    options?: {
      system?: string;
      context?: number[];
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<OllamaGenerateResponse | null> {
    if (isProxyMode) {
      return this._generateViaProxy(prompt, options);
    }
    return this._generateDirect(prompt, options);
  }

  private async _generateViaProxy(
    prompt: string,
    options?: {
      system?: string;
      context?: number[];
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<OllamaGenerateResponse | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch('/api/llm/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          system: options?.system,
          context: options?.context,
          temperature: options?.temperature,
          maxTokens: options?.maxTokens,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return null;

      const data = await response.json();
      if (!data.response) return null;

      return {
        model: data.model || 'proxy',
        created_at: new Date().toISOString(),
        response: data.response,
        done: true,
        context: data.context,
      };
    } catch (error) {
      console.error('[OllamaService] Proxy generation failed:', error);
      return null;
    }
  }

  private async _generateDirect(
    prompt: string,
    options?: {
      system?: string;
      context?: number[];
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<OllamaGenerateResponse | null> {
    const status = await this.checkHealth();
    if (!status.available || !status.model) {
      return null;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const request: OllamaGenerateRequest = {
        model: status.model,
        prompt,
        system: options?.system,
        context: options?.context,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 256,
          stop: ['\n\n', 'Player:', 'User:', '['],
        },
      };

      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[OllamaService] Generation failed:', error);
      // Mark as unavailable on error
      this.status.available = false;
      return null;
    }
  }

  /**
   * Generate a streaming response
   * Returns an async generator for real-time display
   * Note: In proxy mode, falls back to non-streaming for simplicity
   */
  async *generateStream(
    prompt: string,
    options?: {
      system?: string;
      context?: number[];
      temperature?: number;
      maxTokens?: number;
    }
  ): AsyncGenerator<OllamaStreamChunk, OllamaGenerateResponse | null, unknown> {
    // In proxy mode, simulate streaming with a single response
    if (isProxyMode) {
      const result = await this._generateViaProxy(prompt, options);
      if (result) {
        // Emit the full response as a single chunk
        yield {
          model: result.model,
          created_at: result.created_at,
          response: result.response,
          done: true,
        };
        return result;
      }
      return null;
    }

    // Direct Ollama streaming
    const status = await this.checkHealth();
    if (!status.available || !status.model) {
      return null;
    }

    try {
      const request: OllamaGenerateRequest = {
        model: status.model,
        prompt,
        system: options?.system,
        context: options?.context,
        stream: true,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens ?? 256,
          stop: ['\n\n', 'Player:', 'User:', '['],
        },
      };

      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let finalResult: OllamaGenerateResponse | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const parsed: OllamaStreamChunk = JSON.parse(line);
            fullResponse += parsed.response;
            yield parsed;

            if (parsed.done) {
              finalResult = {
                model: status.model!,
                created_at: parsed.created_at,
                response: fullResponse,
                done: true,
              };
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }

      return finalResult;
    } catch (error) {
      console.error('[OllamaService] Stream generation failed:', error);
      this.status.available = false;
      return null;
    }
  }

  /**
   * Generate NPC dialogue with personality system prompt
   */
  async generateNPCDialogue(
    playerMessage: string,
    systemPrompt: string,
    context?: number[],
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<{ response: string; context?: number[] } | null> {
    const result = await this.generate(playerMessage, {
      system: systemPrompt,
      context,
      temperature: options?.temperature ?? 0.8,
      maxTokens: options?.maxTokens ?? 200,
    });

    if (!result) return null;

    return {
      response: this.cleanResponse(result.response),
      context: result.context,
    };
  }

  /**
   * Stream NPC dialogue for natural typing effect
   */
  async *streamNPCDialogue(
    playerMessage: string,
    systemPrompt: string,
    context?: number[],
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): AsyncGenerator<string, { response: string; context?: number[] } | null, unknown> {
    let fullResponse = '';
    let resultContext: number[] | undefined;

    const stream = this.generateStream(playerMessage, {
      system: systemPrompt,
      context,
      temperature: options?.temperature ?? 0.8,
      maxTokens: options?.maxTokens ?? 200,
    });

    for await (const chunk of stream) {
      fullResponse += chunk.response;
      yield chunk.response;

      if (chunk.done) {
        // Get context from final response if available
        const result = await stream.return(null);
        if (result.value) {
          resultContext = (result.value as OllamaGenerateResponse).context;
        }
      }
    }

    if (fullResponse) {
      return {
        response: this.cleanResponse(fullResponse),
        context: resultContext,
      };
    }

    return null;
  }

  /**
   * Clean up LLM response text
   */
  private cleanResponse(text: string): string {
    return text
      .trim()
      // Remove incomplete sentences at the end
      .replace(/[^.!?*"')\]]+$/, '')
      // Remove any meta-text the model might add
      .replace(/^\[.*?\]\s*/g, '')
      .replace(/\*thinks\*/gi, '')
      .replace(/\*pauses\*/gi, '')
      // Clean up excessive punctuation
      .replace(/\.{4,}/g, '...')
      .replace(/!{3,}/g, '!!')
      .trim();
  }

  /**
   * Reset service status (for testing)
   */
  reset(): void {
    this.status = {
      available: false,
      model: null,
      lastChecked: 0,
    };
  }
}

// Singleton instance
export const ollamaService = new OllamaService();

// Export for testing
export { OllamaService };
