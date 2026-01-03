-- Run this in Supabase SQL Editor
-- Function to increment profile views
CREATE OR REPLACE FUNCTION increment_profile_views(profile_id UUID) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
UPDATE profiles
SET view_count = view_count + 1
WHERE id = profile_id;
END;
$$;
-- Function to increment social account clicks
CREATE OR REPLACE FUNCTION increment_social_click(account_id UUID) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
UPDATE social_accounts
SET click_count = click_count + 1
WHERE id = account_id;
END;
$$;