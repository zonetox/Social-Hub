-- =========================================================
-- TASK 19: FIX SIGNUP DATABASE ERROR (AUTH TRIGGER)
-- CTO-GRADE FIX - Based on diagnostic analysis
-- =========================================================
-- STEP 1: Remove ALL existing triggers (cleanup)
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_user_creation ON public.users;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user();
-- STEP 2: Ensure STANDARD plan exists (prevent NULL crash)
INSERT INTO public.subscription_plans (
        name,
        price_usd,
        price_vnd,
        duration_days,
        features,
        is_active
    )
SELECT 'STANDARD',
    0,
    0,
    365,
    '{"badge": null, "priority_display": false, "can_receive_requests": false, "offer_quota_per_month": 0, "request_quota_per_month": 0}'::jsonb,
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM public.subscription_plans
        WHERE name = 'STANDARD'
    );
-- STEP 3: Create the corrected trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE final_username TEXT;
default_plan_id UUID;
BEGIN -- Generate safe username
final_username := LOWER(
    REGEXP_REPLACE(
        SPLIT_PART(NEW.email, '@', 1),
        '[^a-zA-Z0-9]',
        '',
        'g'
    )
) || '-' || SUBSTRING(NEW.id::text, 1, 4);
-- 1. Sync to public.users
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
-- 2. Sync to public.profiles
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
-- 3. Sync subscription (with NULL safety)
SELECT id INTO default_plan_id
FROM public.subscription_plans
WHERE name = 'STANDARD'
LIMIT 1;
IF default_plan_id IS NULL THEN RAISE WARNING 'STANDARD plan not found for user %. Skipping subscription creation.',
NEW.id;
ELSE
INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, expires_at)
VALUES (
        NEW.id,
        default_plan_id,
        'active',
        NOW(),
        NOW() + INTERVAL '365 days'
    ) ON CONFLICT (user_id) DO NOTHING;
END IF;
-- 4. Initialize credits (0 for FREE tier - correct business logic)
INSERT INTO public.card_credits (user_id, amount)
VALUES (NEW.id, 0) ON CONFLICT (user_id) DO NOTHING;
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN -- Log error but don't block user creation
RAISE WARNING 'Sync Error for user %: % (SQLSTATE: %)',
NEW.id,
SQLERRM,
SQLSTATE;
RETURN NEW;
END;
$$;
-- STEP 4: Attach trigger to CORRECT table (auth.users)
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- STEP 5: Backfill existing users (safety net)
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
    COALESCE(
        raw_user_meta_data->>'full_name',
        SPLIT_PART(email, '@', 1)
    ),
    'user',
    TRUE
FROM auth.users ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (user_id, display_name, slug, is_public)
SELECT id,
    full_name,
    username,
    TRUE
FROM public.users ON CONFLICT (user_id) DO NOTHING;
INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, expires_at)
SELECT u.id,
    p.id,
    'active',
    NOW(),
    NOW() + INTERVAL '365 days'
FROM public.users u
    CROSS JOIN public.subscription_plans p
WHERE p.name = 'STANDARD' ON CONFLICT (user_id) DO NOTHING;
INSERT INTO public.card_credits (user_id, amount)
SELECT id,
    0
FROM public.users ON CONFLICT (user_id) DO NOTHING;
-- STEP 6: Verification query (run this after to confirm)
-- SELECT event_object_schema, event_object_table, trigger_name
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';
-- Expected: event_object_schema = 'auth', event_object_table = 'users'