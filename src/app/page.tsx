import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight, Share2, BarChart, Shield, Sparkles } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

export default function LandingPage() {
    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="glass sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Logo size="md" />
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="hidden sm:block">
                            <Button variant="ghost" className="font-bold">Log in</Button>
                        </Link>
                        <Link href="/register">
                            <Button className="premium-gradient border-none font-bold hover:scale-105 transition-transform">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-20 pb-32 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary-500/10 blur-[120px] rounded-full -z-10" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-white/20 text-primary-600 text-sm font-bold mb-8 animate-float">
                        <Sparkles className="w-4 h-4" />
                        Next-Gen Digital Profiles
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black text-gray-900 mb-8 tracking-tighter leading-none">
                        Connect Everything <br />
                        <span className="text-transparent bg-clip-text premium-gradient">In One Link</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                        Create a premium profile that reflects your unique identity.
                        Join <span className="text-gray-900 font-bold">thousands</span> of creators growing their reach.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20">
                        <Link href="/register">
                            <Button size="lg" className="h-14 px-10 text-xl premium-gradient border-none font-black shadow-2xl shadow-primary-500/20 hover:scale-105 transition-transform group">
                                Create your profile
                                <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform" />
                            </Button>
                        </Link>
                        <Link href="/hub">
                            <Button variant="outline" size="lg" className="h-14 px-10 text-xl font-bold bg-white/50 backdrop-blur-md">
                                Explore Hub
                            </Button>
                        </Link>
                    </div>

                    {/* Preview Dashboard */}
                    <div className="relative mx-auto max-w-5xl animate-float" style={{ animationDelay: '1s' }}>
                        <div className="absolute -inset-4 premium-gradient opacity-20 blur-3xl -z-10 rounded-[4rem]" />
                        <div className="glass p-3 rounded-[2.5rem] shadow-2xl">
                            <div className="aspect-[16/9] bg-white rounded-[2rem] overflow-hidden border border-white/20">
                                <img
                                    src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2574&auto=format&fit=crop"
                                    alt="Platform Preview"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-32 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {[
                            {
                                icon: Share2,
                                title: 'Unified Link',
                                description: 'Stop sharing multiple links. One link, one identity, total control.'
                            },
                            {
                                icon: BarChart,
                                title: 'Smart Insights',
                                description: 'Real-time analytics to understand your audience behavior and growth.'
                            },
                            {
                                icon: Shield,
                                title: 'Verification',
                                description: 'Build trust with a premium verification badge on your professional profile.'
                            }
                        ].map((feature, index) => (
                            <div key={index} className="glass p-10 rounded-[2.5rem] hover:scale-105 transition-transform duration-500">
                                <div className="w-16 h-16 premium-gradient rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-primary-500/20">
                                    <feature.icon className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">{feature.title}</h3>
                                <p className="text-gray-600 text-lg leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 glass mt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-10">
                    <Logo size="md" />
                    <div className="flex flex-col items-center md:items-end gap-2">
                        <p className="text-gray-900 font-bold">© 2024 Social HUB. All rights reserved.</p>
                        <p className="text-sm text-gray-500 font-medium">Elevating digital presence with Glassmorphism.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
