-- =========================================================
-- SIMPLIFIED AUTH TRIGGER FIX (No Backfill)
-- =========================================================
-- 1. Cleanup
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_user_creation ON public.users;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user();
-- 2. Ensure STANDARD plan exists
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
    '{"offer_quota_per_month": 0, "request_quota_per_month": 0}'::jsonb,
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM public.subscription_plans
        WHERE name = 'STANDARD'
    );
-- 3. Create trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE final_username TEXT;
default_plan_id UUID;
BEGIN final_username := LOWER(
    REGEXP_REPLACE(
        SPLIT_PART(NEW.email, '@', 1),
        '[^a-zA-Z0-9]',
        '',
        'g'
    )
) || '-' || SUBSTRING(NEW.id::text, 1, 4);
-- Sync users (has UNIQUE constraint on id)
INSERT INTO public.users (id, email, username, full_name, role, is_active)
VALUES (
        NEW.id,
        NEW.email,
        final_username,
        SPLIT_PART(NEW.email, '@', 1),
        'user',
        TRUE
    ) ON CONFLICT (id) DO
UPDATE
SET email = EXCLUDED.email;
-- Sync profiles (has UNIQUE constraint on user_id)
INSERT INTO public.profiles (user_id, display_name, slug, is_public)
VALUES (
        NEW.id,
        SPLIT_PART(NEW.email, '@', 1),
        final_username,
        TRUE
    ) ON CONFLICT (user_id) DO NOTHING;
-- Sync subscription (has UNIQUE constraint on user_id)
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
-- Sync credits (has UNIQUE constraint on user_id)
INSERT INTO public.card_credits (user_id, amount)
VALUES (NEW.id, 0) ON CONFLICT (user_id) DO NOTHING;
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN RAISE WARNING 'Sync Error for %: %',
NEW.id,
SQLERRM;
RETURN NEW;
END;
$$;
-- 4. Attach trigger to auth.users
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();