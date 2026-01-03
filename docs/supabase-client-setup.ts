// ============================================
// src/types/database.types.ts
// ============================================

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

// ============================================
// src/types/user.types.ts
// ============================================

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

// ============================================
// src/lib/supabase/client.ts
// ============================================

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database.types'

export const createClient = () => {
  return createClientComponentClient<Database>()
}

// ============================================
// src/lib/supabase/server.ts
// ============================================

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export const createServerClient = () => {
  return createServerComponentClient<Database>({ cookies })
}

// ============================================
// src/lib/supabase/middleware.ts
// ============================================

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  const protectedRoutes = ['/hub', '/profile', '/settings']
  const adminRoutes = ['/admin']
  const authRoutes = ['/login', '/register']

  const path = req.nextUrl.pathname

  // Redirect authenticated users away from auth pages
  if (session && authRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/hub', req.url))
  }

  // Redirect unauthenticated users to login
  if (!session && protectedRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Check admin access
  if (session && adminRoutes.some(route => path.startsWith(route))) {
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (user?.role !== 'admin') {
      return NextResponse.redirect(new URL('/hub', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

// ============================================
// src/lib/utils/constants.ts
// ============================================

export const SOCIAL_PLATFORMS = [
  { 
    name: 'Facebook', 
    icon: 'facebook',
    color: '#1877F2',
    urlPattern: 'https://facebook.com/'
  },
  { 
    name: 'Instagram', 
    icon: 'instagram',
    color: '#E4405F',
    urlPattern: 'https://instagram.com/'
  },
  { 
    name: 'TikTok', 
    icon: 'music',
    color: '#000000',
    urlPattern: 'https://tiktok.com/@'
  },
  { 
    name: 'Twitter/X', 
    icon: 'twitter',
    color: '#1DA1F2',
    urlPattern: 'https://twitter.com/'
  },
  { 
    name: 'YouTube', 
    icon: 'youtube',
    color: '#FF0000',
    urlPattern: 'https://youtube.com/@'
  },
  { 
    name: 'LinkedIn', 
    icon: 'linkedin',
    color: '#0A66C2',
    urlPattern: 'https://linkedin.com/in/'
  },
  { 
    name: 'Threads', 
    icon: 'at-sign',
    color: '#000000',
    urlPattern: 'https://threads.net/@'
  },
  { 
    name: 'Telegram', 
    icon: 'send',
    color: '#26A5E4',
    urlPattern: 'https://t.me/'
  },
  { 
    name: 'Discord', 
    icon: 'message-circle',
    color: '#5865F2',
    urlPattern: 'https://discord.com/users/'
  },
  { 
    name: 'Snapchat', 
    icon: 'ghost',
    color: '#FFFC00',
    urlPattern: 'https://snapchat.com/add/'
  },
  { 
    name: 'Pinterest', 
    icon: 'pin',
    color: '#E60023',
    urlPattern: 'https://pinterest.com/'
  },
  { 
    name: 'Reddit', 
    icon: 'reddit',
    color: '#FF4500',
    urlPattern: 'https://reddit.com/u/'
  },
  { 
    name: 'WhatsApp', 
    icon: 'message-circle',
    color: '#25D366',
    urlPattern: 'https://wa.me/'
  },
  { 
    name: 'Twitch', 
    icon: 'twitch',
    color: '#9146FF',
    urlPattern: 'https://twitch.tv/'
  },
  { 
    name: 'GitHub', 
    icon: 'github',
    color: '#181717',
    urlPattern: 'https://github.com/'
  },
  { 
    name: 'Website', 
    icon: 'globe',
    color: '#6B7280',
    urlPattern: 'https://'
  },
]

export const AVATAR_EMOJIS = [
  '👤', '😊', '🎨', '🎵', '🎮', '📸', '✨', '🌟', 
  '🔥', '💎', '🎯', '🚀', '💼', '🎭', '🎪', '🎬'
]

export const MAX_BIO_LENGTH = 160
export const MAX_DISPLAY_NAME_LENGTH = 50
export const MAX_SOCIAL_ACCOUNTS = 20

// ============================================
// src/lib/utils/validation.ts
// ============================================

import { z } from 'zod'

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const profileSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be less than 50 characters'),
  bio: z
    .string()
    .max(160, 'Bio must be less than 160 characters')
    .optional(),
  website: z
    .string()
    .url('Invalid URL')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .max(50, 'Location must be less than 50 characters')
    .optional(),
  tags: z
    .array(z.string())
    .max(5, 'Maximum 5 tags allowed')
    .optional(),
})

export const socialAccountSchema = z.object({
  platform: z.string().min(1, 'Platform is required'),
  platform_username: z
    .string()
    .min(1, 'Username is required')
    .max(50, 'Username too long'),
  platform_url: z.string().url('Invalid URL'),
})

// ============================================
// src/lib/utils/formatting.ts
// ============================================

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatDate(date: string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 30) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}