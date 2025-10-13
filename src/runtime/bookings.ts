import { supabase } from "@/integrations/supabase/client";
import { ensureAuth } from "./auth";
import { bookingSchema } from "./validation";

export async function requestBooking(discountCode: string) {
  const userId = await ensureAuth();
  
  // Validate inputs
  const validated = bookingSchema.parse({
    playerId: userId,
    discountCode: discountCode
  });
  
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("booking_requests").insert({
    player_id: validated.playerId, 
    requested_date: today, 
    status: "pending", 
    discount_code: validated.discountCode
  });
  
  if (error) throw error;
  return true;
}
