import { supabase } from "@/integrations/supabase/client";
import { ensureAuth } from "./auth";
import { z } from "zod";

const discountTokenSchema = z.object({
  requestedDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((date) => {
      const d = new Date(date);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const maxDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      return d >= now && d <= maxDate;
    }, "Date must be within the next year"),
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
