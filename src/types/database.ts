
export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            analytics: {
                Row: {
                    created_at: string | null
                    event_type: string
                    id: string
                    ip_address: string | null
                    metadata: Json | null
                    profile_id: string
                    social_account_id: string | null
                    user_agent: string | null
                }
                Insert: {
                    created_at?: string | null
                    event_type: string
                    id?: string
                    ip_address?: string | null
                    metadata?: Json | null
                    profile_id: string
                    social_account_id?: string | null
                    user_agent?: string | null
                }
                Update: {
                    created_at?: string | null
                    event_type?: string
                    id?: string
                    ip_address?: string | null
                    metadata?: Json | null
                    profile_id?: string
                    social_account_id?: string | null
                    user_agent?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "analytics_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            bank_transfer_info: {
                Row: {
                    account_holder: string
                    account_number: string
                    bank_name: string
                    branch: string | null
                    created_at: string | null
                    country: string | null
                    id: string
                    is_active: boolean | null
                    swift_code: string | null
                }
                Insert: {
                    account_holder: string
                    account_number: string
                    bank_name: string
                    branch?: string | null
                    created_at?: string | null
                    country?: string | null
                    id?: string
                    is_active?: boolean | null
                    swift_code?: string | null
                }
                Update: {
                    account_holder?: string
                    account_number?: string
                    bank_name?: string
                    branch?: string | null
                    created_at?: string | null
                    country?: string | null
                    id?: string
                    is_active?: boolean | null
                    swift_code?: string | null
                }
                Relationships: []
            }
            card_credits: {
                Row: {
                    amount: number
                    created_at: string | null
                    expires_at: string | null
                    id: string
                    purchased_at: string | null
                    user_id: string
                }
                Insert: {
                    amount: number
                    created_at?: string | null
                    expires_at?: string | null
                    id?: string
                    purchased_at?: string | null
                    user_id: string
                }
                Update: {
                    amount?: number
                    created_at?: string | null
                    expires_at?: string | null
                    id?: string
                    purchased_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "card_credits_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            card_sends: {
                Row: {
                    created_at: string | null
                    id: string
                    profile_id: string
                    receiver_id: string
                    sender_id: string
                    viewed: boolean | null
                    viewed_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    profile_id: string
                    receiver_id: string
                    sender_id: string
                    viewed?: boolean | null
                    viewed_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    profile_id?: string
                    receiver_id?: string
                    sender_id?: string
                    viewed?: boolean | null
                    viewed_at?: string | null
                }
                Relationships: []
            }
            contact_categories: {
                Row: {
                    color: string | null
                    created_at: string | null
                    id: string
                    name: string
                    user_id: string
                }
                Insert: {
                    color?: string | null
                    created_at?: string | null
                    id?: string
                    name: string
                    user_id: string
                }
                Update: {
                    color?: string | null
                    created_at?: string | null
                    id?: string
                    name?: string
                    user_id?: string
                }
                Relationships: []
            }
            contacts: {
                Row: {
                    category_id: string | null
                    contact_profile_id: string
                    created_at: string | null
                    id: string
                    notes: string | null
                    user_id: string
                }
                Insert: {
                    category_id?: string | null
                    contact_profile_id: string
                    created_at?: string | null
                    id?: string
                    notes?: string | null
                    user_id: string
                }
                Update: {
                    category_id?: string | null
                    contact_profile_id?: string
                    created_at?: string | null
                    id?: string
                    notes?: string | null
                    user_id?: string
                }
                Relationships: []
            }
            follows: {
                Row: {
                    created_at: string | null
                    follower_id: string
                    following_id: string
                    id: string
                }
                Insert: {
                    created_at?: string | null
                    follower_id: string
                    following_id: string
                    id?: string
                }
                Update: {
                    created_at?: string | null
                    follower_id?: string
                    following_id?: string
                    id?: string
                }
                Relationships: []
            }
            payment_transactions: {
                Row: {
                    amount_usd: number
                    amount_vnd: number | null
                    created_at: string | null
                    currency: string
                    id: string
                    metadata: Json | null
                    notes: string | null
                    payment_method: string
                    payment_provider: string | null
                    proof_image_url: string | null
                    provider_transaction_id: string | null
                    status: string
                    type: string
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    amount_usd: number
                    amount_vnd?: number | null
                    created_at?: string | null
                    currency: string
                    id?: string
                    metadata?: Json | null
                    notes?: string | null
                    payment_method: string
                    payment_provider?: string | null
                    proof_image_url?: string | null
                    provider_transaction_id?: string | null
                    status: string
                    type: string
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    amount_usd?: number
                    amount_vnd?: number | null
                    created_at?: string | null
                    currency?: string
                    id?: string
                    metadata?: Json | null
                    notes?: string | null
                    payment_method?: string
                    payment_provider?: string | null
                    proof_image_url?: string | null
                    provider_transaction_id?: string | null
                    status?: string
                    type?: string
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: []
            }
            profile_categories: {
                Row: {
                    created_at: string | null
                    display_order: number | null
                    icon: string | null
                    id: string
                    name: string
                    slug: string
                }
                Insert: {
                    created_at?: string | null
                    display_order?: number | null
                    icon?: string | null
                    id?: string
                    name: string
                    slug: string
                }
                Update: {
                    created_at?: string | null
                    display_order?: number | null
                    icon?: string | null
                    id?: string
                    name?: string
                    slug?: string
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    category_id: string | null
                    cover_image_url: string | null
                    created_at: string | null
                    display_name: string
                    follower_count: number | null
                    following_count: number | null
                    id: string
                    is_public: boolean | null
                    location: string | null
                    slug: string
                    tags: string[] | null
                    theme_config: Json | null
                    updated_at: string | null
                    user_id: string
                    view_count: number | null
                    website: string | null
                }
                Insert: {
                    category_id?: string | null
                    cover_image_url?: string | null
                    created_at?: string | null
                    display_name: string
                    follower_count?: number | null
                    following_count?: number | null
                    id?: string
                    is_public?: boolean | null
                    location?: string | null
                    slug: string
                    tags?: string[] | null
                    theme_config?: Json | null
                    updated_at?: string | null
                    user_id: string
                    view_count?: number | null
                    website?: string | null
                }
                Update: {
                    category_id?: string | null
                    cover_image_url?: string | null
                    created_at?: string | null
                    display_name?: string
                    follower_count?: number | null
                    following_count?: number | null
                    id?: string
                    is_public?: boolean | null
                    location?: string | null
                    slug?: string
                    tags?: string[] | null
                    theme_config?: Json | null
                    updated_at?: string | null
                    user_id?: string
                    view_count?: number | null
                    website?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "profile_categories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "profiles_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            search_history: {
                Row: {
                    created_at: string | null
                    id: string
                    query: string
                    user_id: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    query: string
                    user_id: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    query?: string
                    user_id?: string
                }
                Relationships: []
            }
            service_offers: {
                Row: {
                    created_at: string | null
                    id: string
                    message: string
                    price: number | null
                    profile_id: string
                    request_id: string
                    status: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    message: string
                    price?: number | null
                    profile_id: string
                    request_id: string
                    status: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    message?: string
                    price?: number | null
                    profile_id?: string
                    request_id?: string
                    status?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "service_offers_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "service_offers_request_id_fkey"
                        columns: ["request_id"]
                        isOneToOne: false
                        referencedRelation: "service_requests"
                        referencedColumns: ["id"]
                    }
                ]
            }
            service_requests: {
                Row: {
                    category_id: string
                    closed_at: string | null
                    created_at: string | null
                    created_by_user_id: string
                    description: string
                    id: string
                    status: string
                    title: string
                }
                Insert: {
                    category_id: string
                    closed_at?: string | null
                    created_at?: string | null
                    created_by_user_id: string
                    description: string
                    id?: string
                    status: string
                    title: string
                }
                Update: {
                    category_id?: string
                    closed_at?: string | null
                    created_at?: string | null
                    created_by_user_id?: string
                    description?: string
                    id?: string
                    status?: string
                    title?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "service_requests_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "profile_categories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "service_requests_created_by_user_id_fkey"
                        columns: ["created_by_user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            social_accounts: {
                Row: {
                    click_count: number | null
                    created_at: string | null
                    display_order: number | null
                    id: string
                    is_visible: boolean | null
                    platform: string
                    platform_url: string
                    platform_username: string
                    profile_id: string
                    updated_at: string | null
                }
                Insert: {
                    click_count?: number | null
                    created_at?: string | null
                    display_order?: number | null
                    id?: string
                    is_visible?: boolean | null
                    platform: string
                    platform_url: string
                    platform_username: string
                    profile_id: string
                    updated_at?: string | null
                }
                Update: {
                    click_count?: number | null
                    created_at?: string | null
                    display_order?: number | null
                    id?: string
                    is_visible?: boolean | null
                    platform?: string
                    platform_url?: string
                    platform_username?: string
                    profile_id?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "social_accounts_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            subscription_plans: {
                Row: {
                    created_at: string | null
                    duration_days: number
                    features: Json | null
                    id: string
                    is_active: boolean | null
                    name: string
                    price_usd: number
                    price_vnd: number | null
                }
                Insert: {
                    created_at?: string | null
                    duration_days: number
                    features?: Json | null
                    id?: string
                    is_active?: boolean | null
                    name: string
                    price_usd: number
                    price_vnd?: number | null
                }
                Update: {
                    created_at?: string | null
                    duration_days?: number
                    features?: Json | null
                    id?: string
                    is_active?: boolean | null
                    name?: string
                    price_usd?: number
                    price_vnd?: number | null
                }
                Relationships: []
            }
            user_subscriptions: {
                Row: {
                    auto_renew: boolean | null
                    created_at: string | null
                    expires_at: string
                    id: string
                    payment_method: string | null
                    plan_id: string
                    starts_at: string
                    status: string
                    updated_at: string | null
                    user_id: string
                }
                Insert: {
                    auto_renew?: boolean | null
                    created_at?: string | null
                    expires_at: string
                    id?: string
                    payment_method?: string | null
                    plan_id: string
                    starts_at: string
                    status: string
                    updated_at?: string | null
                    user_id: string
                }
                Update: {
                    auto_renew?: boolean | null
                    created_at?: string | null
                    expires_at?: string
                    id?: string
                    payment_method?: string | null
                    plan_id?: string
                    starts_at?: string
                    status?: string
                    updated_at?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_subscriptions_plan_id_fkey"
                        columns: ["plan_id"]
                        isOneToOne: false
                        referencedRelation: "subscription_plans"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_subscriptions_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            users: {
                Row: {
                    avatar_url: string | null
                    bio: string | null
                    created_at: string | null
                    email: string
                    full_name: string
                    id: string
                    is_active: boolean | null
                    is_verified: boolean | null
                    role: string
                    updated_at: string | null
                    username: string
                }
                Insert: {
                    avatar_url?: string | null
                    bio?: string | null
                    created_at?: string | null
                    email: string
                    full_name: string
                    id: string
                    is_active?: boolean | null
                    is_verified?: boolean | null
                    role: string
                    updated_at?: string | null
                    username: string
                }
                Update: {
                    avatar_url?: string | null
                    bio?: string | null
                    created_at?: string | null
                    email?: string
                    full_name?: string
                    id?: string
                    is_active?: boolean | null
                    is_verified?: boolean | null
                    role?: string
                    updated_at?: string | null
                    username?: string
                }
                Relationships: []
            }
        }
        Views: {
            creator_cards_view: {
                Row: {
                    avatar_url: string | null
                    badge: string | null
                    bio: string | null
                    category_name: string | null
                    category_slug: string | null
                    cover_image_url: string | null
                    created_at: string | null
                    display_name: string | null
                    id: string | null
                    is_vip: boolean | null
                    location: string | null
                    priority_rank: number | null
                    profile_id: string | null
                    slug: string | null
                    user_id: string | null
                    view_count: number | null
                }
                Relationships: []
            }
            my_offers_summary: {
                Row: {
                    id: string | null
                    message: string | null
                    offer_status: string | null
                    offered_at: string | null
                    price: number | null
                    profile_id: string | null
                    request_id: string | null
                    request_status: string | null
                    request_title: string | null
                }
                Relationships: []
            }
            my_requests_summary: {
                Row: {
                    category_name: string | null
                    closed_at: string | null
                    created_at: string | null
                    created_by_user_id: string | null
                    id: string | null
                    offer_count: number | null
                    status: string | null
                    title: string | null
                }
                Relationships: []
            }
        }
        Functions: {
            approve_credit_transaction: {
                Args: {
                    p_transaction_id: string
                }
                Returns: Json
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
                Returns: undefined
            }
            increment_social_click: {
                Args: {
                    account_id: string
                }
                Returns: undefined
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
