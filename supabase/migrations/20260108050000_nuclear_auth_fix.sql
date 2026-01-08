-- NUCLEAR AUTH FIX v2.0 - ARCHITECTED FOR SCALE
-- Đây là bản vá căn cơ nhất để đảm bảo hệ thống vận hành trơn tru cho hàng ngàn người dùng.
-- 1. TỐI ƯU HÓA CHỈ MỤC (INDEXING) - Speed up lookups for thousands of records
CREATE INDEX IF NOT EXISTS idx_users_id_idp ON public.users(id);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_idp ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_slug_idp ON public.profiles(slug);
-- 2. GIA CỐ HÀM ĐỒNG BỘ (TRIGGER FUNCTION)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,
    auth AS $$
DECLARE username_base TEXT;
final_username TEXT;
exist_count INTEGER;
BEGIN -- Tránh vòng lặp hoặc chạy thừa
IF NEW.id IS NULL THEN RETURN NEW;
END IF;
-- Tạo username sạch
username_base := LOWER(
    REGEXP_REPLACE(
        SPLIT_PART(NEW.email, '@', 1),
        '[^a-zA-Z0-9]',
        '',
        'g'
    )
);
-- Nếu email quá ngắn hoặc lỗi, dùng 8 ký tự đầu của ID
IF LENGTH(username_base) < 2 THEN username_base := SUBSTRING(NEW.id::text, 1, 8);
END IF;
final_username := username_base || '-' || SUBSTRING(NEW.id::text, 1, 4);
-- Đảm bảo có User record (UPSERT)
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
    full_name = CASE
        WHEN public.users.full_name = public.users.email THEN EXCLUDED.full_name
        ELSE public.users.full_name
    END;
-- Đảm bảo có Profile record (UPSERT)
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
WHEN OTHERS THEN -- Ghi nhận lỗi vào Postgres logs để debug trên Supabase Dashboard
RAISE WARNING 'Error in handle_new_user for %: %',
NEW.id,
SQLERRM;
RETURN NEW;
END;
$$;
-- 3. TỐI ƯU HÓA RLS (Dùng InitPlan pattern)
-- Điều này cực kỳ quan trọng để không bị chậm khi có nhiều dữ liệu
DO $$ BEGIN -- Users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Optimized users view policy" ON public.users;
DROP POLICY IF EXISTS "Optimized users update policy" ON public.users;
CREATE POLICY "Users view policy v2" ON public.users FOR
SELECT USING (
        is_active = true
        OR id = (
            SELECT auth.uid()
        )
    );
CREATE POLICY "Users update policy v2" ON public.users FOR
UPDATE USING (
        id = (
            SELECT auth.uid()
        )
    );
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- Profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own private profile" ON public.profiles;
CREATE POLICY "Profiles view policy v2" ON public.profiles FOR
SELECT USING (
        is_public = true
        OR user_id = (
            SELECT auth.uid()
        )
    );
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
END $$;
-- 4. CLEANUP & SYNC
INSERT INTO public.users (id, email, username, full_name, role, is_active)
SELECT id,
    email,
    LOWER(
        REGEXP_REPLACE(
            SPLIT_PART(email, '@', 1),
            '[^a-zA-Z0-9]',
            '',
            'g'
        )
    ) || '-' || SUBSTRING(id::text, 1, 4),
    COALESCE(raw_user_meta_data->>'full_name', email),
    'user',
    TRUE
FROM auth.users ON CONFLICT (id) DO NOTHING;
INSERT INTO public.profiles (user_id, display_name, slug)
SELECT id,
    full_name,
    username
FROM public.users ON CONFLICT (user_id) DO NOTHING;