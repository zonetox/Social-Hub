-- Consolidate policies for analytics
DROP POLICY IF EXISTS "Analytics access policy" ON analytics;
DROP POLICY IF EXISTS "Analytics view policy" ON analytics;
DROP POLICY IF EXISTS "Admins can view all analytics" ON analytics;
CREATE POLICY "Unified analytics view policy" ON analytics FOR
SELECT USING (
        (auth.uid() = profile_id)
        OR (
            EXISTS (
                SELECT 1
                FROM users
                WHERE users.id = auth.uid()
                    AND users.role = 'admin'
            )
        )
    );
-- Consolidate policies for bank_transfer_info
DROP POLICY IF EXISTS "Admins manage bank info" ON bank_transfer_info;
DROP POLICY IF EXISTS "Bank info access policy" ON bank_transfer_info;
CREATE POLICY "Unified bank info view policy" ON bank_transfer_info FOR
SELECT USING (true);
CREATE POLICY "Unified bank info manage policy" ON bank_transfer_info FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = auth.uid()
            AND users.role = 'admin'
    )
);
-- Consolidate policies for profiles
DROP POLICY IF EXISTS "Profiles are viewable" ON profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone if public or by owner" ON profiles;
CREATE POLICY "Unified profiles view policy" ON profiles FOR
SELECT USING (
        is_public = true
        OR auth.uid() = user_id
        OR (
            EXISTS (
                SELECT 1
                FROM users
                WHERE users.id = auth.uid()
                    AND users.role = 'admin'
            )
        )
    );
CREATE POLICY "Unified profiles update policy" ON profiles FOR
UPDATE USING (auth.uid() = user_id);
-- Consolidate policies for social_accounts
DROP POLICY IF EXISTS "Social accounts access policy" ON social_accounts;
DROP POLICY IF EXISTS "Users can manage own social accounts" ON social_accounts;
DROP POLICY IF EXISTS "Social accounts visible if profile is public" ON social_accounts;
CREATE POLICY "Unified social accounts view policy" ON social_accounts FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE profiles.id = social_accounts.profile_id
                AND (
                    profiles.is_public = true
                    OR profiles.user_id = auth.uid()
                )
        )
        OR (
            EXISTS (
                SELECT 1
                FROM users
                WHERE users.id = auth.uid()
                    AND users.role = 'admin'
            )
        )
    );
CREATE POLICY "Unified social accounts manage policy" ON social_accounts FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE profiles.id = social_accounts.profile_id
            AND profiles.user_id = auth.uid()
    )
);
-- Consolidate policies for subscription_plans
DROP POLICY IF EXISTS "Admins manage subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Subscription plans access" ON subscription_plans;
CREATE POLICY "Unified subscription plans view policy" ON subscription_plans FOR
SELECT USING (true);
CREATE POLICY "Unified subscription plans manage policy" ON subscription_plans FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE users.id = auth.uid()
            AND users.role = 'admin'
    )
);