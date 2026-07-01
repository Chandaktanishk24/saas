-- Migration: Ensure public.newsletters table exists with proper RLS and policies
-- Target: public.newsletters table

CREATE TABLE IF NOT EXISTS public.newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any
DROP POLICY IF EXISTS "Enable all for newsletters" ON public.newsletters;

-- Create policy to allow insert and select for anonymous and authenticated users
CREATE POLICY "Enable all for newsletters" ON public.newsletters
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);
