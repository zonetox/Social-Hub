
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

    // Check admin access (only if on an admin route)
    if (session && adminRoutes.some(route => path.startsWith(route))) {
        try {
            const { data: user } = await supabase
                .from('users')
                .select('role')
                .eq('id', session.user.id)
                .single() as any

            if (user?.role !== 'admin') {
                return NextResponse.redirect(new URL('/hub', req.url))
            }
        } catch (error) {
            // If check fails, default to safe redirect
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
