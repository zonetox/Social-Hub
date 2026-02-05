-- 1. Add budget column to service_requests
ALTER TABLE public.service_requests
ADD COLUMN IF NOT EXISTS budget numeric;
-- 2. Update my_requests_summary view to include budget
CREATE OR REPLACE VIEW public.my_requests_summary WITH (security_invoker = true) AS
SELECT sr.id,
    sr.created_by_user_id,
    sr.title,
    sr.status,
    sr.budget,
    sr.created_at,
    sr.closed_at,
    pc.name AS category_name,
    COUNT(so.id) AS offer_count
FROM public.service_requests sr
    LEFT JOIN public.service_offers so ON so.request_id = sr.id
    JOIN public.profile_categories pc ON pc.id = sr.category_id
GROUP BY sr.id,
    pc.name;