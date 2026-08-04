-- ============================================
-- SANATANA APP - Full Setup (Banners + Quotes)
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- TABLE 1: banner_images (image only, rarely changes)
-- ============================================

CREATE TABLE IF NOT EXISTS public.banner_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one banner active at a time
CREATE OR REPLACE FUNCTION deactivate_other_banners()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.banner_images SET is_active = false WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS only_one_active_banner ON public.banner_images;
CREATE TRIGGER only_one_active_banner
  AFTER INSERT OR UPDATE ON public.banner_images
  FOR EACH ROW EXECUTE FUNCTION deactivate_other_banners();

-- Updated_at auto-update for banner_images
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_banners ON public.banner_images;
CREATE TRIGGER set_updated_at_banners
  BEFORE UPDATE ON public.banner_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.banner_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read all banners" ON public.banner_images;
DROP POLICY IF EXISTS "Admin insert banners" ON public.banner_images;
DROP POLICY IF EXISTS "Admin update banners" ON public.banner_images;
DROP POLICY IF EXISTS "Admin delete banners" ON public.banner_images;

CREATE POLICY "Public read all banners" ON public.banner_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin insert banners" ON public.banner_images FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin update banners" ON public.banner_images FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete banners" ON public.banner_images FOR DELETE TO anon, authenticated USING (true);

-- ============================================
-- TABLE 2: daily_quotes (changes daily)
-- ============================================

CREATE TABLE IF NOT EXISTS public.daily_quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sanskrit TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one quote active at a time
CREATE OR REPLACE FUNCTION deactivate_other_quotes()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.daily_quotes SET is_active = false WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS only_one_active_quote ON public.daily_quotes;
CREATE TRIGGER only_one_active_quote
  AFTER INSERT OR UPDATE ON public.daily_quotes
  FOR EACH ROW EXECUTE FUNCTION deactivate_other_quotes();

DROP TRIGGER IF EXISTS set_updated_at_quotes ON public.daily_quotes;
CREATE TRIGGER set_updated_at_quotes
  BEFORE UPDATE ON public.daily_quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE public.daily_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read all quotes" ON public.daily_quotes;
DROP POLICY IF EXISTS "Admin insert quotes" ON public.daily_quotes;
DROP POLICY IF EXISTS "Admin update quotes" ON public.daily_quotes;
DROP POLICY IF EXISTS "Admin delete quotes" ON public.daily_quotes;

CREATE POLICY "Public read all quotes" ON public.daily_quotes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin insert quotes" ON public.daily_quotes FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin update quotes" ON public.daily_quotes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin delete quotes" ON public.daily_quotes FOR DELETE TO anon, authenticated USING (true);

-- ============================================
-- STORAGE BUCKET for banner images
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read banners" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to banners" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete from banners" ON storage.objects;
DROP POLICY IF EXISTS "Allow update banners" ON storage.objects;

CREATE POLICY "Public read banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Allow upload to banners" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'banners');
CREATE POLICY "Allow update banners" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'banners');
CREATE POLICY "Allow delete from banners" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'banners');

-- ============================================
-- VERIFY
-- ============================================
-- SELECT * FROM public.banner_images;
-- SELECT * FROM public.daily_quotes;
-- SELECT * FROM storage.buckets WHERE id = 'banners';
