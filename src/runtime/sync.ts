import { supabase } from "@/integrations/supabase/client";
import { ensureAuth } from "./auth";
import { gameStateSchema } from "./validation";

export async function saveRunToSupabase(snapshot: any) {
  const userId = await ensureAuth();
  
  // Validate game state before saving
  const validatedState = gameStateSchema.parse(snapshot.state);
  
  const payload = {
    name: "ranch_" + Date.now(),
    config: {},
    results: {},
    full_log: JSON.stringify({ ...snapshot, state: validatedState })
  };
  
  const { error } = await supabase.from("ranch_runs").insert(payload);
  if (error) throw error;
}

export function getSupabase() { 
  return supabase; 
}
