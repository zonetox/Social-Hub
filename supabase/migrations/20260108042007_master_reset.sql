-- MASTER RESET SQL - RE-AUDITED
-- 1. CLEANUP OLD TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_user_creation ON public.users;
-- 2. ENSURE INFRASTRUCTURE (UNIQUE CONSTRAINTS)
DO $$ BEGIN -- Thêm UNIQUE cho user_id trong bảng profiles nếu chưa có
IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_user_id_key'
) THEN
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
END IF;
END $$;
-- 3. SYNC FUNCTION: AUTH.USERS -> PUBLIC.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.users (id, email, username, full_name, role, is_active)
VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        'user',
        true
    ) ON CONFLICT (id) DO
UPDATE
SET email = EXCLUDED.email,
    updated_at = NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 4. SYNC FUNCTION: PUBLIC.USERS -> PUBLIC.PROFILES
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user() RETURNS TRIGGER AS $$ BEGIN
INSERT INTO public.profiles (user_id, display_name, slug)
VALUES (
        NEW.id,
        NEW.full_name,
        LOWER(
            REGEXP_REPLACE(NEW.username, '[^a-zA-Z0-9]', '-', 'g')
        )
    ) ON CONFLICT (user_id) DO NOTHING;
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 5. RE-ACTIVATE TRIGGERS
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE TRIGGER create_profile_on_user_creation
AFTER
INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();
-- 6. OVERHAUL RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Unified users view policy" ON public.users;
DROP POLICY IF EXISTS "Unified users update policy" ON public.users;
DROP POLICY IF EXISTS "Admins can do everything" ON public.users;
DROP POLICY IF EXISTS "Anyone can view active users" ON public.users;
DROP POLICY IF EXISTS "Users can edit own record" ON public.users;
DROP POLICY IF EXISTS "Unified users admin policy" ON public.users;
CREATE POLICY "Anyone can view active users" ON public.users FOR
SELECT USING (
        is_active = true
        OR id = auth.uid()
    );
CREATE POLICY "Users can edit own record" ON public.users FOR
UPDATE USING (auth.uid() = id);
-- 7. BACKFILL MISSING DATA
INSERT INTO public.users (id, email, username, full_name, role, is_active)
SELECT id,
    email,
    COALESCE(
        raw_user_meta_data->>'username',
        SPLIT_PART(email, '@', 1)
    ),
    COALESCE(
        raw_user_meta_data->>'full_name',
        SPLIT_PART(email, '@', 1)
    ),
    'user',
    true
FROM auth.users ON CONFLICT (id) DO
UPDATE
SET is_active = true;
INSERT INTO public.profiles (user_id, display_name, slug)
SELECT id,
    full_name,
    LOWER(
        REGEXP_REPLACE(username, '[^a-zA-Z0-9]', '-', 'g')
    )
FROM public.users ON CONFLICT (user_id) DO NOTHING;