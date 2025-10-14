import { engine } from "./engine";
import { supabase } from "@/integrations/supabase/client";

export interface ProgressData {
  level1Complete: boolean;
  goldenFrog: boolean;
  level2Complete?: boolean;
  ts: number;
}

export function syncProgressFromStorage() {
  try {
    const raw = localStorage.getItem("ghq.progress");
    if (!raw) return;
    const p: ProgressData = JSON.parse(raw);
    const g = engine.getGameState();
    g.flags = {
      ...(g.flags || {}),
      level1Complete: !!p.level1Complete,
      goldenFrog: !!p.goldenFrog,
      level2Complete: !!p.level2Complete,
    };
  } catch (err) {
    console.warn("Failed to sync progress from storage:", err);
  }
}

export async function saveProgressToStorage(progress: Partial<ProgressData>) {
  try {
    const existing = localStorage.getItem("ghq.progress");
    const current: ProgressData = existing
      ? JSON.parse(existing)
      : { level1Complete: false, goldenFrog: false, ts: Date.now() };

    const updated: ProgressData = {
      ...current,
      ...progress,
      ts: Date.now(),
    };

    localStorage.setItem("ghq.progress", JSON.stringify(updated));

    // Also save to Supabase for durability
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("level_progress").upsert({
        user_id: user.id,
        level1_complete: updated.level1Complete,
        golden_frog: updated.goldenFrog,
        level2_complete: updated.level2Complete || false,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn("Failed to save progress:", err);
  }
}

export async function loadProgressFromSupabase() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("level_progress")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) return null;

    const progress: ProgressData = {
      level1Complete: data.level1_complete,
      goldenFrog: data.golden_frog,
      level2Complete: data.level2_complete,
      ts: new Date(data.updated_at).getTime(),
    };

    // Sync to localStorage
    localStorage.setItem("ghq.progress", JSON.stringify(progress));

    return progress;
  } catch (err) {
    console.warn("Failed to load progress from Supabase:", err);
    return null;
  }
}
