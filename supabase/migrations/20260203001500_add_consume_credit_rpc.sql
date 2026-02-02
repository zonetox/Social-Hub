-- Function to atomically consume 1 credit
CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_amount integer;
BEGIN
UPDATE public.card_credits
SET amount = amount - 1
WHERE user_id = p_user_id
    AND amount > 0
RETURNING amount INTO new_amount;
RETURN new_amount;
END;
$$;