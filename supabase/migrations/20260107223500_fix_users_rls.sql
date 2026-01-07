-- Fix RLS policies for public.users to ensure users can always see themselves
DROP POLICY IF EXISTS "Users can view all active users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can do everything" ON public.users;
-- 1. View Policy: Users can see themselves OR any active user (for directory listings)
CREATE POLICY "Unified users view policy" ON public.users FOR
SELECT USING (
        auth.uid() = id -- Always allow viewing own record
        OR is_active = true -- Allow viewing other active users
        OR (
            EXISTS (
                SELECT 1
                FROM users
                WHERE users.id = auth.uid()
                    AND users.role = 'admin'
            )
        ) -- Admins see all
    );
-- 2. Update Policy: Users can update own bio/avatar
CREATE POLICY "Unified users update policy" ON public.users FOR
UPDATE USING (auth.uid() = id);
-- 3. Admin Policy: Full access for admins (handled partly by view above, but needed for DELETE/INSERT if applicable)
-- Actually, admins usually use service_role, but for dashboard operations:
CREATE POLICY "Unified users admin policy" ON public.users FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = auth.uid()
            AND users.role = 'admin'
    )
);