
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

    // Redirect authenticated users away from auth pages
    if (session && authRoutes.some(route => path.startsWith(route))) {
        const redirectRes = NextResponse.redirect(new URL('/dashboard/requests', req.url))
        // Copy cookies from original res to redirectRes
        res.cookies.getAll().forEach(cookie => {
            redirectRes.cookies.set(cookie.name, cookie.value)
        })
        return redirectRes
    }

    // Redirect unauthenticated users to login
    if (!session && protectedRoutes.some(route => path.startsWith(route))) {
        const redirectRes = NextResponse.redirect(new URL('/login', req.url))
        // Ensure cookies are cleared/reset correctly on redirect
        res.cookies.getAll().forEach(cookie => {
            redirectRes.cookies.set(cookie.name, cookie.value)
        })
        return redirectRes
    }

    // Check admin access (only if on an admin route)
    if (session && adminRoutes.some(route => path.startsWith(route))) {
        try {
            const { data: user } = await supabase
                .from('users')
                .select('role')
                .eq('id', session.user.id)
                .maybeSingle() as any

            if (user?.role !== 'admin') {
                const redirectRes = NextResponse.redirect(new URL('/dashboard/requests', req.url))
                res.cookies.getAll().forEach(cookie => {
                    redirectRes.cookies.set(cookie.name, cookie.value)
                })
                return redirectRes
            }
        } catch (error) {
            const redirectRes = NextResponse.redirect(new URL('/dashboard/requests', req.url))
            res.cookies.getAll().forEach(cookie => {
                redirectRes.cookies.set(cookie.name, cookie.value)
            })
            return redirectRes
        }
    }

    return res
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
