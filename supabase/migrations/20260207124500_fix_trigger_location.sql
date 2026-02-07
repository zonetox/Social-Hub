-- =========================================================
-- FINAL FIX: Correct Trigger Location (Force Replace)
-- =========================================================
-- 1. Drop ALL existing triggers (both locations)
DROP TRIGGER IF EXISTS on_auth_user_created ON public.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- 2. Drop legacy triggers
DROP TRIGGER IF EXISTS create_profile_on_user_creation ON public.users;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user();
-- 3. Recreate the function
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    auth AS $$
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
INSERT INTO public.users (id, email, username, full_name)
VALUES (
        NEW.id,
        NEW.email,
        final_username,
        SPLIT_PART(NEW.email, '@', 1)
    ) ON CONFLICT (id) DO
UPDATE
SET email = EXCLUDED.email;
INSERT INTO public.profiles (user_id, display_name, slug)
VALUES (
        NEW.id,
        SPLIT_PART(NEW.email, '@', 1),
        final_username
    ) ON CONFLICT (user_id) DO NOTHING;
SELECT id INTO default_plan_id
FROM public.subscription_plans
WHERE name = 'STANDARD'
LIMIT 1;
INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, expires_at)
VALUES (
        NEW.id,
        default_plan_id,
        'active',
        NOW(),
        NOW() + INTERVAL '365 days'
    ) ON CONFLICT (user_id) DO NOTHING;
INSERT INTO public.card_credits (user_id, amount)
VALUES (NEW.id, 5) ON CONFLICT (user_id) DO NOTHING;
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN RAISE WARNING 'Sync Error for %: %',
NEW.id,
SQLERRM;
RETURN NEW;
END;
$$;
-- 4. Create trigger on auth.users (CORRECT location)
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();