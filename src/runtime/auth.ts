import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// Validation schema for authentication
const authSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export async function ensureAuth(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw new Error("User not authenticated. Please sign up or log in.");
  }
  return data.session.user.id;
}

export async function signUp(email: string, password: string) {
  const validated = authSchema.parse({ email, password });
  const redirectUrl = `${window.location.origin}/`;
  const { data, error } = await supabase.auth.signUp({
    email: validated.email,
    password: validated.password,
    options: {
      emailRedirectTo: redirectUrl
    }
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const validated = authSchema.parse({ email, password });
  const { data, error } = await supabase.auth.signInWithPassword({
    email: validated.email,
    password: validated.password
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
