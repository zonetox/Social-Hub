
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            analytics: {
                Row: {
                    id: string
                    profile_id: string
                    event_type: string
                    social_account_id: string | null
                    metadata: Json | null
                    ip_address: string | null
                    user_agent: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    profile_id: string
                    event_type: string
                    social_account_id?: string | null
                    metadata?: Json | null
                    ip_address?: string | null
                    user_agent?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    profile_id?: string
                    event_type?: string
                    social_account_id?: string | null
                    metadata?: Json | null
                    ip_address?: string | null
                    user_agent?: string | null
                    created_at?: string | null
                }
                Relationships: []
            }
            bank_transfer_info: {
                Row: {
                    id: string
                    bank_name: string
                    account_number: string
                    account_holder: string
                    swift_code: string | null
                    branch: string | null
                    is_active: boolean | null
                    country: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    bank_name: string
                    account_number: string
                    account_holder: string
                    swift_code?: string | null
                    branch?: string | null
                    is_active?: boolean | null
                    country?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    bank_name?: string
                    account_number?: string
                    account_holder?: string
                    swift_code?: string | null
                    branch?: string | null
                    is_active?: boolean | null
                    country?: string | null
                    created_at?: string | null
                }
                Relationships: []
            }
            card_credits: {
                Row: {
                    id: string
                    user_id: string
                    amount: number
                    purchased_at: string | null
                    expires_at: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    amount: number
                    purchased_at?: string | null
                    expires_at?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    amount?: number
                    purchased_at?: string | null
                    expires_at?: string | null
                    created_at?: string | null
                }
                Relationships: []
            }
            card_sends: {
                Row: {
                    id: string
                    sender_id: string
                    receiver_id: string
                    profile_id: string
                    viewed: boolean | null
                    viewed_at: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    sender_id: string
                    receiver_id: string
                    profile_id: string
                    viewed?: boolean | null
                    viewed_at?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    sender_id?: string
                    receiver_id?: string
                    profile_id?: string
                    viewed?: boolean | null
                    viewed_at?: string | null
                    created_at?: string | null
                }
                Relationships: []
            }
            contact_categories: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    color: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    color?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    color?: string | null
                    created_at?: string | null
                }
                Relationships: []
            }
            contacts: {
                Row: {
                    id: string
                    user_id: string
                    contact_profile_id: string
                    notes: string | null
                    created_at: string | null
                    category_id: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    contact_profile_id: string
                    notes?: string | null
                    created_at?: string | null
                    category_id?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    contact_profile_id?: string
                    notes?: string | null
                    created_at?: string | null
                    category_id?: string | null
                }
                Relationships: []
            }
            follows: {
                Row: {
                    id: string
                    follower_id: string
                    following_id: string
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    follower_id: string
                    following_id: string
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    follower_id?: string
                    following_id?: string
                    created_at?: string | null
                }
                Relationships: []
            }
            payment_transactions: {
                Row: {
                    id: string
                    user_id: string
                    type: string
                    amount_usd: number
                    amount_vnd: number | null
                    currency: string
                    payment_method: string
                    payment_provider: string | null
                    status: string
                    provider_transaction_id: string | null
                    proof_image_url: string | null
                    notes: string | null
                    metadata: Json | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: string
                    amount_usd: number
                    amount_vnd?: number | null
                    currency: string
                    payment_method: string
                    payment_provider?: string | null
                    status: string
                    provider_transaction_id?: string | null
                    proof_image_url?: string | null
                    notes?: string | null
                    metadata?: Json | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: string
                    amount_usd?: number
                    amount_vnd?: number | null
                    currency?: string
                    payment_method?: string
                    payment_provider?: string | null
                    status?: string
                    provider_transaction_id?: string | null
                    proof_image_url?: string | null
                    notes?: string | null
                    metadata?: Json | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            profile_categories: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    icon: string | null
                    display_order: number | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    icon?: string | null
                    display_order?: number | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    icon?: string | null
                    display_order?: number | null
                    created_at?: string | null
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    id: string
                    user_id: string
                    display_name: string
                    slug: string
                    cover_image_url: string | null
                    website: string | null
                    location: string | null
                    tags: string[] | null
                    is_public: boolean | null
                    view_count: number | null
                    follower_count: number | null
                    following_count: number | null
                    created_at: string | null
                    updated_at: string | null
                    theme_config: Json | null
                    category_id: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    display_name: string
                    slug: string
                    cover_image_url?: string | null
                    website?: string | null
                    location?: string | null
                    tags?: string[] | null
                    is_public?: boolean | null
                    view_count?: number | null
                    follower_count?: number | null
                    following_count?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                    theme_config?: Json | null
                    category_id?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    display_name?: string
                    slug?: string
                    cover_image_url?: string | null
                    website?: string | null
                    location?: string | null
                    tags?: string[] | null
                    is_public?: boolean | null
                    view_count?: number | null
                    follower_count?: number | null
                    following_count?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                    theme_config?: Json | null
                    category_id?: string | null
                }
                Relationships: []
            }
            search_history: {
                Row: {
                    id: string
                    user_id: string
                    query: string
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    query: string
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    query?: string
                    created_at?: string | null
                }
                Relationships: []
            }
            service_offers: {
                Row: {
                    id: string
                    request_id: string
                    profile_id: string
                    price: number | null
                    message: string
                    status: string
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    request_id: string
                    profile_id: string
                    price?: number | null
                    message: string
                    status: string
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    request_id?: string
                    profile_id?: string
                    price?: number | null
                    message?: string
                    status?: string
                    created_at?: string | null
                }
                Relationships: []
            }
            service_requests: {
                Row: {
                    id: string
                    created_by_user_id: string
                    category_id: string
                    title: string
                    description: string
                    status: string
                    created_at: string | null
                    closed_at: string | null
                }
                Insert: {
                    id?: string
                    created_by_user_id: string
                    category_id: string
                    title: string
                    description: string
                    status: string
                    created_at?: string | null
                    closed_at?: string | null
                }
                Update: {
                    id?: string
                    created_by_user_id?: string
                    category_id?: string
                    title?: string
                    description?: string
                    status?: string
                    created_at?: string | null
                    closed_at?: string | null
                }
                Relationships: []
            }
            social_accounts: {
                Row: {
                    id: string
                    profile_id: string
                    platform: string
                    platform_username: string
                    platform_url: string
                    display_order: number | null
                    is_visible: boolean | null
                    click_count: number | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    profile_id: string
                    platform: string
                    platform_username: string
                    platform_url: string
                    display_order?: number | null
                    is_visible?: boolean | null
                    click_count?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    profile_id?: string
                    platform?: string
                    platform_username?: string
                    platform_url?: string
                    display_order?: number | null
                    is_visible?: boolean | null
                    click_count?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            subscription_plans: {
                Row: {
                    id: string
                    name: string
                    price_usd: number
                    price_vnd: number | null
                    duration_days: number
                    features: Json | null
                    is_active: boolean | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    price_usd: number
                    price_vnd?: number | null
                    duration_days: number
                    features?: Json | null
                    is_active?: boolean | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    price_usd?: number
                    price_vnd?: number | null
                    duration_days?: number
                    features?: Json | null
                    is_active?: boolean | null
                    created_at?: string | null
                }
                Relationships: []
            }
            user_subscriptions: {
                Row: {
                    id: string
                    user_id: string
                    plan_id: string
                    status: string
                    starts_at: string
                    expires_at: string
                    auto_renew: boolean | null
                    payment_method: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    plan_id: string
                    status: string
                    starts_at: string
                    expires_at: string
                    auto_renew?: boolean | null
                    payment_method?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    plan_id?: string
                    status?: string
                    starts_at?: string
                    expires_at?: string
                    auto_renew?: boolean | null
                    payment_method?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            users: {
                Row: {
                    id: string
                    email: string
                    username: string
                    full_name: string
                    avatar_url: string | null
                    bio: string | null
                    role: string
                    is_verified: boolean | null
                    is_active: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    email: string
                    username: string
                    full_name: string
                    avatar_url?: string | null
                    bio?: string | null
                    role: string
                    is_verified?: boolean | null
                    is_active?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    email?: string
                    username?: string
                    full_name?: string
                    avatar_url?: string | null
                    bio?: string | null
                    role?: string
                    is_verified?: boolean | null
                    is_active?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            creator_cards_view: {
                Row: {
                    profile_id: string | null
                    user_id: string | null
                    display_name: string | null
                    slug: string | null
                    cover_image_url: string | null
                    avatar_url: string | null
                    bio: string | null
                    location: string | null
                    view_count: number | null
                    created_at: string | null
                    category_name: string | null
                    category_slug: string | null
                    is_vip: boolean | null
                    badge: string | null
                    priority_rank: number | null
                }
                Relationships: []
            }
            my_offers_summary: {
                Row: {
                    id: string | null
                    profile_id: string | null
                    price: number | null
                    offer_status: string | null
                    offered_at: string | null
                    message: string | null
                    request_id: string | null
                    request_title: string | null
                    request_status: string | null
                }
                Relationships: []
            }
            my_requests_summary: {
                Row: {
                    id: string | null
                    created_by_user_id: string | null
                    title: string | null
                    status: string | null
                    created_at: string | null
                    closed_at: string | null
                    category_name: string | null
                    offer_count: number | null
                }
                Relationships: []
            }
        }
        Functions: {
            approve_credit_transaction: {
                Args: {
                    p_transaction_id: string
                }
                Returns: {
                    success: boolean
                    message: string
                    new_credit_balance?: number
                }
            }
            consume_credit: {
                Args: {
                    p_user_id: string
                }
                Returns: number
            }
            deduct_card_credit: {
                Args: {
                    p_user_id: string
                }
                Returns: boolean
            }
            get_user_card_balance: {
                Args: {
                    p_user_id: string
                }
                Returns: number
            }
            increment_profile_views: {
                Args: {
                    profile_id: string
                }
                Returns: void
            }
            increment_social_click: {
                Args: {
                    account_id: string
                }
                Returns: void
            }
            is_admin: {
                Args: Record<PropertyKey, never>
                Returns: boolean
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
