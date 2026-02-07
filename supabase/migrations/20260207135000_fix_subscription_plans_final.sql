-- =========================================================
-- TASK 17: FIX SUBSCRIPTION PLANS TRIỆT ĐỂ
-- CTO-GRADE CLEANUP + STANDARDIZATION
-- =========================================================
-- STEP 1: Delete Duplicate Plans
-- Delete duplicate STANDARD (keep a1787eec with more features)
DELETE FROM public.subscription_plans
WHERE id = 'ef59261c-fed4-421c-b99a-69a4290a6122';
-- Delete duplicate VIP (keep 76382bc5 with more features)
DELETE FROM public.subscription_plans
WHERE id = 'b823f41d-25c5-41b6-9b72-19b86e6d53e9';
-- STEP 2: Rename STANDARD → FREE and Update Features
UPDATE public.subscription_plans
SET name = 'FREE',
    price_usd = 0,
    price_vnd = 0,
    duration_days = 365,
    features = jsonb_build_object(
        'badge',
        null,
        'priority_display',
        false,
        'offer_quota_per_month',
        0,
        'can_receive_requests',
        true
    )
WHERE id = 'a1787eec-d604-4d93-a3ec-d6cb16fc705e';
-- STEP 3: Create STANDARD Plan (if not exists)
INSERT INTO public.subscription_plans (
        name,
        price_usd,
        price_vnd,
        duration_days,
        features,
        is_active
    )
SELECT 'STANDARD',
    15,
    365000,
    30,
    jsonb_build_object(
        'badge',
        null,
        'priority_display',
        false,
        'offer_quota_per_month',
        5,
        'can_receive_requests',
        true
    ),
    true
WHERE NOT EXISTS (
        SELECT 1
        FROM public.subscription_plans
        WHERE name = 'STANDARD'
    );
-- STEP 4: Update VIP Plan Features
UPDATE public.subscription_plans
SET price_usd = 23,
    price_vnd = 565000,
    duration_days = 30,
    features = jsonb_build_object(
        'badge',
        'VIP',
        'priority_display',
        true,
        'offer_quota_per_month',
        20,
        'can_receive_requests',
        true
    )
WHERE id = '76382bc5-2aec-4d87-b12b-9a231b038795';
-- STEP 5: Add UNIQUE Constraint on name
-- First check if constraint already exists
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'subscription_plans_name_unique'
) THEN
ALTER TABLE public.subscription_plans
ADD CONSTRAINT subscription_plans_name_unique UNIQUE (name);
END IF;
END $$;
-- STEP 6: Verification Queries (commented out - run manually)
-- SELECT id, name, price_vnd, duration_days, is_active, features
-- FROM public.subscription_plans
-- ORDER BY name;
-- SELECT name, count(*) 
-- FROM public.subscription_plans
-- GROUP BY name
-- HAVING count(*) > 1;