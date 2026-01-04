-- 20240104150000_security_hardening.sql
-- Vá các lỗ hổng bảo mật được cảnh báo bởi Supabase Advisor
-- 1. Kích hoạt RLS cho các bảng thanh toán còn thiếu
ALTER TABLE public.bank_transfer_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
-- 2. Thiết lập chính sách (Policies) cho các bảng trên
-- Subscription Plans: Ai cũng có thể xem, chỉ Admin mới có thể sửa
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON public.subscription_plans;
CREATE POLICY "Plans are viewable by everyone" ON public.subscription_plans FOR
SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admins can manage plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage plans" ON public.subscription_plans FOR ALL USING (public.is_admin());
-- Bank Transfer Info: Ai cũng có thể xem (để thanh toán), chỉ Admin mới có thể sửa
DROP POLICY IF EXISTS "Bank info is viewable by everyone" ON public.bank_transfer_info;
CREATE POLICY "Bank info is viewable by everyone" ON public.bank_transfer_info FOR
SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "Admins can manage bank info" ON public.bank_transfer_info;
CREATE POLICY "Admins can manage bank info" ON public.bank_transfer_info FOR ALL USING (public.is_admin());
-- 3. Thiết lập search_path an toàn cho các hàm (Ngăn chặn Search Path Hijacking)
-- Sử dụng logic kiểm tra tương thích cao để tránh lỗi cú pháp
DO $$
DECLARE f_name RECORD;
BEGIN -- Danh sách các hàm cần bảo mật search_path
-- Định dạng: 'tên_hàm(kiểu_dữ_liệu_tham_số)'
FOR f_name IN
SELECT unnest(
        ARRAY [
      'create_profile_for_new_user()',
      'deduct_card_credit(uuid)',
      'handle_new_user()',
      'increment_profile_views(uuid)',
      'increment_social_click(uuid)',
      'is_admin()',
      'get_user_card_balance(uuid)',
      'update_follower_counts()',
      'update_updated_at_column()'
    ]
    ) as func_signature LOOP -- Chỉ thực hiện nếu hàm tồn tại
    IF EXISTS (
        SELECT 1
        FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
            AND format(
                '%I(%s)',
                p.proname,
                oidvectortypes(p.proargtypes)
            ) = f_name.func_signature
    ) THEN EXECUTE 'ALTER FUNCTION public.' || f_name.func_signature || ' SET search_path = public';
END IF;
END LOOP;
END $$;