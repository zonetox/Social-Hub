-- =============================================
-- PAYMENT & MEMBERSHIP SYSTEM
-- =============================================
-- Subscription Plans
CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price_usd DECIMAL(10, 2) NOT NULL,
    price_vnd DECIMAL(15, 0),
    duration_days INTEGER NOT NULL,
    features JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- User Subscriptions
CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL CHECK (
        status IN ('active', 'expired', 'cancelled', 'pending')
    ),
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    auto_renew BOOLEAN DEFAULT FALSE,
    payment_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Card Credits
CREATE TABLE public.card_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL DEFAULT 0,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Card Sends (tracking)
CREATE TABLE public.card_sends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Payment Transactions
CREATE TABLE public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('subscription', 'credits')),
    amount_usd DECIMAL(10, 2) NOT NULL,
    amount_vnd DECIMAL(15, 0),
    currency TEXT NOT NULL CHECK (currency IN ('USD', 'VND', 'USDT')),
    payment_method TEXT NOT NULL,
    payment_provider TEXT,
    status TEXT NOT NULL CHECK (
        status IN ('pending', 'completed', 'failed', 'refunded')
    ),
    provider_transaction_id TEXT,
    proof_image_url TEXT,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Bank Transfer Info (for manual payments)
CREATE TABLE public.bank_transfer_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    swift_code TEXT,
    branch TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    country TEXT DEFAULT 'VN',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_card_credits_user_id ON public.card_credits(user_id);
CREATE INDEX idx_card_sends_sender_id ON public.card_sends(sender_id);
CREATE INDEX idx_card_sends_receiver_id ON public.card_sends(receiver_id);
CREATE INDEX idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
-- RLS Policies
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own credits" ON public.card_credits FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own transactions" ON public.payment_transactions FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view sent/received cards" ON public.card_sends FOR
SELECT USING (
        auth.uid() = sender_id
        OR auth.uid() = receiver_id
    );
-- Functions
CREATE OR REPLACE FUNCTION public.deduct_card_credit(p_user_id UUID) RETURNS BOOLEAN AS $$
DECLARE available_credits INTEGER;
BEGIN -- Get total credits
SELECT COALESCE(SUM(amount), 0) INTO available_credits
FROM public.card_credits
WHERE user_id = p_user_id
    AND (
        expires_at IS NULL
        OR expires_at > NOW()
    );
IF available_credits < 1 THEN RETURN FALSE;
END IF;
-- Deduct 1 credit (FIFO - oldest first)
UPDATE public.card_credits
SET amount = amount - 1
WHERE id = (
        SELECT id
        FROM public.card_credits
        WHERE user_id = p_user_id
            AND amount > 0
            AND (
                expires_at IS NULL
                OR expires_at > NOW()
            )
        ORDER BY created_at ASC
        LIMIT 1
    );
RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE FUNCTION public.get_user_card_balance(p_user_id UUID) RETURNS INTEGER AS $$ BEGIN RETURN COALESCE(
        (
            SELECT SUM(amount)
            FROM public.card_credits
            WHERE user_id = p_user_id
                AND (
                    expires_at IS NULL
                    OR expires_at > NOW()
                )
        ),
        0
    );
END;
$$ LANGUAGE plpgsql;
-- Seed data
INSERT INTO public.subscription_plans (
        name,
        price_usd,
        price_vnd,
        duration_days,
        features
    )
VALUES (
        'Annual Membership',
        1.00,
        25000,
        365,
        '{"unlimited_cards": true, "qr_codes": true, "analytics": true, "verification_badge": true}'::jsonb
    ),
    (
        'Lifetime',
        5.00,
        120000,
        36500,
        '{"unlimited_cards": true, "qr_codes": true, "analytics": true, "verification_badge": true, "lifetime": true}'::jsonb
    );
INSERT INTO public.bank_transfer_info (
        bank_name,
        account_number,
        account_holder,
        country
    )
VALUES (
        'VCB - Vietcombank',
        '1234567890',
        'NGUYEN VAN A',
        'VN'
    ),
    (
        'TCB - Techcombank',
        '0987654321',
        'NGUYEN VAN A',
        'VN'
    );
-- Triggers for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE
UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE
UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- =============================================
-- STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true) ON CONFLICT (id) DO NOTHING;
-- Storage policies for payment-proofs
CREATE POLICY "Payment proofs are accessible by owner and admins" ON storage.objects FOR
SELECT USING (
        bucket_id = 'payment-proofs'
        AND (
            auth.uid()::text = (storage.foldername(name)) [1]
            OR public.is_admin()
        )
    );
CREATE POLICY "Users can upload own payment proof" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'payment-proofs'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );
CREATE POLICY "Users can update own payment proof" ON storage.objects FOR
UPDATE USING (
        bucket_id = 'payment-proofs'
        AND auth.uid()::text = (storage.foldername(name)) [1]
    );