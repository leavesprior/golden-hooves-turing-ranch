import { supabase } from "@/integrations/supabase/client";

export async function getDiscountToken(code: "GHQ10" | "GHQ15") {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase.functions.invoke("redeem_discount", {
    body: { code },
  });

  if (error) throw error;
  if (!data) throw new Error("No response from server");

  return data as { token: string; percent: number };
}

export async function bookWithToken(requestedDate: string, token: string) {
  const { data, error } = await supabase.rpc("book_with_token", {
    _requested_date: requestedDate,
    _discount_token: token,
  });

  if (error) throw error;
  return data;
}
