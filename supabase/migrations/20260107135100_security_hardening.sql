-- Security Hardening: Restrict Analytics INSERT policy
-- Current policy "Anyone can insert analytics" is too permissive
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;
DROP POLICY IF EXISTS "Restricted analytics insertion" ON public.analytics;
-- New policy: Only allow insertion if the profile_id belongs to an existing public profile
-- This validates the input and prevents spamming non-existent or private profiles.
CREATE POLICY "Restricted analytics insertion" ON public.analytics FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = profile_id
                AND is_public = TRUE
        )
    );
-- Log this security improvement
COMMENT ON POLICY "Restricted analytics insertion" ON public.analytics IS 'Ensures analytics only recorded for valid public profiles.';