-- ROBUST AUTH SYNC (DB LEVEL)
-- Ensures every user has a Profile, a Standard Subscription, and a Credits record.
-- 1. Update the Atomic Sync Function
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    auth AS $$
DECLARE final_username TEXT;
standard_plan_id UUID;
BEGIN -- Username base: lowcase email prefix + 4 chars from ID
final_username := LOWER(
    REGEXP_REPLACE(
        SPLIT_PART(NEW.email, '@', 1),
        '[^a-zA-Z0-9]',
        '',
        'g'
    )
) || '-' || SUBSTRING(NEW.id::text, 1, 4);
-- 1. Insert/Update public.users
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
SET email = EXCLUDED.email;
-- 2. Insert into public.profiles
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
-- 3. Get STANDARD plan ID
SELECT id INTO standard_plan_id
FROM public.subscription_plans
WHERE name = 'STANDARD'
LIMIT 1;
-- 4. Auto-create Standard Subscription if missing
IF standard_plan_id IS NOT NULL THEN
INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, expires_at)
VALUES (
        NEW.id,
        standard_plan_id,
        'active',
        NOW(),
        NOW() + INTERVAL '365 days'
    ) ON CONFLICT (user_id) DO NOTHING;
END IF;
-- 5. Auto-create Card Credits (initial 0)
INSERT INTO public.card_credits (user_id, amount)
VALUES (NEW.id, 0) ON CONFLICT (user_id) DO NOTHING;
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN RETURN NEW;
END;
$$;
-- 2. Sync Existing Users who might be missing records
DO $$
DECLARE u RECORD;
plan_id UUID;
BEGIN
SELECT id INTO plan_id
FROM public.subscription_plans
WHERE name = 'STANDARD'
LIMIT 1;
FOR u IN
SELECT id,
    email
FROM public.users LOOP -- Profile
INSERT INTO public.profiles (user_id, display_name, slug)
VALUES (
        u.id,
        SPLIT_PART(u.email, '@', 1),
        SPLIT_PART(u.email, '@', 1) || '-' || SUBSTRING(u.id::text, 1, 4)
    ) ON CONFLICT (user_id) DO NOTHING;
-- Subscription
IF plan_id IS NOT NULL THEN -- Check if user already has an active subscription
IF NOT EXISTS (
    SELECT 1
    FROM public.user_subscriptions
    WHERE user_id = u.id
        AND status = 'active'
) THEN
INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, expires_at)
VALUES (
        u.id,
        plan_id,
        'active',
        NOW(),
        NOW() + INTERVAL '365 days'
    );
END IF;
END IF;
-- Credits
IF NOT EXISTS (
    SELECT 1
    FROM public.card_credits
    WHERE user_id = u.id
) THEN
INSERT INTO public.card_credits (user_id, amount)
VALUES (u.id, 0);
END IF;
END LOOP;
END $$;