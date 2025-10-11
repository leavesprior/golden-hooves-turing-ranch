import { supabase } from "@/integrations/supabase/client";

export async function saveRunToSupabase(snapshot: any) {
  const payload = {
    name: "ranch_" + Date.now(),
    config: {},
    results: {},
    full_log: JSON.stringify(snapshot),
    blockchain_hash: hash(JSON.stringify(snapshot))
  };
  const { error } = await supabase.from("ranch_runs").insert(payload);
  if (error) throw error;
}

export function getSupabase() { 
  return supabase; 
}

function hash(s: string) {
  let h = 5381; 
  for (let i=0; i<s.length; i++) h=((h<<5)+h)+s.charCodeAt(i);
  return (h>>>0).toString();
}
