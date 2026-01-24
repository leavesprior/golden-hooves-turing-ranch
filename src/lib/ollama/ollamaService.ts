/**
 * BOBR Ollama Service
 *
 * API client for localhost:11434 Ollama server.
 * Provides health checks, streaming responses, and graceful fallback.
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

class OllamaService {
  private status: OllamaServiceStatus = {
    available: false,
    model: null,
    lastChecked: 0,
  };

  private healthCheckPromise: Promise<OllamaServiceStatus> | null = null;

  /**
   * Check if Ollama service is available and get best model
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

    this.healthCheckPromise = this._performHealthCheck();
    const result = await this.healthCheckPromise;
    this.healthCheckPromise = null;
    return result;
  }

  private async _performHealthCheck(): Promise<OllamaServiceStatus> {
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
   * Check if Ollama is currently available
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
