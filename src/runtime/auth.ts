import { supabase } from "@/integrations/supabase/client";

let ready: Promise<void> | null = null;

export function ensureAuth(): Promise<void> {
  if (ready) return ready;
  ready = (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) return;
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  })();
  return ready;
}
