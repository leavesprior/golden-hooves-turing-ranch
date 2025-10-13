-- Fix critical security issues: Complete the RLS policy replacement

-- 1. Ensure enum types exist
DO $$ BEGIN
  CREATE TYPE public.booking_status AS ENUM ('pending', 'approved', 'used', 'expired');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.alignment_type AS ENUM ('Good', 'Neutral', 'Chaotic');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Drop ALL existing policies (both old and partially created new ones)
DROP POLICY IF EXISTS "players_rw" ON public.players;
DROP POLICY IF EXISTS "booking_rw" ON public.booking_requests;
DROP POLICY IF EXISTS "inventory_rw" ON public.inventory;
DROP POLICY IF EXISTS "karma_rw" ON public.karma_ledger;
DROP POLICY IF EXISTS "runs_insert" ON public.ranch_runs;
DROP POLICY IF EXISTS "runs_select" ON public.ranch_runs;
DROP POLICY IF EXISTS "Users can view their own player data" ON public.players;
DROP POLICY IF EXISTS "Users can insert their own player data" ON public.players;
DROP POLICY IF EXISTS "Users can update their own player data" ON public.players;
DROP POLICY IF EXISTS "Users can delete their own player data" ON public.players;
DROP POLICY IF EXISTS "Users can view their own booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Users can create their own booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Users can update their own booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Users can delete their own booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Users can view their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can manage their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "Users can view their own karma transactions" ON public.karma_ledger;
DROP POLICY IF EXISTS "Users can create their own karma transactions" ON public.karma_ledger;
DROP POLICY IF EXISTS "Users can view their own ranch runs" ON public.ranch_runs;
DROP POLICY IF EXISTS "Users can insert their own ranch runs" ON public.ranch_runs;

-- 3. Alter tables to enforce data integrity (if not already done)
ALTER TABLE public.players ALTER COLUMN id SET DEFAULT auth.uid();

-- Handle status column conversion carefully
DO $$ 
BEGIN
  -- Try to convert status column if it's still text
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'booking_requests' 
    AND column_name = 'status' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE public.booking_requests 
      ALTER COLUMN status DROP DEFAULT,
      ALTER COLUMN status TYPE public.booking_status USING status::public.booking_status,
      ALTER COLUMN status SET DEFAULT 'pending'::public.booking_status;
  END IF;
END $$;

-- Make player_id columns NOT NULL where needed
DO $$
BEGIN
  -- booking_requests.player_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'booking_requests' 
    AND column_name = 'player_id' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.booking_requests ALTER COLUMN player_id SET NOT NULL;
  END IF;

  -- inventory.player_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inventory' 
    AND column_name = 'player_id' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.inventory ALTER COLUMN player_id SET NOT NULL;
  END IF;

  -- karma_ledger.player_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'karma_ledger' 
    AND column_name = 'player_id' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.karma_ledger ALTER COLUMN player_id SET NOT NULL;
  END IF;
END $$;

-- 4. Create proper RLS policies for players table
CREATE POLICY "Users can view their own player data"
ON public.players FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert their own player data"
ON public.players FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own player data"
ON public.players FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Users can delete their own player data"
ON public.players FOR DELETE TO authenticated
USING (id = auth.uid());

-- 5. Create proper RLS policies for booking_requests
CREATE POLICY "Users can view their own booking requests"
ON public.booking_requests FOR SELECT TO authenticated
USING (player_id = auth.uid());

CREATE POLICY "Users can create their own booking requests"
ON public.booking_requests FOR INSERT TO authenticated
WITH CHECK (player_id = auth.uid());

CREATE POLICY "Users can update their own booking requests"
ON public.booking_requests FOR UPDATE TO authenticated
USING (player_id = auth.uid()) WITH CHECK (player_id = auth.uid());

CREATE POLICY "Users can delete their own booking requests"
ON public.booking_requests FOR DELETE TO authenticated
USING (player_id = auth.uid());

-- 6. Create proper RLS policies for inventory
CREATE POLICY "Users can view their own inventory"
ON public.inventory FOR SELECT TO authenticated
USING (player_id = auth.uid());

CREATE POLICY "Users can manage their own inventory"
ON public.inventory FOR ALL TO authenticated
USING (player_id = auth.uid()) WITH CHECK (player_id = auth.uid());

-- 7. Create proper RLS policies for karma_ledger
CREATE POLICY "Users can view their own karma transactions"
ON public.karma_ledger FOR SELECT TO authenticated
USING (player_id = auth.uid());

CREATE POLICY "Users can create their own karma transactions"
ON public.karma_ledger FOR INSERT TO authenticated
WITH CHECK (player_id = auth.uid());

-- 8. Create proper RLS policies for ranch_runs
CREATE POLICY "Users can view their own ranch runs"
ON public.ranch_runs FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.players WHERE players.id = auth.uid()));

CREATE POLICY "Users can insert their own ranch runs"
ON public.ranch_runs FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.players WHERE players.id = auth.uid()));