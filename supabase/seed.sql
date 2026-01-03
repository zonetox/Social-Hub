-- Insert admin user (you'll need to create this user in Supabase Auth first)
-- Then get the UUID and use it here
-- Sample admin user
-- INSERT INTO public.users (id, email, username, full_name, role, is_verified)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000', -- Replace with actual auth.users UUID
--   'admin@socialhub.com',
--   'admin',
--   'System Administrator',
--   'admin',
--   true
-- );
-- Sample users
INSERT INTO public.users (id, email, username, full_name, bio, is_verified)
VALUES (
        gen_random_uuid(),
        'john@example.com',
        'johndoe',
        'John Doe',
        'Content creator & influencer',
        true
    ),
    (
        gen_random_uuid(),
        'jane@example.com',
        'janesmith',
        'Jane Smith',
        'Digital marketer',
        true
    ),
    (
        gen_random_uuid(),
        'alex@example.com',
        'alexchen',
        'Alex Chen',
        'Tech enthusiast',
        false
    );