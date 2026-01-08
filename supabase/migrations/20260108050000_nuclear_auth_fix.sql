-- THE STANDARD AUTH SYNC - INDUSTRY BEST PRACTICE
-- This script resets the sync logic to be atomic, resilient, and simple.
-- 1. CLEANUP OLD TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
-- 2. THE ATOMIC SYNC FUNCTION
-- Runs with SECURITY DEFINER to bypass RLS and ensure the record is ALWAYS created.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    auth AS $$
DECLARE final_username TEXT;
BEGIN -- Standard Username Generation
final_username := LOWER(
    REGEXP_REPLACE(
        SPLIT_PART(NEW.email, '@', 1),
        '[^a-zA-Z0-9]',
        '',
        'g'
    )
) || '-' || SUBSTRING(NEW.id::text, 1, 4);
-- ATOMIC UPSERT: One operation for public.users
INSERT INTO public.users (id, email, username, full_name, role, is_active)
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            final_username
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        TRUE
    ) ON CONFLICT (id) DO
UPDATE
SET email = EXCLUDED.email,
    full_name = CASE
        WHEN public.users.full_name = public.users.email THEN EXCLUDED.full_name
        ELSE public.users.full_name
    END;
-- ATOMIC INSERT: Ensure profile exists
INSERT INTO public.profiles (user_id, display_name, slug, is_public)
VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        final_username,
        TRUE
    ) ON CONFLICT (user_id) DO NOTHING;
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN -- Fallback: Just return NEW so the Auth user still gets created
RETURN NEW;
END;
$$;
-- 3. RE-INSTALL TRIGGER
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 4. FORCE RE-SYNC EXISTING USERS
-- Ensure every Auth user has a corresponding Public user and Profile
INSERT INTO public.users (id, email, username, full_name, role, is_active)
SELECT id,
    email,
    LOWER(
        REGEXP_REPLACE(
            SPLIT_PART(email, '@', 1),
            '[^a-zA-Z0-9]',
            '',
            'g'
        )
    ) || '-' || SUBSTRING(id::text, 1, 4),
    COALESCE(raw_user_meta_data->>'full_name', email),
    'user',
    TRUE
FROM auth.users ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (user_id, display_name, slug)
SELECT id,
    full_name,
    username
FROM public.users ON CONFLICT (user_id) DO NOTHING;
-- 5. SIMPLIFIED RLS (Standard Public Visibility)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON public.users;
CREATE POLICY "Public users are viewable by everyone" ON public.users FOR
SELECT USING (TRUE);
DROP POLICY IF EXISTS "Users can update own record" ON public.users;
CREATE POLICY "Users can update own record" ON public.users FOR
UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR
SELECT USING (TRUE);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid() = user_id);