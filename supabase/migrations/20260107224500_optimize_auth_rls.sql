-- Optimize RLS policies by forcing single evaluation of auth functions
-- and consolidating remaining overlapping policies.
-- ==================================================================
-- 1. PUBLIC.USERS
-- ==================================================================
DROP POLICY IF EXISTS "Unified users view policy" ON public.users;
DROP POLICY IF EXISTS "Unified users update policy" ON public.users;
DROP POLICY IF EXISTS "Unified users admin policy" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own record" ON public.users;
DROP POLICY IF EXISTS "Users can view all active users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
-- View: Self OR Active users OR Admin
CREATE POLICY "Optimized users view policy" ON public.users FOR
SELECT USING (
        id = (
            SELECT auth.uid()
        )
        OR is_active = true
        OR EXISTS (
            SELECT 1
            FROM public.users
            WHERE id = (
                    SELECT auth.uid()
                )
                AND role = 'admin'
        )
    );
-- Update: Self ONLY (Admins use separation of concern or another rule if needed, but usually admins use service_role for user management)
CREATE POLICY "Optimized users update policy" ON public.users FOR
UPDATE USING (
        id = (
            SELECT auth.uid()
        )
    );
-- Admin: Delete/Insert (if not covered by triggers)
CREATE POLICY "Optimized users admin manage policy" ON public.users FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = (
                SELECT auth.uid()
            )
            AND role = 'admin'
    )
);
-- ==================================================================
-- 2. PUBLIC.PROFILES
-- ==================================================================
DROP POLICY IF EXISTS "Unified profiles view policy" ON public.profiles;
DROP POLICY IF EXISTS "Unified profiles update policy" ON public.profiles;
CREATE POLICY "Optimized profiles view policy" ON public.profiles FOR
SELECT USING (
        is_public = true
        OR user_id = (
            SELECT auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.users
            WHERE id = (
                    SELECT auth.uid()
                )
                AND role = 'admin'
        )
    );
CREATE POLICY "Optimized profiles update policy" ON public.profiles FOR
UPDATE USING (
        user_id = (
            SELECT auth.uid()
        )
    );
CREATE POLICY "Optimized profiles insert policy" ON public.profiles FOR
INSERT WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
    );
-- ==================================================================
-- 3. PUBLIC.SOCIAL_ACCOUNTS
-- ==================================================================
DROP POLICY IF EXISTS "Unified social accounts view policy" ON public.social_accounts;
DROP POLICY IF EXISTS "Unified social accounts manage policy" ON public.social_accounts;
CREATE POLICY "Optimized social accounts view policy" ON public.social_accounts FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = social_accounts.profile_id
                AND (
                    profiles.is_public = true
                    OR profiles.user_id = (
                        SELECT auth.uid()
                    )
                )
        )
        OR (
            EXISTS (
                SELECT 1
                FROM users
                WHERE users.id = (
                        SELECT auth.uid()
                    )
                    AND users.role = 'admin'
            )
        )
    );
CREATE POLICY "Optimized social accounts manage policy" ON public.social_accounts FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = social_accounts.profile_id
            AND profiles.user_id = (
                SELECT auth.uid()
            )
    )
);
-- ==================================================================
-- 4. PUBLIC.ANALYTICS
-- ==================================================================
DROP POLICY IF EXISTS "Unified analytics view policy" ON public.analytics;
CREATE POLICY "Optimized analytics view policy" ON public.analytics FOR
SELECT USING (
        profile_id IN (
            SELECT id
            FROM profiles
            WHERE user_id = (
                    SELECT auth.uid()
                )
        )
        OR (
            EXISTS (
                SELECT 1
                FROM users
                WHERE users.id = (
                        SELECT auth.uid()
                    )
                    AND users.role = 'admin'
            )
        )
    );
-- ==================================================================
-- 5. PUBLIC.BANK_TRANSFER_INFO, SUBSCRIPTION_PLANS (Admin Managed)
-- ==================================================================
DROP POLICY IF EXISTS "Unified bank info manage policy" ON bank_transfer_info;
DROP POLICY IF EXISTS "Unified bank info view policy" ON bank_transfer_info;
CREATE POLICY "Optimized bank info view policy" ON bank_transfer_info FOR
SELECT USING (true);
CREATE POLICY "Optimized bank info manage policy" ON bank_transfer_info FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = (
                SELECT auth.uid()
            )
            AND users.role = 'admin'
    )
);
DROP POLICY IF EXISTS "Unified subscription plans manage policy" ON subscription_plans;
DROP POLICY IF EXISTS "Unified subscription plans view policy" ON subscription_plans;
CREATE POLICY "Optimized subscription plans view policy" ON subscription_plans FOR
SELECT USING (true);
CREATE POLICY "Optimized subscription plans manage policy" ON subscription_plans FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = (
                SELECT auth.uid()
            )
            AND users.role = 'admin'
    )
);