-- Add STANDARD and VIP subscription plans
INSERT INTO public.subscription_plans (
        name,
        price_usd,
        price_vnd,
        duration_days,
        features,
        is_active
    )
VALUES (
        'STANDARD',
        0,
        0,
        365,
        '{"priority_display": false, "can_receive_requests": false, "badge": null}'::jsonb,
        true
    ),
    (
        'VIP',
        10,
        250000,
        30,
        '{"priority_display": true, "can_receive_requests": true, "badge": "VIP"}'::jsonb,
        true
    );