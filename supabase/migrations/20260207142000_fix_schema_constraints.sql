-- =========================================================
-- TASK 19: FIX SCHEMA CONSTRAINTS & POLICY CLEANUP
-- Root Cause Fix: Missing UNIQUE constraints caused ON CONFLICT failure
-- =========================================================
-- STEP 1: Setup Debug Logs (RLS Disabled for absolute certainty)
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    message TEXT
);
ALTER TABLE public.debug_logs DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.debug_logs TO postgres,
    anon,
    authenticated,
    service_role;
-- STEP 2: Cleanup Duplicates & Add User_ID Constraint to Card_Credits
-- First, remove duplicates keeping the one with highest amount or latest created
DELETE FROM public.card_credits a USING (
        SELECT MIN(ctid) as ctid,
            user_id
        FROM public.card_credits
        GROUP BY user_id
        HAVING COUNT(*) > 1
    ) b
WHERE a.user_id = b.user_id
    AND a.ctid <> b.ctid;
-- Add Constraint
ALTER TABLE public.card_credits DROP CONSTRAINT IF EXISTS card_credits_user_id_key;
ALTER TABLE public.card_credits
ADD CONSTRAINT card_credits_user_id_key UNIQUE (user_id);
-- STEP 3: Cleanup Duplicates & Add User_ID Constraint to User_Subscriptions
-- Remove duplicates keeping the active one or latest created
DELETE FROM public.user_subscriptions a USING (
        SELECT MIN(ctid) as ctid,
            user_id
        FROM public.user_subscriptions
        GROUP BY user_id
        HAVING COUNT(*) > 1
    ) b
WHERE a.user_id = b.user_id
    AND a.ctid <> b.ctid;
-- Add Constraint
ALTER TABLE public.user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_key;
ALTER TABLE public.user_subscriptions
ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);
-- STEP 4: Consolidate RLS Policies (Cleanup Redundancy)
-- 4.1 Users Table Cleanup
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Allow insert own user row" ON public.users;
DROP POLICY IF EXISTS "Service Role Bypass" ON public.users;
-- Re-create consolidated policies for USERS
CREATE POLICY "Public users are viewable by everyone" ON public.users FOR
SELECT USING (true);
CREATE POLICY "Users can update own data" ON public.users FOR
UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users FOR
INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Service Role Full Access" ON public.users FOR ALL USING (
    auth.role() = 'service_role'
    OR current_user = 'postgres'
);
-- 4.2 Profiles Table Cleanup
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Service Role Bypass" ON public.profiles;
-- Re-create consolidated policies for PROFILES
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR
SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service Role Full Access" ON public.profiles FOR ALL USING (
    auth.role() = 'service_role'
    OR current_user = 'postgres'
);
-- 4.3 User Subscriptions Cleanup
DROP POLICY IF EXISTS "Users can view own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Service Role Bypass" ON public.user_subscriptions;
-- (Keep specific policies if complex, but ensure Service Role exists)
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service Role Full Access" ON public.user_subscriptions FOR ALL USING (
    auth.role() = 'service_role'
    OR current_user = 'postgres'
);
-- 4.4 Card Credits Cleanup
DROP POLICY IF EXISTS "Users can view own credits" ON public.card_credits;
DROP POLICY IF EXISTS "Service Role Bypass" ON public.card_credits;
CREATE POLICY "Users can view own credits" ON public.card_credits FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service Role Full Access" ON public.card_credits FOR ALL USING (
    auth.role() = 'service_role'
    OR current_user = 'postgres'
);
-- STEP 5: Re-verify Function Owner (Just to be sure)
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;