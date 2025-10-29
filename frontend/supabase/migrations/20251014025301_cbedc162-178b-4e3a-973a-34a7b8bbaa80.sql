-- Level progress table for durable flags
CREATE TABLE IF NOT EXISTS public.level_progress(
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level1_complete boolean DEFAULT false,
  golden_frog boolean DEFAULT false,
  level2_complete boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.level_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own progress"
ON public.level_progress
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Discount grants table (server-issued only)
CREATE TABLE IF NOT EXISTS public.discount_grants(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  percent integer NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  redeemed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.discount_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own discount grants"
ON public.discount_grants
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own grants"
ON public.discount_grants
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add user_id to booking_requests if missing
ALTER TABLE public.booking_requests ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Atomic booking RPC (redeems token once)
CREATE OR REPLACE FUNCTION public.book_with_token(_requested_date date, _discount_token text)
RETURNS public.booking_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  g public.discount_grants;
  rec public.booking_requests;
BEGIN
  IF uid IS NULL THEN 
    RAISE EXCEPTION 'unauthenticated'; 
  END IF;

  SELECT * INTO g
  FROM public.discount_grants
  WHERE user_id = uid 
    AND token = _discount_token 
    AND expires_at > now() 
    AND redeemed = false
  FOR UPDATE;

  IF NOT FOUND THEN 
    RAISE EXCEPTION 'invalid_or_expired_token'; 
  END IF;

  INSERT INTO public.booking_requests(user_id, player_id, requested_date, status, discount_code)
  VALUES (uid, uid, _requested_date, 'pending', _discount_token)
  RETURNING * INTO rec;

  UPDATE public.discount_grants 
  SET redeemed = true 
  WHERE id = g.id;

  RETURN rec;
END $$;

GRANT EXECUTE ON FUNCTION public.book_with_token(date, text) TO authenticated;