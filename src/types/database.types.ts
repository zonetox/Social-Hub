
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
            users: {
                Row: {
                    id: string
                    email: string
                    username: string
                    full_name: string
                    avatar_url: string | null
                    bio: string | null
                    role: 'user' | 'admin'
                    is_verified: boolean
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    username: string
                    full_name: string
                    avatar_url?: string | null
                    bio?: string | null
                    role?: 'user' | 'admin'
                    is_verified?: boolean
                    is_active?: boolean
                }
                Update: {
                    email?: string
                    username?: string
                    full_name?: string
                    avatar_url?: string | null
                    bio?: string | null
                    role?: 'user' | 'admin'
                    is_verified?: boolean
                    is_active?: boolean
                }
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
                    is_public: boolean
                    view_count: number
                    follower_count: number
                    following_count: number
                    created_at: string
                    updated_at: string
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
                    is_public?: boolean
                    view_count?: number
                    follower_count?: number
                    following_count?: number
                }
                Update: {
                    display_name?: string
                    slug?: string
                    cover_image_url?: string | null
                    website?: string | null
                    location?: string | null
                    tags?: string[] | null
                    is_public?: boolean
                }
            }
            social_accounts: {
                Row: {
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
                Insert: {
                    id?: string
                    profile_id: string
                    platform: string
                    platform_username: string
                    platform_url: string
                    display_order?: number
                    is_visible?: boolean
                    click_count?: number
                }
                Update: {
                    platform?: string
                    platform_username?: string
                    platform_url?: string
                    display_order?: number
                    is_visible?: boolean
                }
            }
            follows: {
                Row: {
                    id: string
                    follower_id: string
                    following_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    follower_id: string
                    following_id: string
                }
                Delete: {
                    follower_id: string
                    following_id: string
                }
            }
            analytics: {
                Row: {
                    id: string
                    profile_id: string
                    event_type: 'view' | 'click' | 'follow' | 'share'
                    social_account_id: string | null
                    metadata: Json | null
                    ip_address: string | null
                    user_agent: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    profile_id: string
                    event_type: 'view' | 'click' | 'follow' | 'share'
                    social_account_id?: string | null
                    metadata?: Json | null
                    ip_address?: string | null
                    user_agent?: string | null
                }
            }
        }
    }
}
