-- NUCLEAR FIX FOR PROFILE NOT FOUND & AUTH SYNC ISSUES
-- Chạy toàn bộ mã này trong Supabase SQL Editor để sửa triệt để lỗi đồng bộ người dùng.
-- 1. Xóa các trigger cũ để tránh xung đột
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_user_creation ON public.users;
-- 2. Hàm đồng bộ User từ Auth sang Public (Cực kỳ bền bỉ)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE username_base TEXT;
final_username TEXT;
BEGIN -- Tạo username cơ bản từ email
username_base := LOWER(
    REGEXP_REPLACE(
        SPLIT_PART(NEW.email, '@', 1),
        '[^a-zA-Z0-9]',
        '-',
        'g'
    )
);
final_username := username_base || '-' || SUBSTRING(NEW.id::text, 1, 4);
-- Insert vào public.users
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
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
-- Tự động tạo Profile ngay lập tức trong cùng 1 transaction để đảm bảo tính nhất quán
INSERT INTO public.profiles (user_id, display_name, slug)
VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        final_username
    ) ON CONFLICT (user_id) DO NOTHING;
RETURN NEW;
END;
$$;
-- 3. Cài đặt lại Trigger trên auth.users
CREATE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 4. ĐỒNG BỘ CƯỠNG BỨC (Cứu dữ liệu hiện tại)
-- Đưa toàn bộ user từ auth sang public nếu lỡ bị thiếu
INSERT INTO public.users (id, email, username, full_name, role, is_active)
SELECT id,
    email,
    LOWER(
        REGEXP_REPLACE(
            SPLIT_PART(email, '@', 1),
            '[^a-zA-Z0-9]',
            '-',
            'g'
        )
    ) || '-' || SUBSTRING(id::text, 1, 4),
    COALESCE(
        raw_user_meta_data->>'full_name',
        SPLIT_PART(email, '@', 1)
    ),
    COALESCE(raw_user_meta_data->>'role', 'user'),
    TRUE
FROM auth.users ON CONFLICT (id) DO NOTHING;
-- Đưa toàn bộ profile thiếu vào bảng profiles
INSERT INTO public.profiles (user_id, display_name, slug)
SELECT id,
    full_name,
    username
FROM public.users ON CONFLICT (user_id) DO NOTHING;
-- 5. Cấp quyền truy cập cho role authenticated (Đảm bảo RLS không chặn)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;