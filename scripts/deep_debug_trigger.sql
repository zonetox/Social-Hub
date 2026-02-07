-- =========================================================
-- DEEP DEBUG TRIGGER
-- =========================================================
-- Redefine trigger with excessive logging and partial commits (using debug table)
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id SERIAL PRIMARY KEY,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Grant access to debug logs
GRANT ALL ON TABLE public.debug_logs TO postgres,
    anon,
    authenticated,
    service_role;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public,
    auth AS $$
DECLARE final_username TEXT;
default_plan_id UUID;
default_duration INTEGER;
BEGIN
INSERT INTO public.debug_logs (message)
VALUES ('Trigger STARTED for ' || NEW.id);
-- Generate safe username
final_username := LOWER(
    REGEXP_REPLACE(
        SPLIT_PART(NEW.email, '@', 1),
        '[^a-zA-Z0-9]',
        '',
        'g'
    )
) || '-' || SUBSTRING(NEW.id::text, 1, 4);
INSERT INTO public.debug_logs (message)
VALUES ('Username generated: ' || final_username);
-- 1. Sync to public.users
BEGIN
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
INSERT INTO public.debug_logs (message)
VALUES ('public.users INSERT SUCCESS');
EXCEPTION
WHEN OTHERS THEN
INSERT INTO public.debug_logs (message)
VALUES ('public.users INSERT FAILED: ' || SQLERRM);
RAISE EXCEPTION 'Users insert failed: %',
SQLERRM;
END;
-- 2. Sync to public.profiles
BEGIN
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
INSERT INTO public.debug_logs (message)
VALUES ('public.profiles INSERT SUCCESS');
EXCEPTION
WHEN OTHERS THEN
INSERT INTO public.debug_logs (message)
VALUES ('public.profiles INSERT FAILED: ' || SQLERRM);
RAISE EXCEPTION 'Profiles insert failed: %',
SQLERRM;
END;
-- 3. Get FREE plan
SELECT id,
    duration_days INTO default_plan_id,
    default_duration
FROM public.subscription_plans
WHERE name = 'FREE'
    AND is_active = true
ORDER BY created_at DESC
LIMIT 1;
IF default_plan_id IS NULL THEN
INSERT INTO public.debug_logs (message)
VALUES ('FREE PLAN NOT FOUND');
RAISE EXCEPTION 'DEFAULT PLAN FREE NOT FOUND';
END IF;
INSERT INTO public.debug_logs (message)
VALUES ('Plan found: ' || default_plan_id);
-- 4. Sync subscription
BEGIN
INSERT INTO public.user_subscriptions (user_id, plan_id, status, starts_at, expires_at)
VALUES (
        NEW.id,
        default_plan_id,
        'active',
        NOW(),
        NOW() + (default_duration || ' days')::INTERVAL
    ) ON CONFLICT (user_id) DO NOTHING;
INSERT INTO public.debug_logs (message)
VALUES ('public.user_subscriptions INSERT SUCCESS');
EXCEPTION
WHEN OTHERS THEN
INSERT INTO public.debug_logs (message)
VALUES (
        'public.user_subscriptions INSERT FAILED: ' || SQLERRM
    );
RAISE EXCEPTION 'Subscriptions insert failed: %',
SQLERRM;
END;
-- 5. Initialize credits
BEGIN
INSERT INTO public.card_credits (user_id, amount)
VALUES (NEW.id, 0) ON CONFLICT (user_id) DO NOTHING;
INSERT INTO public.debug_logs (message)
VALUES ('public.card_credits INSERT SUCCESS');
EXCEPTION
WHEN OTHERS THEN
INSERT INTO public.debug_logs (message)
VALUES ('public.card_credits INSERT FAILED: ' || SQLERRM);
RAISE EXCEPTION 'Credits insert failed: %',
SQLERRM;
END;
RETURN NEW;
END;
$$;