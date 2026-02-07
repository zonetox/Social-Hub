-- =========================================================
-- CTO PRODUCTION MASTER FIX - TRIGGERS CONSOLIDATION
-- =========================================================
-- 1. CLEANUP ALL CONFLICTING TRIGGERS
-- Remove legacy trigger on public.users (it conflicts with our main trigger)
DROP TRIGGER IF EXISTS create_profile_on_user_creation ON public.users;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user();
-- Reset main auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
-- 2. THE UNIFIED ATOMIC SYNC FUNCTION
-- This single function handles EVERYTHING: User, Profile, Subscription, Credits.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    auth AS $$
DECLARE final_username TEXT;
default_plan_id UUID;
BEGIN -- 2.1 Sanitize & Generate Unique Username
final_username := LOWER(
    REGEXP_REPLACE(
        SPLIT_PART(NEW.email, '@', 1),
        '[^a-zA-Z0-9]',
        '',
        'g'
    )
) || '-' || SUBSTRING(NEW.id::text, 1, 4);
-- 2.2 Sync public.users (Atomic)
INSERT INTO public.users (id, email, username, full_name, role, is_active)
VALUES (
        NEW.id,
        NEW.email,
        final_username,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        'user',
        TRUE
    ) ON CONFLICT (id) DO
UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
-- 2.3 Sync public.profiles (Atomic)
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
-- 2.4 Sync Subscription (STANDARD - 0 USD)
SELECT id INTO default_plan_id
FROM public.subscription_plans
WHERE name = 'STANDARD'
LIMIT 1;
IF default_plan_id IS NOT NULL THEN
INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, expires_at)
VALUES (
        NEW.id,
        default_plan_id,
        'active',
        NOW(),
        NOW() + INTERVAL '365 days'
    ) ON CONFLICT (user_id) DO NOTHING;
END IF;
-- 2.5 Initialize Credits (5 Trial Credits)
INSERT INTO public.card_credits (user_id, amount)
VALUES (NEW.id, 5) ON CONFLICT (user_id) DO NOTHING;
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN -- Safety fallback to ensure Auth user is still created even if sync hits a snag
RAISE WARNING 'Sync Error for %: %',
NEW.id,
SQLERRM;
RETURN NEW;
END;
$$;
-- 3. APPLY TO AUTH.USERS
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 4. BACKFILL DATA FOR EXISTING USERS (Safety Net)
INSERT INTO public.users (id, email, username, full_name)
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
    COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (user_id, display_name, slug)
SELECT id,
    full_name,
    username
FROM public.users ON CONFLICT (user_id) DO NOTHING;
INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, expires_at)
SELECT u.id,
    p.id,
    'active',
    NOW(),
    NOW() + INTERVAL '365 days'
FROM public.users u,
    public.subscription_plans p
WHERE p.name = 'STANDARD' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO public.card_credits (user_id, amount)
SELECT id,
    5
FROM public.users ON CONFLICT (user_id) DO NOTHING;