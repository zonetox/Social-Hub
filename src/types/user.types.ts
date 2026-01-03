
export interface User {
    id: string
    email: string
    username: string
    full_name: string
    avatar_url?: string
    bio?: string
    role: 'user' | 'admin'
    is_verified: boolean
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface Profile {
    id: string
    user_id: string
    display_name: string
    slug: string
    cover_image_url?: string
    website?: string
    location?: string
    tags?: string[]
    is_public: boolean
    view_count: number
    follower_count: number
    following_count: number
    created_at: string
    updated_at: string
    user?: User
    social_accounts?: SocialAccount[]
}

export interface SocialAccount {
    id: string
    profile_id: string
    platform: string
    platform_username: string
    platform_url: string
    display_order: number
    is_visible: boolean
    click_count: number
    created_at: string
    updated_at: string
}

export interface Follow {
    id: string
    follower_id: string
    following_id: string
    created_at: string
    follower?: User
    following?: User
}

export interface Analytics {
    id: string
    profile_id: string
    event_type: 'view' | 'click' | 'follow' | 'share'
    social_account_id?: string
    metadata?: any
    ip_address?: string
    user_agent?: string
    created_at: string
}
