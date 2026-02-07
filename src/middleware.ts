
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient<Database>({ req, res })

    const {
        data: { session },
    } = await supabase.auth.getSession()

    const path = req.nextUrl.pathname

    // Protected routes
    const protectedRoutes = ['/dashboard']
    const adminRoutes = ['/dashboard/admin']
    const authRoutes = ['/login', '/register']
    const isApiRoute = path.startsWith('/api/')

    // 1. Redirect authenticated users away from auth pages
    if (session && authRoutes.some(route => path.startsWith(route))) {
        const redirectRes = NextResponse.redirect(new URL('/dashboard', req.url))
        return redirectRes
    }

    // 2. Protect Routes (Dashboard & Admin)
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))

    if (!session && isProtectedRoute) {
        // FIX-03: API routes should return 401 JSON, not redirect
        if (isApiRoute) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Authentication required' },
                { status: 401 }
            )
        }

        // Page routes redirect to login
        const redirectRes = NextResponse.redirect(new URL('/login', req.url))
        return redirectRes
    }

    // 3. Admin Access Control
    if (session && adminRoutes.some(route => path.startsWith(route))) {
        try {
            const { data: user } = await supabase
                .from('users')
                .select('role')
                .eq('id', session.user.id)
                .maybeSingle() as any

            if (user?.role !== 'admin') {
                if (isApiRoute) {
                    return NextResponse.json(
                        { error: 'Forbidden', message: 'Admin access required' },
                        { status: 403 }
                    )
                }
                return NextResponse.redirect(new URL('/dashboard', req.url))
            }
        } catch (error) {
            console.error('Middleware admin check error:', error)
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }
    }

    return res
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
