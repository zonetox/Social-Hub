-- 20240104160000_analytics_optimization.sql
-- 1. Tối ưu hóa RLS cho bảng Analytics (Hiệu năng & Hợp nhất chính sách)
-- Xóa các chính sách SELECT cũ
DROP POLICY IF EXISTS "Profile owners can view own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.analytics;
-- Tạo chính sách gộp duy nhất cho SELECT để tối ưu hiệu năng
-- Sử dụng (SELECT auth.uid()) để tránh re-evaluation trên từng dòng
CREATE POLICY "Analytics view policy" ON public.analytics FOR
SELECT TO authenticated USING (
        (
            SELECT auth.uid()
        ) IN (
            SELECT u.id
            FROM public.users u
            WHERE u.role = 'admin'
            UNION ALL
            SELECT p.user_id
            FROM public.profiles p
            WHERE p.id = analytics.profile_id
        )
    );
-- 2. Tối ưu hóa RLS cho các bảng khác (Good Practice)
-- Users table update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR
UPDATE USING (
        (
            SELECT auth.uid()
        ) = id
    );
-- Profiles table view policy
DROP POLICY IF EXISTS "Users can view own private profile" ON public.profiles;
CREATE POLICY "Users can view own private profile" ON public.profiles FOR
SELECT USING (
        is_public = TRUE
        OR user_id = (
            SELECT auth.uid()
        )
    );
-- 3. Thiết lập Storage Buckets cho Avatars và Banner
-- Đảm bảo bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true) ON CONFLICT (id) DO NOTHING;
-- Storage policies cho Avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND (
            SELECT auth.uid()
        )::text = (storage.foldername(name)) [1]
    );
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'avatars'
        AND (
            SELECT auth.uid()
        )::text = (storage.foldername(name)) [1]
    );
-- Storage policies cho Covers (Banner)
DROP POLICY IF EXISTS "Cover images are publicly accessible" ON storage.objects;
CREATE POLICY "Cover images are publicly accessible" ON storage.objects FOR
SELECT USING (bucket_id = 'covers');
DROP POLICY IF EXISTS "Users can upload own cover" ON storage.objects;
CREATE POLICY "Users can upload own cover" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'covers'
        AND (
            SELECT auth.uid()
        )::text = (storage.foldername(name)) [1]
    );
DROP POLICY IF EXISTS "Users can update own cover" ON storage.objects;
CREATE POLICY "Users can update own cover" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'covers'
        AND (
            SELECT auth.uid()
        )::text = (storage.foldername(name)) [1]
    );