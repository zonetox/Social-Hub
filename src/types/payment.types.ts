export interface SubscriptionPlan {
    id: string
    name: string
    price_usd: number
    price_vnd: number
    duration_days: number
    features: {
        unlimited_cards?: boolean
        qr_codes?: boolean
        analytics?: boolean
        verification_badge?: boolean
        lifetime?: boolean
    }
    is_active: boolean
    created_at: string
}

export interface UserSubscription {
    id: string
    user_id: string
    plan_id: string
    status: 'active' | 'expired' | 'cancelled' | 'pending'
    starts_at: string
    expires_at: string
    auto_renew: boolean
    payment_method?: string
    plan?: SubscriptionPlan
}

export interface CardCredit {
    id: string
    user_id: string
    amount: number
    purchased_at: string
    expires_at?: string
}

export interface PaymentTransaction {
    id: string
    user_id: string
    type: 'subscription' | 'credits'
    amount_usd: number
    amount_vnd?: number
    currency: 'USD' | 'VND' | 'USDT'
    payment_method: string
    payment_provider?: string
    status: 'pending' | 'completed' | 'failed' | 'refunded'
    provider_transaction_id?: string
    proof_image_url?: string
    notes?: string
    created_at: string
    metadata?: any
}

export interface BankTransferInfo {
    id: string
    bank_name: string
    account_number: string
    account_holder: string
    swift_code?: string
    branch?: string
    country: string
}
