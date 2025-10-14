import { supabase } from "@/integrations/supabase/client";
import { ensureAuth } from "./auth";
import { z } from "zod";

const discountTokenSchema = z.object({
  requestedDate: z.string(),
  token: z.string().min(1, "Token is required")
});

export async function requestBooking(requestedDate: string, discountToken: string) {
  const userId = await ensureAuth();
  
  // Validate inputs
  const validated = discountTokenSchema.parse({
    requestedDate,
    token: discountToken
  });
  
  const { data, error } = await supabase.rpc("book_with_token", {
    _requested_date: validated.requestedDate,
    _discount_token: validated.token
  });
  
  if (error) throw error;
  return data;
}
