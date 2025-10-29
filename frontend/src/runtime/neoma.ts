import { supabase } from "@/integrations/supabase/client";

export type NeomaContext = "ranch" | "quest" | "clue" | "dialogue";

/**
 * Call Neoma AI for dynamic hints, dialogue, and guidance
 * Uses Lovable AI via edge function for mystical, context-aware responses
 */
export async function generateDialogue(
  prompt: string, 
  context: NeomaContext = "ranch"
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("neoma", {
      body: { prompt, context }
    });

    if (error) {
      console.error("Neoma error:", error);
      return getFallbackResponse(context);
    }

    return data?.text || getFallbackResponse(context);
  } catch (error) {
    console.error("Neoma invocation error:", error);
    return getFallbackResponse(context);
  }
}

/**
 * Fallback responses when AI is unavailable
 */
function getFallbackResponse(context: NeomaContext): string {
  const fallbacks: Record<NeomaContext, string[]> = {
    ranch: [
      "The path ahead reveals itself to those who listen.",
      "Guardian spirits watch over these sacred grounds.",
      "Balance must be maintained between all living things.",
      "The ancient ones speak through the wind and stones."
    ],
    quest: [
      "Trust your instincts, the solution is within reach.",
      "Consider the tools at your disposal carefully.",
      "Sometimes the simplest approach is the wisest.",
      "Patience and observation will guide you."
    ],
    clue: [
      "Look closer at what you've already discovered.",
      "The answer hides in plain sight.",
      "Connect the pieces you've gathered.",
      "History often repeats its patterns."
    ],
    dialogue: [
      "The spirits have spoken their wisdom.",
      "Nature's message comes through the wind.",
      "Listen to the whispers of the land.",
      "The ranch holds many secrets."
    ]
  };

  const contextFallbacks = fallbacks[context] || fallbacks.ranch;
  return contextFallbacks[Math.floor(Math.random() * contextFallbacks.length)];
}
