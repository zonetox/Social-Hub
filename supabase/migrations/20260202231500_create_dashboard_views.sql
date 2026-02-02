-- View: my_requests_summary
-- Summarizes requests with offer counts
CREATE OR REPLACE VIEW public.my_requests_summary WITH (security_invoker = true) AS
SELECT sr.id,
    sr.created_by_user_id,
    sr.title,
    sr.status,
    sr.created_at,
    sr.closed_at,
    pc.name AS category_name,
    COUNT(so.id) AS offer_count
FROM public.service_requests sr
    LEFT JOIN public.service_offers so ON so.request_id = sr.id
    JOIN public.profile_categories pc ON pc.id = sr.category_id
GROUP BY sr.id,
    pc.name;
-- View: my_offers_summary
-- Summarizes data for My Offers page
CREATE OR REPLACE VIEW public.my_offers_summary WITH (security_invoker = true) AS
SELECT so.id,
    so.profile_id,
    so.price,
    so.status AS offer_status,
    so.created_at AS offered_at,
    so.message,
    sr.id AS request_id,
    sr.title AS request_title,
    sr.status AS request_status
FROM public.service_offers so
    JOIN public.service_requests sr ON sr.id = so.request_id;