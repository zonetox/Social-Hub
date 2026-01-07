-- Resolve RLS policy conflicts by splitting ALL policies into specific actions
-- and removing legacy policies that overlap with optimized ones.
-- ==================================================================
-- 1. BANK_TRANSFER_INFO
-- ==================================================================
DROP POLICY IF EXISTS "Optimized bank info manage policy" ON bank_transfer_info;
-- Split into modification-only (SELECT is covered by "Optimized bank info view policy")
CREATE POLICY "Optimized bank info manage policy" ON bank_transfer_info FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM users
            WHERE users.id = (
                    SELECT auth.uid()
                )
                AND users.role = 'admin'
        )
    );
CREATE POLICY "Optimized bank info update policy" ON bank_transfer_info FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM users
            WHERE users.id = (
                    SELECT auth.uid()
                )
                AND users.role = 'admin'
        )
    );
CREATE POLICY "Optimized bank info delete policy" ON bank_transfer_info FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = (
                SELECT auth.uid()
            )
            AND users.role = 'admin'
    )
);
-- ==================================================================
-- 2. SUBSCRIPTION_PLANS
-- ==================================================================
DROP POLICY IF EXISTS "Optimized subscription plans manage policy" ON subscription_plans;
CREATE POLICY "Optimized subscription plans insert policy" ON subscription_plans FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM users
            WHERE users.id = (
                    SELECT auth.uid()
                )
                AND users.role = 'admin'
        )
    );
CREATE POLICY "Optimized subscription plans update policy" ON subscription_plans FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM users
            WHERE users.id = (
                    SELECT auth.uid()
                )
                AND users.role = 'admin'
        )
    );
CREATE POLICY "Optimized subscription plans delete policy" ON subscription_plans FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = (
                SELECT auth.uid()
            )
            AND users.role = 'admin'
    )
);
-- ==================================================================
-- 3. PROFILES - Remove Legacy Policies
-- ==================================================================
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
-- ==================================================================
-- 4. SOCIAL_ACCOUNTS - Split ALL into specific actions
-- ==================================================================
DROP POLICY IF EXISTS "Optimized social accounts manage policy" ON public.social_accounts;
CREATE POLICY "Optimized social accounts insert policy" ON public.social_accounts FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = social_accounts.profile_id
                AND profiles.user_id = (
                    SELECT auth.uid()
                )
        )
    );
CREATE POLICY "Optimized social accounts update policy" ON public.social_accounts FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = social_accounts.profile_id
                AND profiles.user_id = (
                    SELECT auth.uid()
                )
        )
    );
CREATE POLICY "Optimized social accounts delete policy" ON public.social_accounts FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = social_accounts.profile_id
            AND profiles.user_id = (
                SELECT auth.uid()
            )
    )
);