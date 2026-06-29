-- Migration: Set up Auth Trigger for automatic public user profile synchronization
-- Created on: 2026-06-29

-- Ensure role column exists in public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'CLIENT';

-- 1. Create a trigger function that inserts a profile row into public.users
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

-- 2. Bind the trigger to auth.users AFTER INSERT
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create a public.profiles view pointing to public.users to support both profile and user naming conventions
CREATE OR REPLACE VIEW public.profiles AS
  SELECT * FROM public.users;

-- 4. Enable Row Level Security and setup policy permissions
ALTER VIEW public.profiles SECURITY INVOKER;
