-- SQL Migration: Standardize Profiles with Slugs
-- Description: Ensures all profiles have a valid slug based on their username if slug is missing.
-- 1. Ensure profile slugs are not null (fill with username if missing)
-- This is necessary because the public profile route now strictly uses 'slug'.
UPDATE profiles
SET slug = LOWER(REPLACE(u.username, ' ', '-'))
FROM users u
WHERE profiles.user_id = u.id
    AND (
        profiles.slug IS NULL
        OR profiles.slug = ''
    );
-- 2. Optional: Add a check constraint or trigger to prevent future empty slugs
-- (Depending on whether you want the backend to handle this automatically)
-- 3. Verify the view creator_cards_view still works correctly
-- (It should, as it already includes the slug column)
SELECT count(*)
FROM creator_cards_view
WHERE slug IS NULL;