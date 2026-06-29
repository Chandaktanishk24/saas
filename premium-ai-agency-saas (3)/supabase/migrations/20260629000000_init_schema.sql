-- Migration: Create users and bookings tables with RLS and policies
-- Created on: 2026-06-29

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  service TEXT NOT NULL,
  budget INTEGER,
  meeting_date DATE NOT NULL,
  meeting_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  project_description TEXT,
  meeting_link TEXT,
  payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Failed')),
  booking_status TEXT DEFAULT 'Pending' CHECK (booking_status IN ('Pending', 'Confirmed', 'Cancelled', 'Completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 4. Recreate/Enable Policies for Users Table
DROP POLICY IF EXISTS "Enable insert access for all" ON public.users;
DROP POLICY IF EXISTS "Enable select access for all" ON public.users;
DROP POLICY IF EXISTS "Enable update access for all" ON public.users;

CREATE POLICY "Enable insert access for all" ON public.users
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Enable select access for all" ON public.users
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Enable update access for all" ON public.users
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Recreate/Enable Policies for Bookings Table
DROP POLICY IF EXISTS "Enable insert access for all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable select access for all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable update access for all bookings" ON public.bookings;

CREATE POLICY "Enable insert access for all bookings" ON public.bookings
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Enable select access for all bookings" ON public.bookings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Enable update access for all bookings" ON public.bookings
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);
