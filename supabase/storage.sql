-- Run this in Supabase SQL Editor to enable Image Uploads
-- 1. Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true),
    ('covers', 'covers', true) ON CONFLICT (id) DO NOTHING;
-- 2. Set up security policies for Avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR
SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
CREATE POLICY "Users can update own avatar" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
-- 3. Set up security policies for Cover Images
CREATE POLICY "Cover images are publicly accessible" ON storage.objects FOR
SELECT USING (bucket_id = 'covers');
CREATE POLICY "Users can upload own cover" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'covers'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
CREATE POLICY "Users can update own cover" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'covers'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );