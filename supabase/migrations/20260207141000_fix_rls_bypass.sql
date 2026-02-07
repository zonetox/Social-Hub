-- =========================================================
-- TASK 18.2: FIX RLS PERMISSIONS FOR TRIGGER
-- =========================================================
-- 1. Ensure Function Owner is Postgres (Superuser)
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
-- 2. Grant USAGE on Schema to Authenticated / Anon (just in case)
GRANT USAGE ON SCHEMA public TO postgres,
    anon,
    authenticated,
    service_role;
-- 3. Grant ALL on Tables to Postgres
GRANT ALL ON TABLE public.users TO postgres;
GRANT ALL ON TABLE public.profiles TO postgres;
GRANT ALL ON TABLE public.user_subscriptions TO postgres;
GRANT ALL ON TABLE public.card_credits TO postgres;
GRANT ALL ON TABLE public.subscription_plans TO postgres;
-- 4. Create "Bypass RLS" Policies (Explicitly match TRIGGER context)
-- Note: Trigger runs as the user who initiated the action (auth.uid()) 
-- unless SECURITY DEFINER is used. With SECURITY DEFINER as postgres, 
-- it should bypass RLS, but if RLS is ENABLED, policies still apply 
-- to the table owner in some configurations.
-- Let's try a different approach:
-- Add a policy that always returns true for service_role/postgres
-- (although postgres bypasses RLS by default, this is a safety net)
DROP POLICY IF EXISTS "Service Role Bypass" ON public.users;
CREATE POLICY "Service Role Bypass" ON public.users FOR ALL USING (
    auth.role() = 'service_role'
    OR current_user = 'postgres'
);
DROP POLICY IF EXISTS "Service Role Bypass" ON public.profiles;
CREATE POLICY "Service Role Bypass" ON public.profiles FOR ALL USING (
    auth.role() = 'service_role'
    OR current_user = 'postgres'
);
DROP POLICY IF EXISTS "Service Role Bypass" ON public.user_subscriptions;
CREATE POLICY "Service Role Bypass" ON public.user_subscriptions FOR ALL USING (
    auth.role() = 'service_role'
    OR current_user = 'postgres'
);
DROP POLICY IF EXISTS "Service Role Bypass" ON public.card_credits;
CREATE POLICY "Service Role Bypass" ON public.card_credits FOR ALL USING (
    auth.role() = 'service_role'
    OR current_user = 'postgres'
);
-- 5. RE-APPLY policies for auth.uid (as creating user)
-- Since SECURITY DEFINER switches context to function owner (postgres),
-- auth.uid() might be null or behave differently in some contexts.
-- However, for auth trigger, we primarily rely on the fact that
-- postgres superuser bypasses RLS.
-- FORCE REPLICA IDENTITY (sometimes helps with trigger visibility)
ALTER TABLE public.users REPLICA IDENTITY FULL;