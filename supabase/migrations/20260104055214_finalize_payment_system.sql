-- Update VND pricing to 20,000 VNĐ for better conversion
UPDATE public.subscription_plans
SET price_vnd = 20000
WHERE name = 'Annual Membership';
-- Set payment-proofs bucket to private for security
UPDATE storage.buckets
SET public = false
WHERE id = 'payment-proofs';
-- Refine Storage Policies
DROP POLICY IF EXISTS "Payment proofs are accessible by owner and admins" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own payment proof" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own payment proof" ON storage.objects;
CREATE POLICY "Users can upload own payment proofs" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'payment-proofs'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
CREATE POLICY "Users can view own payment proofs" ON storage.objects FOR
SELECT USING (
        bucket_id = 'payment-proofs'
        AND (
            auth.uid()::text = (storage.foldername(name)) [1]
            OR public.is_admin()
        )
    );
CREATE POLICY "Admins can manage all payment proofs" ON storage.objects FOR ALL USING (
    bucket_id = 'payment-proofs'
    AND public.is_admin()
);