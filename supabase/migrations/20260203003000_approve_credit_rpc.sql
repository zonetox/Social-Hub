-- Function to approve a credit transaction atomically
-- 1. Updates payment_transactions status to 'completed'
-- 2. Increments user's card_credits amount (based on metadata->>'credits')
CREATE OR REPLACE FUNCTION public.approve_credit_transaction(p_transaction_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_transaction record;
v_credits int;
v_user_id uuid;
v_new_amount int;
BEGIN -- Get transaction details
SELECT * INTO v_transaction
FROM public.payment_transactions
WHERE id = p_transaction_id
    AND status = 'pending' FOR
UPDATE;
-- Lock the row
IF NOT FOUND THEN RETURN jsonb_build_object(
    'success',
    false,
    'message',
    'Transaction not found or already processed'
);
END IF;
v_user_id := v_transaction.user_id;
v_credits := (v_transaction.metadata->>'credits')::int;
IF v_credits IS NULL
OR v_credits <= 0 THEN RETURN jsonb_build_object(
    'success',
    false,
    'message',
    'Invalid credit amount in transaction metadata'
);
END IF;
-- Update transaction status
UPDATE public.payment_transactions
SET status = 'completed',
    updated_at = now()
WHERE id = p_transaction_id;
-- Upsert card_credits
INSERT INTO public.card_credits (user_id, amount)
VALUES (v_user_id, v_credits) ON CONFLICT (user_id) DO
UPDATE
SET amount = card_credits.amount + EXCLUDED.amount,
    updated_at = now() -- Assuming updated_at exists, if not ignore or check schema
RETURNING amount INTO v_new_amount;
RETURN jsonb_build_object(
    'success',
    true,
    'new_credit_balance',
    v_new_amount
);
EXCEPTION
WHEN OTHERS THEN RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;