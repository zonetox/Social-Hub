-- 1. Create service_requests table
CREATE TABLE IF NOT EXISTS public.service_requests (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES public.profile_categories(id),
    title text NOT NULL,
    description text NOT NULL,
    status text NOT NULL DEFAULT 'open',
    -- open | closed
    created_at timestamptz DEFAULT now(),
    closed_at timestamptz
);
-- 2. Create service_offers table
CREATE TABLE IF NOT EXISTS public.service_offers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id uuid NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    price numeric,
    message text NOT NULL,
    status text NOT NULL DEFAULT 'sent',
    -- sent | withdrawn | accepted
    created_at timestamptz DEFAULT now(),
    UNIQUE (request_id, profile_id)
);
-- 3. Enable RLS
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_offers ENABLE ROW LEVEL SECURITY;
-- 4. RLS Policies for service_requests
-- View requests: Created by user OR In same category as user's profile
CREATE POLICY "View requests by creator or same category" ON public.service_requests FOR
SELECT USING (
        created_by_user_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.user_id = auth.uid() -- Ensure we check the current user's profile
                AND profiles.category_id = service_requests.category_id
        )
    );
-- Create request: Any logged-in user
CREATE POLICY "Create request" ON public.service_requests FOR
INSERT WITH CHECK (created_by_user_id = auth.uid());
-- Update / close own request
CREATE POLICY "Update own request" ON public.service_requests FOR
UPDATE USING (created_by_user_id = auth.uid());
-- 5. RLS Policies for service_offers
-- View offers: Own offer OR Request owner
CREATE POLICY "View own offer or request owner" ON public.service_offers FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.service_requests
            WHERE service_requests.id = service_offers.request_id
                AND service_requests.created_by_user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = service_offers.profile_id
                AND profiles.user_id = auth.uid()
        )
    );
-- Create offer: Profile owner only
CREATE POLICY "Create offer" ON public.service_offers FOR
INSERT WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = service_offers.profile_id
                AND profiles.user_id = auth.uid()
        )
    );
-- Update own offer
CREATE POLICY "Update own offer" ON public.service_offers FOR
UPDATE USING (
        EXISTS (
            SELECT 1
            FROM public.profiles
            WHERE profiles.id = service_offers.profile_id
                AND profiles.user_id = auth.uid()
        )
    );
-- 6. Update Subscription Plans with Quotas
UPDATE public.subscription_plans
SET features = features || '{"request_quota_per_month": 5, "offer_quota_per_month": 10}'::jsonb
WHERE name = 'STANDARD';
UPDATE public.subscription_plans
SET features = features || '{"request_quota_per_month": 20, "offer_quota_per_month": 100}'::jsonb
WHERE name = 'VIP';
-- Grant permissions (Best practice)
GRANT ALL ON public.service_requests TO authenticated;
GRANT ALL ON public.service_offers TO authenticated;
GRANT ALL ON public.service_requests TO service_role;
GRANT ALL ON public.service_offers TO service_role;