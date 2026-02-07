-- =========================================================
-- TASK 18: PRODUCTION-GRADE AUTH TRIGGER FIX
-- No Silent Fail + RLS Safe + Fail Fast
-- =========================================================
-- STEP 1: Disable Legacy Plans (keep only FREE/STANDARD/VIP active)
UPDATE public.subscription_plans
SET is_active = false
WHERE name IN ('Annual Membership', 'Lifetime');
-- Verify only 3 active plans
-- SELECT name, is_active FROM public.subscription_plans ORDER BY name;
-- STEP 2: Fix Trigger Function - NO SILENT FAIL
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public,
    auth AS $$
DECLARE final_username TEXT;
default_plan_id UUID;
default_duration INTEGER;
BEGIN -- Generate safe username
final_username := LOWER(
    REGEXP_REPLACE(
        SPLIT_PART(NEW.email, '@', 1),
        '[^a-zA-Z0-9]',
        '',
        'g'
    )
) || '-' || SUBSTRING(NEW.id::text, 1, 4);
-- 1. Sync to public.users (MUST succeed)
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
-- 2. Sync to public.profiles (MUST succeed)
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
-- 3. Get FREE plan (FAIL FAST if not found)
SELECT id,
    duration_days INTO default_plan_id,
    default_duration
FROM public.subscription_plans
WHERE name = 'FREE'
    AND is_active = true
ORDER BY created_at DESC
LIMIT 1;
IF default_plan_id IS NULL THEN RAISE EXCEPTION 'DEFAULT PLAN FREE NOT FOUND';
END IF;
-- 4. Sync subscription (MUST succeed)
INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, expires_at)
VALUES (
        NEW.id,
        default_plan_id,
        'active',
        NOW(),
        NOW() + (default_duration || ' days')::INTERVAL
    ) ON CONFLICT (user_id) DO NOTHING;
-- 5. Initialize credits (MUST succeed)
INSERT INTO public.card_credits (user_id, amount)
VALUES (NEW.id, 0) ON CONFLICT (user_id) DO NOTHING;
RETURN NEW;
-- NO EXCEPTION HANDLER - Let it fail fast!
END;
$$;
-- STEP 3: Set correct owner and permissions
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
-- STEP 4: Attach trigger to auth.users
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- STEP 5: Add RLS Policies for Trigger Inserts
-- Policy for users table
DROP POLICY IF EXISTS "Allow insert own user row" ON public.users;
CREATE POLICY "Allow insert own user row" ON public.users FOR
INSERT WITH CHECK (id = auth.uid());
-- Policy for profiles table
DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
CREATE POLICY "Allow insert own profile" ON public.profiles FOR
INSERT WITH CHECK (user_id = auth.uid());
-- Policy for user_subscriptions table
DROP POLICY IF EXISTS "Allow insert own subscription" ON public.user_subscriptions;
CREATE POLICY "Allow insert own subscription" ON public.user_subscriptions FOR
INSERT WITH CHECK (user_id = auth.uid());
-- Policy for card_credits table
DROP POLICY IF EXISTS "Allow insert own credits" ON public.card_credits;
CREATE POLICY "Allow insert own credits" ON public.card_credits FOR
INSERT WITH CHECK (user_id = auth.uid());
-- STEP 6: Verification Queries (run manually after)
-- SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname = 'on_auth_user_created';
-- SELECT pg_get_functiondef('public.handle_new_user'::regproc);