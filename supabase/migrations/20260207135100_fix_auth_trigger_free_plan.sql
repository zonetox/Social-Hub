-- =========================================================
-- FIX AUTH TRIGGER - ASSIGN FREE PLAN BY DEFAULT
-- =========================================================
-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Recreate trigger function with FREE plan logic
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
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
-- 3. Sync subscription (FREE plan - deterministic query)
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
INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, expires_at)
VALUES (
        NEW.id,
        default_plan_id,
        'active',
        NOW(),
        NOW() + (default_duration || ' days')::INTERVAL
    ) ON CONFLICT (user_id) DO NOTHING;
-- 4. Initialize credits (0 for FREE tier)
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
-- Attach trigger to auth.users
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();