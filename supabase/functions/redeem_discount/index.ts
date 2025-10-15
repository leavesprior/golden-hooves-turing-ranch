import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + Math.floor(Math.random() * 1e6).toString(36);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authedClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const { code } = await req.json();
    if (!code || !/^GHQ(10|15)$/.test(code)) {
      return new Response("Invalid code format", { status: 400, headers: corsHeaders });
    }

    // Check eligibility from level_progress
    const { data: progress } = await authedClient
      .from("level_progress")
      .select("level1_complete, golden_frog, level2_complete")
      .eq("user_id", user.id)
      .maybeSingle();

    const isEligibleFor10 = progress?.level1_complete && progress?.golden_frog;
    const isEligibleFor15 = progress?.level2_complete === true;

    const isEligible = code === "GHQ10" ? isEligibleFor10 : isEligibleFor15;
    
    if (!isEligible) {
      console.log(`Eligibility check failed for code ${code}`);
      return new Response("Not eligible for this discount", { status: 403, headers: corsHeaders });
    }

    // Issue grant using service role
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30).toISOString(); // 30 min
    const percent = code === "GHQ10" ? 10 : 15;

    const { error: insertError } = await serviceClient.from("discount_grants").insert({
      user_id: user.id,
      code,
      percent,
      token,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response("Failed to create discount", { status: 500, headers: corsHeaders });
    }

    console.log(`Successfully issued discount token`);

    return new Response(
      JSON.stringify({ token, percent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in redeem_discount:", error);
    return new Response("Internal server error", { status: 500, headers: corsHeaders });
  }
});
