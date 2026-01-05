-- 20240104170000_payment_security_optimization.sql
-- 1. Giải quyết chính sách chồng chéo (Multiple Permissive Policies) cho bank_transfer_info
-- Xóa các chính sách cũ và mới (nếu đã tồn tại)
DROP POLICY IF EXISTS "Bank info is viewable by everyone" ON public.bank_transfer_info;
DROP POLICY IF EXISTS "Admins can manage bank info" ON public.bank_transfer_info;
DROP POLICY IF EXISTS "Bank info view policy" ON public.bank_transfer_info;
DROP POLICY IF EXISTS "Admins manage bank info" ON public.bank_transfer_info;
-- Tạo chính sách hợp nhất cho SELECT
-- Mọi người (anon/authenticated) đều có thể xem thông tin ngân hàng đang hoạt động
-- Admin có toàn quyền (bao gồm cả xem thông tin đã ẩn)
CREATE POLICY "Bank info view policy" ON public.bank_transfer_info FOR
SELECT USING (
        is_active = TRUE
        OR (
            SELECT public.is_admin()
        )
    );
-- Tạo chính sách riêng cho các thao tác quản trị khác (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins manage bank info" ON public.bank_transfer_info FOR ALL TO authenticated USING (
    (
        SELECT public.is_admin()
    )
) WITH CHECK (
    (
        SELECT public.is_admin()
    )
);
-- 2. Tối ưu hóa hiệu năng RLS (auth.uid() re-evaluation) cho hệ thống thanh toán
-- Card Credits
DROP POLICY IF EXISTS "Users can view own credits" ON public.card_credits;
CREATE POLICY "Users can view own credits" ON public.card_credits FOR
SELECT USING (
        (
            SELECT auth.uid()
        ) = user_id
    );
-- User Subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions FOR
SELECT USING (
        (
            SELECT auth.uid()
        ) = user_id
    );
-- Payment Transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.payment_transactions;
CREATE POLICY "Users can view own transactions" ON public.payment_transactions FOR
SELECT USING (
        (
            SELECT auth.uid()
        ) = user_id
    );
-- Card Sends
DROP POLICY IF EXISTS "Users can view sent/received cards" ON public.card_sends;
CREATE POLICY "Users can view sent/received cards" ON public.card_sends FOR
SELECT USING (
        (
            SELECT auth.uid()
        ) = sender_id
        OR (
            SELECT auth.uid()
        ) = receiver_id
    );
-- 3. Cập nhật Subscription Plans (Đảm bảo tính đồng nhất)
DROP POLICY IF EXISTS "Plans are viewable by everyone" ON public.subscription_plans;
CREATE POLICY "Plans are viewable by everyone" ON public.subscription_plans FOR
SELECT USING (
        is_active = TRUE
        OR (
            SELECT public.is_admin()
        )
    );
DROP POLICY IF EXISTS "Admins can manage plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage plans" ON public.subscription_plans FOR ALL USING (
    (
        SELECT public.is_admin()
    )
);