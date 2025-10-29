import { supabase } from "@/integrations/supabase/client";
import { engine } from "./engine";

const LS_KEY = "ghq.progress";

function readLocal(): any | null {
  try { 
    const r = localStorage.getItem(LS_KEY); 
    return r ? JSON.parse(r) : null; 
  } catch { 
    return null; 
  }
}

function writeLocal(p: any) {
  try { 
    localStorage.setItem(LS_KEY, JSON.stringify(p)); 
  } catch {}
}

/** Push Level‑1 completion from web UI into DB + cache. Call this after the quiz passes 6/6. */
export async function markLevel1Complete() {
  const p = { level1Complete: true, goldenFrog: true, ts: Date.now() };
  writeLocal(p);
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      await supabase.from("level_progress").upsert({
        user_id: session.user.id,
        level1_complete: true,
        golden_frog: true,
        updated_at: new Date().toISOString()
      });
    }
  } catch {}
}

/** Synchronous local sync (no network). Use before gating checks. */
export function syncProgressFromStorage() {
  const p = readLocal();
  if (!p) return;
  const g = engine.getGameState();
  g.flags = { 
    ...(g.flags || {}), 
    level1Complete: !!p.level1Complete, 
    goldenFrog: !!p.goldenFrog 
  };
}

/** Best‑effort pull from DB, then mirror to local and engine. Call on scene create/wake. */
export async function pullProgress() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    let p = readLocal();
    if (session?.user?.id) {
      const { data } = await supabase
        .from("level_progress")
        .select("level1_complete,golden_frog")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data) {
        p = { 
          level1Complete: !!data.level1_complete, 
          goldenFrog: !!data.golden_frog, 
          ts: Date.now() 
        };
      }
    }
    if (p) {
      writeLocal(p);
      const g = engine.getGameState();
      g.flags = { 
        ...(g.flags || {}), 
        level1Complete: !!p.level1Complete, 
        goldenFrog: !!p.goldenFrog 
      };
    }
  } catch {}
}

/** Server‑authoritative Level‑2 gate check */
export async function verifyLevel2Access(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    const { data } = await supabase
      .from("level_progress")
      .select("level1_complete,golden_frog")
      .eq("user_id", session.user.id)
      .maybeSingle();
    return !!(data?.level1_complete && data?.golden_frog);
  } catch {
    return false;
  }
}
