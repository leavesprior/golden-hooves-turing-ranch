import { getSupabase } from "./sync";

export async function requestBooking(playerId: string, discountCode: string) {
  const sb = getSupabase();
  const today = new Date().toISOString().slice(0,10);
  const { error } = await sb.from("booking_requests").insert({
    player_id: playerId, 
    requested_date: today, 
    status: "pending", 
    discount_code: discountCode
  });
  if (error) throw error;
  return true;
}
