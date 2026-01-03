// ============================================
// src/app/page.tsx - Landing Page
// ============================================

import Link from 'next/link'
import { 
  Globe, 
  Zap, 
  Shield, 
  Users, 
  TrendingUp, 
  Check,
  ArrowRight,
  Star
} from 'lucide-react'

export default function LandingPage() {
  const features = [
    {
      icon: Globe,
      title: 'All-in-One Hub',
      description: 'Consolidate all your social media profiles in one beautiful page'
    },
    {
      icon: Zap,
      title: 'Instant Setup',
      description: 'Get started in minutes with our intuitive interface'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Full control over what you share and who can see it'
    },
    {
      icon: Users,
      title: 'Build Community',
      description: 'Connect with others and grow your audience effortlessly'
    },
    {
      icon: TrendingUp,
      title: 'Track Analytics',
      description: 'Monitor views, clicks, and engagement on your profiles'
    },
  ]

  const platforms = [
    'Instagram', 'TikTok', 'Twitter/X', 'YouTube', 'LinkedIn',
    'Facebook', 'Threads', 'Discord', 'Telegram', 'Pinterest',
    'Reddit', 'Snapchat', 'Twitch', 'GitHub', 'WhatsApp'
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-white">S</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Social Hub
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 font-medium transition-all shadow-sm hover:shadow-md"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50 -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-8">
              <Star className="w-4 h-4 fill-current" />
              Join thousands of creators
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              One Link For
              <span className="block bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                All Your Socials
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 leading-relaxed">
              Create a stunning hub for all your social media profiles. Share one link and let your audience find you everywhere.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
              >
                Create Your Hub
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/hub"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 font-semibold text-lg transition-all"
              >
                Explore Creators
              </Link>
            </div>

            {/* Social Proof */}
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 border-2 border-white" />
                  ))}
                </div>
                <span className="font-medium">1,000+ creators</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
                <span className="ml-1 font-medium">5.0 rating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Support For All Major Platforms
            </h2>
            <p className="text-lg text-gray-600">
              Connect your accounts from 15+ social media platforms
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {platforms.map(platform => (
              <div
                key={platform}
                className="px-6 py-3 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                {platform}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features to help you grow and connect with your audience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="p-8 bg-white border border-gray-200 rounded-2xl hover:border-primary-300 hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join thousands of creators who are already using Social Hub
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-xl hover:bg-gray-50 font-semibold text-lg transition-all shadow-xl"
          >
            Create Your Free Hub
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-white/80 text-sm mt-6">
            No credit card required • Free forever
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-white">S</span>
                </div>
                <span className="text-xl font-bold">Social Hub</span>
              </div>
              <p className="text-gray-400 text-sm">
                One link for all your social media profiles
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/hub" className="hover:text-white">Explore</a></li>
                <li><a href="/register" className="hover:text-white">Sign Up</a></li>
                <li><a href="/login" className="hover:text-white">Sign In</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/about" className="hover:text-white">About</a></li>
                <li><a href="/contact" className="hover:text-white">Contact</a></li>
                <li><a href="/blog" className="hover:text-white">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="/privacy" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 Social Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// ============================================
// src/app/not-found.tsx
// ============================================

import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-3xl font-bold text-gray-900 mt-4 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 font-medium transition-all"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 font-medium transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// src/app/globals.css
// ============================================

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply border-gray-200;
  }
  
  html {
    @apply antialiased;
  }

  body {
    @apply bg-gray-50 text-gray-900;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-400 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-500;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

// ============================================
// src/middleware.ts
// ============================================

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

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
// .gitignore
// ============================================

# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts