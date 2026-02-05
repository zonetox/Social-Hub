'use client'

import { SiteHeader } from '@/components/shared/SiteHeader'
import { HeroSlider } from '@/components/landing/HeroSlider'
import { HomeSearch } from '@/components/landing/HomeSearch'
import { CategoryGrid } from '@/components/landing/CategoryGrid'
import { LatestRequests } from '@/components/landing/LatestRequests'
import { FeaturedBusinesses } from '@/components/landing/FeaturedBusinesses'
import { PublicFooter } from '@/components/shared/PublicFooter'

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* Navigation */}
            <SiteHeader />

            {/* Hero Section */}
            <div className="relative">
                <HeroSlider />

                {/* Floating Search Bar */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-10 z-20 w-full px-4">
                    <HomeSearch />
                </div>
            </div>

            {/* Main Content Sections */}
            <div className="max-w-7xl mx-auto px-4 pt-20 space-y-12 sm:space-y-20 pb-20">
                {/* Section C: Categories */}
                <CategoryGrid />

                {/* Section D: Latest Requests */}
                <LatestRequests />

                {/* Section E: Featured Businesses */}
                <FeaturedBusinesses />
            </div>

            {/* Footer */}
            <PublicFooter />
        </div>
    )
}
