// This file now uses MongoDB backend auth instead of Supabase
// Import the auth client like this:
// import { supabase } from "@/integrations/supabase/client";

export { supabase, auth } from '@/services/auth';
export type { User, Session } from '@/services/auth';