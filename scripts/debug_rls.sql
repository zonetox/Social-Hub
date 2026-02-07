-- =========================================================
-- DEBUG: TEST TRIGGER & RLS
-- =========================================================
-- 1. Check Function Owner
SELECT n.nspname as schema,
    p.proname as function,
    r.rolname as owner
FROM pg_proc p
    JOIN pg_roles r ON r.oid = p.proowner
    JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'handle_new_user';
-- 2. Test Insert into public.users (Simulate Trigger)
DO $$
DECLARE test_id UUID := gen_random_uuid();
BEGIN -- Try to insert as postgres (should succeed)
INSERT INTO public.users (id, email, username, full_name, role, is_active)
VALUES (
        test_id,
        'debug-rls@test.com',
        'debug-rls',
        'Debug RLS',
        'user',
        TRUE
    );
RAISE NOTICE 'Insert public.users: SUCCESS';
-- Try to insert profile
INSERT INTO public.profiles (user_id, display_name, slug, is_public)
VALUES (test_id, 'Debug RLS', 'debug-rls', TRUE);
RAISE NOTICE 'Insert public.profiles: SUCCESS';
-- Cleanup
DELETE FROM public.users
WHERE id = test_id;
END $$;