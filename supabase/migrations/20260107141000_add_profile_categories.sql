-- =============================================
-- PROFILE CATEGORIES
-- =============================================
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.profile_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT,
    -- Lucide icon name or emoji
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- 2. Add category_id to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.profile_categories(id) ON DELETE
SET NULL;
-- 3. Enable RLS
ALTER TABLE public.profile_categories ENABLE ROW LEVEL SECURITY;
-- 4. Policies: Everyone can view categories
CREATE POLICY "Public categories are viewable by everyone" ON public.profile_categories FOR
SELECT USING (TRUE);
-- 5. Seed initial common categories
INSERT INTO public.profile_categories (name, slug, icon, display_order)
VALUES ('Technology', 'technology', 'Cpu', 1),
    ('Education', 'education', 'GraduationCap', 2),
    ('Healthcare', 'healthcare', 'Stethoscope', 3),
    ('Finance', 'finance', 'Wallet', 4),
    ('Real Estate', 'real-estate', 'Home', 5),
    ('Marketing', 'marketing', 'Megaphone', 6),
    ('Entertainment', 'entertainment', 'Music', 7),
    ('Other', 'other', 'MoreHorizontal', 99) ON CONFLICT (name) DO NOTHING;
-- 6. Comment
COMMENT ON TABLE public.profile_categories IS 'Lĩnh vực hoạt động của card visit/profile';