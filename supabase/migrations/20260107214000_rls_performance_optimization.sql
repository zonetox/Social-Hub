-- =============================================
-- RLS Performance Optimization
-- Fixes auth.uid() re-evaluation and multiple permissive policies
-- =============================================
-- 1. Fix auth.uid() re-evaluation in users table
DROP POLICY IF EXISTS "Users can insert their own record" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view all active users" ON public.users;
DROP POLICY IF EXISTS "Admins can do everything" ON public.users;
-- Recreate with optimized policies (combine where possible)
CREATE POLICY "Users can view all active users" ON public.users FOR
SELECT USING (
        is_active = TRUE
        OR (
            SELECT auth.uid()
        ) = id
        OR public.is_admin()
    );
CREATE POLICY "Users can insert their own record" ON public.users FOR
INSERT WITH CHECK (
        (
            SELECT auth.uid()
        ) = id
    );
CREATE POLICY "Users can update own profile" ON public.users FOR
UPDATE USING (
        (
            SELECT auth.uid()
        ) = id
        OR public.is_admin()
    );
CREATE POLICY "Admins can delete users" ON public.users FOR DELETE USING (public.is_admin());
-- 2. Fix multiple permissive policies on bank_transfer_info
DROP POLICY IF EXISTS "Admins manage bank info" ON public.bank_transfer_info;
DROP POLICY IF EXISTS "Bank info view policy" ON public.bank_transfer_info;
-- Combine into single policy
CREATE POLICY "Bank info access policy" ON public.bank_transfer_info FOR
SELECT USING (
        public.is_admin()
        OR TRUE
    );
-- Everyone can view, admins can manage
CREATE POLICY "Admins manage bank info" ON public.bank_transfer_info FOR ALL USING (public.is_admin());
-- 3. Fix multiple permissive policies on subscription_plans
DROP POLICY IF EXISTS "Admins can manage plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON public.subscription_plans;
-- Combine into single policy
CREATE POLICY "Subscription plans access" ON public.subscription_plans FOR
SELECT USING (TRUE);
-- Everyone can view
CREATE POLICY "Admins manage subscription plans" ON public.subscription_plans FOR ALL USING (public.is_admin());
-- 4. Optimize profiles policies with SELECT auth.uid()
DROP POLICY IF EXISTS "Users can view own private profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can view own private profile" ON public.profiles FOR
SELECT USING (
        is_public = TRUE
        OR user_id = (
            SELECT auth.uid()
        )
    );
CREATE POLICY "Users can create own profile" ON public.profiles FOR
INSERT WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
    );
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (
        user_id = (
            SELECT auth.uid()
        )
    );
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (
    user_id = (
        SELECT auth.uid()
    )
);
-- 5. Optimize social_accounts policies
DROP POLICY IF EXISTS "Social accounts visible if profile is public" ON public.social_accounts;
DROP POLICY IF EXISTS "Users can manage own social accounts" ON public.social_accounts;
CREATE POLICY "Social accounts visible if profile is public" ON public.social_accounts FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = profile_id
                AND (
                    is_public = TRUE
                    OR user_id = (
                        SELECT auth.uid()
                    )
                )
        )
    );
CREATE POLICY "Users can manage own social accounts" ON public.social_accounts FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = profile_id
            AND user_id = (
                SELECT auth.uid()
            )
    )
);
-- 6. Optimize follows policies
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can follow others" ON public.follows FOR
INSERT WITH CHECK (
        follower_id = (
            SELECT auth.uid()
        )
    );
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (
    follower_id = (
        SELECT auth.uid()
    )
);
-- 7. Optimize analytics policies
DROP POLICY IF EXISTS "Profile owners can view own analytics" ON public.analytics;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.analytics;
CREATE POLICY "Profile owners can view own analytics" ON public.analytics FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE id = profile_id
                AND user_id = (
                    SELECT auth.uid()
                )
        )
        OR public.is_admin()
    );
-- 8. Optimize contacts policies
DROP POLICY IF EXISTS "Users can manage their own contacts" ON public.contacts;
CREATE POLICY "Users can manage their own contacts" ON public.contacts FOR ALL USING (
    (
        SELECT auth.uid()
    ) = user_id
);
-- 9. Optimize contact_categories policies
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.contact_categories;
CREATE POLICY "Users can manage their own categories" ON public.contact_categories FOR ALL USING (
    (
        SELECT auth.uid()
    ) = user_id
);
-- 10. Optimize search_history policies
DROP POLICY IF EXISTS "Users can manage their own search history" ON public.search_history;
CREATE POLICY "Users can manage their own search history" ON public.search_history FOR ALL USING (
    (
        SELECT auth.uid()
    ) = user_id
);
-- 11. Optimize payment-related tables
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can view own payment proofs" ON public.payment_proofs;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR
SELECT USING (
        (
            SELECT auth.uid()
        ) = user_id
        OR public.is_admin()
    );
CREATE POLICY "Users can view own payments" ON public.payments FOR
SELECT USING (
        (
            SELECT auth.uid()
        ) = user_id
        OR public.is_admin()
    );
CREATE POLICY "Users can view own payment proofs" ON public.payment_proofs FOR
SELECT USING (
        (
            SELECT auth.uid()
        ) = user_id
        OR public.is_admin()
    );
-- 12. Optimize card_sends policies
DROP POLICY IF EXISTS "Users can view sent/received cards" ON public.card_sends;
CREATE POLICY "Users can view sent/received cards" ON public.card_sends FOR
SELECT USING (
        (
            SELECT auth.uid()
        ) = sender_id
        OR (
            SELECT auth.uid()
        ) = receiver_id
        OR public.is_admin()
    );