/**
 * AI Hints Service
 * Handles communication with the AI hint generation endpoint
 */

const BACKEND_URL = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export interface HintRequest {
  prompt: string;
  max_tokens?: number;
  user_id?: string;
}

export interface HintResponse {
  text: string;
  character: string;
}

export interface GameStateResponse {
  karma: number;
  clues: number;
  activities: number;
  level: number;
  discount_percent: number;
}

export interface DiscountResponse {
  code: string;
  discount: number;
}

/**
 * Get an AI-powered hint from Leif Pryor
 */
export async function getAIHint(prompt: string, userId?: string): Promise<HintResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/hint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        max_tokens: 100,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get hint: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting AI hint:', error);
    // Return fallback hint
    return {
      text: "Well partner, sometimes the best hints come from exploring! Try talking to folks around the ranch and checking those clue spots. 🤠",
      character: "Leif Pryor"
    };
  }
}

/**
 * Get user's game state from backend
 */
export async function getGameState(userId: string): Promise<GameStateResponse> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/game-state/${userId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get game state: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting game state:', error);
    return {
      karma: 0,
      clues: 0,
      activities: 0,
      level: 0,
      discount_percent: 0,
    };
  }
}

/**
 * Save user's game state to backend
 */
export async function saveGameState(userId: string, state: Record<string, any>): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/save-state/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ state }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save game state: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error saving game state:', error);
    return false;
  }
}

/**
 * Generate discount code based on game progress
 */
export async function generateDiscount(userId: string): Promise<DiscountResponse | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/generate-discount/${userId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate discount');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating discount:', error);
    return null;
  }
}
