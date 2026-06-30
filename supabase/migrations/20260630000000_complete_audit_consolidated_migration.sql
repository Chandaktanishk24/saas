-- Consolidated Supabase Migration Script
-- Generated during Database Audit on 2026-06-30
-- This single script sets up the entire database on a brand-new Supabase project.

-- Ensure UUID generation is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. DROP EXISTING CONSTRAINTS / TABLES / TRIGGERS
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP VIEW IF EXISTS public.profiles CASCADE;

-- ==========================================
-- 2. CREATE SCHEMAS / TABLES
-- ==========================================

-- A. Users Table (Public Profile)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY, -- Maps to auth.users.id
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company TEXT,
  role TEXT DEFAULT 'CLIENT' CHECK (role IN ('CLIENT', 'ADMIN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- B. Bookings Table
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

-- C. Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_payment_id TEXT UNIQUE NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  razorpay_signature TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT NOT NULL,
  payment_method TEXT DEFAULT 'Razorpay',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- D. Services Table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price TEXT NOT NULL,
  icon TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- E. Testimonials Table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_role TEXT NOT NULL,
  client_company TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  avatar TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- F. Projects Table (Portfolio)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  technology TEXT NOT NULL,
  services TEXT NOT NULL,
  timeline TEXT NOT NULL,
  client_feedback TEXT,
  live_demo TEXT,
  images TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- G. Newsletters Table
CREATE TABLE IF NOT EXISTS public.newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- H. Contact Messages Table (Legacy dual-write option)
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'UNREAD' CHECK (status IN ('UNREAD', 'READ')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- I. Messages Table (Primary client dashboard queries)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'UNREAD' CHECK (status IN ('UNREAD', 'READ')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- J. Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE
);

-- K. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
  coupon_code TEXT,
  billing_name TEXT NOT NULL,
  billing_email TEXT NOT NULL,
  billing_address TEXT,
  gst_number TEXT,
  razorpay_order_id TEXT UNIQUE,
  invoice_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- L. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  original_amount NUMERIC NOT NULL,
  discount NUMERIC NOT NULL,
  net_amount NUMERIC NOT NULL,
  gst_amount NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'PAID' CHECK (status IN ('PAID', 'UNPAID', 'VOID')),
  download_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE
);

-- M. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 4. CREATE POLICIES (ALL ALLOWED FOR ANON/AUTH)
-- ==========================================
DROP POLICY IF EXISTS "Enable insert access for all" ON public.users;
DROP POLICY IF EXISTS "Enable select access for all" ON public.users;
DROP POLICY IF EXISTS "Enable update access for all" ON public.users;
CREATE POLICY "Enable insert access for all" ON public.users FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Enable select access for all" ON public.users FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Enable update access for all" ON public.users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable insert access for all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable select access for all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable update access for all bookings" ON public.bookings;
CREATE POLICY "Enable insert access for all bookings" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Enable select access for all bookings" ON public.bookings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Enable update access for all bookings" ON public.bookings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for payments" ON public.payments;
CREATE POLICY "Enable all for payments" ON public.payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for services" ON public.services;
CREATE POLICY "Enable all for services" ON public.services FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for testimonials" ON public.testimonials;
CREATE POLICY "Enable all for testimonials" ON public.testimonials FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for projects" ON public.projects;
CREATE POLICY "Enable all for projects" ON public.projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for newsletters" ON public.newsletters;
CREATE POLICY "Enable all for newsletters" ON public.newsletters FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for contact_messages" ON public.contact_messages;
CREATE POLICY "Enable all for contact_messages" ON public.contact_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for messages" ON public.messages;
CREATE POLICY "Enable all for messages" ON public.messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for support_tickets" ON public.support_tickets;
CREATE POLICY "Enable all for support_tickets" ON public.support_tickets FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for orders" ON public.orders;
CREATE POLICY "Enable all for orders" ON public.orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for invoices" ON public.invoices;
CREATE POLICY "Enable all for invoices" ON public.invoices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all for activity_logs" ON public.activity_logs;
CREATE POLICY "Enable all for activity_logs" ON public.activity_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 5. AUTOMATIC PUBLIC USER TRIGGER FROM AUTH.USERS
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, phone, company, role, created_at)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'company', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'CLIENT'),
    COALESCE(new.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    phone = CASE WHEN public.users.phone IS NULL OR public.users.phone = '' THEN EXCLUDED.phone ELSE public.users.phone END,
    company = CASE WHEN public.users.company IS NULL OR public.users.company = '' THEN EXCLUDED.company ELSE public.users.company END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 6. PROFILES VIEW (COMPATIBILITY LAYERS)
-- ==========================================
CREATE OR REPLACE VIEW public.profiles AS
  SELECT * FROM public.users;

ALTER VIEW public.profiles SECURITY INVOKER;

-- ==========================================
-- 7. PERFORMANCE & RELATIONSHIP INDEXES
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_meeting_date ON public.bookings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
