-- 20260107142000_performance_optimizations.sql
-- Optimizing RLS policies for performance and consolidating redundant rules
-- 1. Optimize profiles
-- Consolidation of "Public profiles are viewable by everyone" and "Users can view own private profile"
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own private profile" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone if public or by owner" ON public.profiles FOR
SELECT USING (
        is_public = TRUE
        OR user_id = (
            SELECT auth.uid()
        )
    );
-- Optimize other profile policies
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile" ON public.profiles FOR
INSERT WITH CHECK (
        user_id = (
            SELECT auth.uid()
        )
    );
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR
UPDATE USING (
        user_id = (
            SELECT auth.uid()
        )
    );
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (
    user_id = (
        SELECT auth.uid()
    )
);
-- 2. Optimize social_accounts
DROP POLICY IF EXISTS "Social accounts visible if profile is public" ON public.social_accounts;
DROP POLICY IF EXISTS "Users can manage own social accounts" ON public.social_accounts;
CREATE POLICY "Social accounts access policy" ON public.social_accounts FOR ALL USING (
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
-- 3. Optimize users table
DROP POLICY IF EXISTS "Users can view all active users" ON public.users;
CREATE POLICY "Users can view all active users" ON public.users FOR
SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR
UPDATE USING (
        (
            SELECT auth.uid()
        ) = id
    );
DROP POLICY IF EXISTS "Admins can do everything" ON public.users;
CREATE POLICY "Admins can do everything" ON public.users FOR ALL USING (
    (
        SELECT role
        FROM public.users
        WHERE id = (
                SELECT auth.uid()
            )
    ) = 'admin'
);
-- 4. Optimize follows
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others" ON public.follows FOR
INSERT WITH CHECK (
        follower_id = (
            SELECT auth.uid()
        )
    );
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (
    follower_id = (
        SELECT auth.uid()
    )
);
-- 5. Optimize search_history
DROP POLICY IF EXISTS "Users can manage their own search history" ON public.search_history;
CREATE POLICY "Users can manage their own search history" ON public.search_history FOR ALL USING (
    user_id = (
        SELECT auth.uid()
    )
);
-- 6. Optimize contacts
DROP POLICY IF EXISTS "Users can manage their own contacts" ON public.contacts;
CREATE POLICY "Users can manage their own contacts" ON public.contacts FOR ALL USING (
    user_id = (
        SELECT auth.uid()
    )
);
-- 7. Optimize contact_categories
DROP POLICY IF EXISTS "Users can manage their own categories" ON public.contact_categories;
CREATE POLICY "Users can manage their own categories" ON public.contact_categories FOR ALL USING (
    user_id = (
        SELECT auth.uid()
    )
);
-- 8. Consolidate bank_transfer_info
DROP POLICY IF EXISTS "Bank info is viewable by everyone" ON public.bank_transfer_info;
DROP POLICY IF EXISTS "Admins can manage bank info" ON public.bank_transfer_info;
DROP POLICY IF EXISTS "Bank info view policy" ON public.bank_transfer_info;
CREATE POLICY "Bank info view policy" ON public.bank_transfer_info FOR
SELECT USING (is_active = TRUE);
CREATE POLICY "Admins manage bank info" ON public.bank_transfer_info FOR ALL USING (
    (
        SELECT role
        FROM public.users
        WHERE id = (
                SELECT auth.uid()
            )
    ) = 'admin'
);