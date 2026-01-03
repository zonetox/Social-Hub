// @ts-nocheck
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight, Share2, BarChart, Shield, Zap } from 'lucide-react'

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center text-white font-bold">
                            S
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
                            Social Hub
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost">Log in</Button>
                        </Link>
                        <Link href="/register">
                            <Button>Get Started</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-20 pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
                            All your links in{' '}
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-secondary-500">
                                one place
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
                            Create a beautiful, personalized profile to showcase all your social media accounts.
                            Track clicks, analyze traffic, and grow your audience.
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <Link href="/register">
                                <Button size="lg" className="h-12 px-8 text-lg">
                                    Create your profile
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <Link href="/hub">
                                <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
                                    Explore Hub
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="relative mx-auto max-w-5xl">
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
                        <div className="bg-gray-100 rounded-xl p-2 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                            <div className="aspect-[16/9] bg-white rounded-lg overflow-hidden border border-gray-200">
                                <img
                                    src="https://images.unsplash.com/photo-1542315053-ec52dd9c4909?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                                    alt="Dashboard Preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Everything you need to grow
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Powerful features to help you manage your online presence and understand your audience.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Share2,
                                title: 'One Link for Everything',
                                description: 'Share all your social profiles with a single link. Perfect for Instagram bio, Twitter, and more.'
                            },
                            {
                                icon: BarChart,
                                title: 'Detailed Analytics',
                                description: 'Track views, clicks, and engagement. Understand where your audience is coming from.'
                            },
                            {
                                icon: Shield,
                                title: 'Verified Profiles',
                                description: 'Get verified to build trust with your audience. Stand out from the crowd.'
                            }
                        ].map((feature, index) => (
                            <div key={index} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-6">
                                    <feature.icon className="w-6 h-6 text-primary-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-12 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded flex items-center justify-center text-white text-xs font-bold">
                            S
                        </div>
                        <span className="font-semibold text-gray-900">Social Hub</span>
                    </div>
                    <p className="text-sm text-gray-500">
                        © 2024 Social Hub. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
