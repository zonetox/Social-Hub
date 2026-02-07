-- =========================================================
-- CLEANUP LEGACY PLANS (Annual Membership + Lifetime)
-- =========================================================
-- Delete Annual Membership plan
DELETE FROM public.subscription_plans
WHERE id = '66cc4b32-909f-4e82-a127-1d52b67724ba';
-- Delete Lifetime plan
DELETE FROM public.subscription_plans
WHERE id = 'a315f2bc-038e-44bf-a696-a5ef6f524b4c';
-- Verification: Should only have 3 plans (FREE, STANDARD, VIP)
-- SELECT id, name, price_vnd, duration_days, features
-- FROM public.subscription_plans
-- ORDER BY name;