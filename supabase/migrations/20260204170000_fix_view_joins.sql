-- Fix creator_cards_view to avoid filtering out users without subscriptions
CREATE OR REPLACE VIEW public.creator_cards_view AS
SELECT p.id AS profile_id,
    p.user_id,
    p.display_name,
    p.slug,
    p.cover_image_url,
    u.avatar_url,
    u.bio,
    p.location,
    p.view_count,
    p.created_at,
    pc.name AS category_name,
    pc.slug AS category_slug,
    -- Computed fields from subscription features
    COALESCE(
        (sp.features->>'priority_display')::boolean,
        false
    ) AS is_vip,
    sp.features->>'badge' AS badge,
    -- Priority Rank: VIP = 1, Non-VIP = 2
    CASE
        WHEN COALESCE(
            (sp.features->>'priority_display')::boolean,
            false
        ) = true THEN 1
        ELSE 2
    END AS priority_rank
FROM public.profiles p
    JOIN public.users u ON p.user_id = u.id
    LEFT JOIN public.profile_categories pc ON p.category_id = pc.id
    LEFT JOIN public.user_subscriptions us ON p.user_id = us.user_id
    AND us.status = 'active'
    AND us.expires_at > NOW()
    LEFT JOIN public.subscription_plans sp ON us.plan_id = sp.id
WHERE p.is_public = true;
-- Grant permissions again just in case
GRANT SELECT ON public.creator_cards_view TO authenticated;
GRANT SELECT ON public.creator_cards_view TO anon;