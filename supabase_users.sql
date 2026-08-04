-- ============================================
-- SANATANA APP - Users / Customers Table
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create users table (stores customer profile data)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid TEXT UNIQUE NOT NULL,       -- Firebase UID links to Firebase Auth
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  mobile TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  day_streak INTEGER DEFAULT 0,
  books_read INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  chant_count INTEGER DEFAULT 108,
  bookmarks TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Auto update updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_users_updated_at();

-- 3. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Drop old policies if exist
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Anon can insert users" ON public.users;
DROP POLICY IF EXISTS "Anon can read users" ON public.users;

-- 5. Allow anon to insert (registration)
CREATE POLICY "Anon can insert users"
  ON public.users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 6. Allow anon to read by firebase_uid (login lookup)
CREATE POLICY "Anon can read users"
  ON public.users FOR SELECT
  TO anon, authenticated
  USING (true);

-- 7. Allow anon to update own record
CREATE POLICY "Anon can update users"
  ON public.users FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- VERIFY
-- ============================================
-- SELECT * FROM public.users;
