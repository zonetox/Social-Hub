-- SYNC AVATAR URL UPDATE
-- This migration updates the handle_new_user function to include avatar_url from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    auth AS $$
DECLARE final_username TEXT;
BEGIN -- Username base: lowcase email prefix + 4 chars from ID
final_username := LOWER(
    REGEXP_REPLACE(
        SPLIT_PART(NEW.email, '@', 1),
        '[^a-zA-Z0-9]',
        '',
        'g'
    )
) || '-' || SUBSTRING(NEW.id::text, 1, 4);
-- Insert/Update public.users
INSERT INTO public.users (
        id,
        email,
        username,
        full_name,
        role,
        is_active,
        avatar_url
    )
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
        TRUE,
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture'
        )
    ) ON CONFLICT (id) DO
UPDATE
SET email = EXCLUDED.email,
    full_name = CASE
        WHEN public.users.full_name = public.users.email THEN EXCLUDED.full_name
        ELSE public.users.full_name
    END,
    avatar_url = COALESCE(public.users.avatar_url, EXCLUDED.avatar_url);
-- Insert into public.profiles
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
WHEN OTHERS THEN RETURN NEW;
END;
$$;