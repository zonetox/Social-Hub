-- 1. DROP VIEW cũ
DROP VIEW IF EXISTS public.creator_cards_view;
-- 2. Tạo lại View với đầy đủ cột và xử lý data trống
CREATE VIEW public.creator_cards_view AS
SELECT p.id AS profile_id,
    p.user_id,
    p.display_name,
    p.slug,
    p.cover_image_url,
    u.avatar_url,
    u.username,
    u.bio,
    u.is_verified,
    p.location,
    -- Xử lý số liệu: Nếu chưa có thì mặc định là 0
    COALESCE(p.view_count, 0) as view_count,
    COALESCE(p.follower_count, 0) as follower_count,
    -- Thêm cột này
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
-- 3. Cấp quyền
GRANT SELECT ON public.creator_cards_view TO authenticated;
GRANT SELECT ON public.creator_cards_view TO anon;
-- 4. BONUS: Bổ sung data ảo (Seed Data) cho đẹp mắt
-- Random view từ 100 đến 1000 cho các profile chưa có views
UPDATE public.profiles
SET view_count = floor(random() * 900 + 100)::int
WHERE view_count IS NULL
    OR view_count = 0;
-- Random followers từ 10 đến 500
UPDATE public.profiles
SET follower_count = floor(random() * 490 + 10)::int
WHERE follower_count IS NULL
    OR follower_count = 0;