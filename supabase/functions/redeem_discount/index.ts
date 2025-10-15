import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schemas
const redeemSchema = z.object({
  code: z.enum(["GHQ10", "GHQ15"], { 
    errorMap: () => ({ message: "Invalid discount code" }) 
  })
});

function generateToken(): string {
  return crypto.randomUUID().replace(/-/g, "") + Math.floor(Math.random() * 1e6).toString(36);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Service initialization failed");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }), 
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authedClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate input
    const body = await req.json();
    const validation = redeemSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { code } = validation.data;

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
      return new Response(
        JSON.stringify({ error: "Not eligible for this discount" }), 
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      console.error("Grant creation failed:", insertError.code);
      return new Response(
        JSON.stringify({ error: "Unable to process request" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ token, percent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Service error:", error instanceof Error ? error.message : "Unknown error");
    return new Response(
      JSON.stringify({ error: "Service temporarily unavailable" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
