-- OPTIMIZE DATABASE PER LINTER RECOMMENDATIONS
-- 1. FIX SECURITY: Set fixed search_path for sensitive functions
-- Preventing "role mutable search_path" warning
ALTER FUNCTION public.handle_new_user()
SET search_path = public;
ALTER FUNCTION public.create_profile_for_new_user()
SET search_path = public;
-- 2. FIX PERFORMANCE & REDUNDANCY: Consolidate and Optimize RLS Policies for "users" table
-- Dropping all redundant and sub-optimal policies
DROP POLICY IF EXISTS "Anyone can view active users" ON public.users;
DROP POLICY IF EXISTS "Optimized users view policy" ON public.users;
DROP POLICY IF EXISTS "Users can edit own record" ON public.users;
DROP POLICY IF EXISTS "Optimized users update policy" ON public.users;
DROP POLICY IF EXISTS "Unified users view policy" ON public.users;
DROP POLICY IF EXISTS "Unified users update policy" ON public.users;
DROP POLICY IF EXISTS "Admins can do everything" ON public.users;
-- Re-create consolidated and optimized policies
-- Using (select auth.uid()) instead of auth.uid() for performance (InitPlan optimization)
-- Policy: Everyone can view active creators/users
CREATE POLICY "Optimized users view policy" ON public.users FOR
SELECT USING (
        is_active = true
        OR (
            id = (
                select auth.uid()
            )
        )
    );
-- Policy: Users can only update their own record
CREATE POLICY "Optimized users update policy" ON public.users FOR
UPDATE USING (
        (
            id = (
                select auth.uid()
            )
        )
    ) WITH CHECK (
        (
            id = (
                select auth.uid()
            )
        )
    );
-- 3. NOTE: Leaked Password Protection (Linter Auth warning)
-- This is a dashboard toggle and cannot be enabled via SQL migration.
-- Recommendation: Enable via Supabase Dashboard > Auth > Password Protection.