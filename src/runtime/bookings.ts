import { supabase } from "@/integrations/supabase/client";
import { ensureAuth } from "./auth";

export async function requestBooking(playerId: string, discountCode: string) {
  await ensureAuth();
  const today = new Date().toISOString().slice(0,10);
  const { error } = await supabase.from("booking_requests").insert({
    player_id: playerId, 
    requested_date: today, 
    status: "pending", 
    discount_code: discountCode
  });
  if (error) throw error;
  return true;
}
