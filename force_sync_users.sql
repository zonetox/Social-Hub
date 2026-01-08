-- FORCE SYNC USERS AND PROFILES
-- Chạy đoạn mã này nếu bạn gặp lỗi "Hồ sơ không tìm thấy" sau khi đăng nhập.
-- Nó sẽ ép kiểu đồng bộ tất cả người dùng từ Supabase Auth sang bảng public.users và public.profiles.
-- 1. Đồng bộ bảng users
INSERT INTO public.users (id, email, full_name, role, is_active)
SELECT id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', email),
    COALESCE(raw_user_meta_data->>'role', 'user'),
    true
FROM auth.users ON CONFLICT (id) DO
UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
-- 2. Đồng bộ bảng profiles
INSERT INTO public.profiles (user_id, full_name, username)
SELECT id,
    full_name,
    LOWER(
        REGEXP_REPLACE(
            SPLIT_PART(email, '@', 1),
            '[^a-zA-Z0-9]',
            '-',
            'g'
        )
    ) || '-' || SUBSTRING(id::text, 1, 4)
FROM public.users ON CONFLICT (user_id) DO NOTHING;
-- 3. Đảm bảo Admin (Nếu bạn là admin và bị mất quyền, hãy sửa email dưới đây)
-- UPDATE public.users SET role = 'admin' WHERE email = 'YOUR_ADMIN_EMAIL@example.com';