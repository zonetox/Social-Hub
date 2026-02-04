-- DROP VIEW cũ để tránh lỗi "cannot change name of view column"
DROP VIEW IF EXISTS public.creator_cards_view;
-- Tạo lại View mới với đầy đủ cột
CREATE VIEW public.creator_cards_view AS
SELECT p.id AS profile_id,
    p.user_id,
    p.display_name,
    p.slug,
    p.cover_image_url,
    u.avatar_url,
    u.username,
    -- Đã thêm
    u.bio,
    u.is_verified,
    -- Đã thêm
    p.location,
    p.view_count,
    p.created_at,
    pc.name AS category_name,
    pc.slug AS category_slug,
    -- VIP Fields
    COALESCE(
        (sp.features->>'priority_display')::boolean,
        false
    ) AS is_vip,
    sp.features->>'badge' AS badge,
    -- Sorting Rank
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
-- Cấp lại quyền
GRANT SELECT ON public.creator_cards_view TO authenticated;
GRANT SELECT ON public.creator_cards_view TO anon;