-- =========================================================
-- CLEANUP DUPLICATE SUBSCRIPTION PLANS
-- =========================================================
-- Step 1: Delete duplicate STANDARD plans (keep the one with more features)
DELETE FROM public.subscription_plans
WHERE id = 'ef59261c-fed4-421c-b99a-69a4290a6122';
-- This one has fewer features, we keep a1787eec-d604-4d93-a3ec-d6cb16fc705e
-- Step 2: Delete duplicate VIP plans (keep the one with more features)
DELETE FROM public.subscription_plans
WHERE id = 'b823f41d-25c5-41b6-9b72-19b86e6d53e9';
-- This one has fewer features, we keep 76382bc5-2aec-4d87-b12b-9a231b038795
-- Step 3: Update STANDARD plan to correct FREE tier specs (0 quotas)
UPDATE public.subscription_plans
SET features = jsonb_build_object(
        'badge',
        null,
        'priority_display',
        false,
        'can_receive_requests',
        false,
        'offer_quota_per_month',
        0,
        'request_quota_per_month',
        0
    )
WHERE name = 'STANDARD';
-- Step 4: Add UNIQUE constraint on name to prevent future duplicates
ALTER TABLE public.subscription_plans
ADD CONSTRAINT subscription_plans_name_unique UNIQUE (name);
-- Step 5: Verify cleanup
-- SELECT * FROM public.subscription_plans ORDER BY name;