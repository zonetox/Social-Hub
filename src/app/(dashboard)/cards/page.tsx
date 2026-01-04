'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useSubscription } from '@/lib/hooks/useSubscription'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate } from '@/lib/utils/formatting'
import {
    Send,
    Inbox,
    Eye,
    CreditCard,
    TrendingUp,
    Sparkles,
    ArrowRight,
    CheckCircle
} from 'lucide-react'
import Link from 'next/link'

interface CardSend {
    id: string
    sender_id: string
    receiver_id: string
    profile_id: string
    viewed: boolean
    viewed_at?: string
    created_at: string
    sender?: any
    receiver?: any
    profile?: any
}

export default function CardsPage() {
    const { user } = useAuth()
    const { cardBalance } = useSubscription()
    const [sentCards, setSentCards] = useState<CardSend[]>([])
    const [receivedCards, setReceivedCards] = useState<CardSend[]>([])
    const [activeTab, setActiveTab] = useState<'sent' | 'received'>('received')
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        if (user) {
            fetchCards()
        }
    }, [user])

    const fetchCards = async () => {
        if (!user) return

        try {
            // Fetch sent cards
            const { data: sent } = await supabase
                .from('card_sends')
                .select(`
          *,
          receiver:users!card_sends_receiver_id_fkey(full_name, username, avatar_url),
          profile:profiles(display_name, slug)
        `)
                .eq('sender_id', user.id)
                .order('created_at', { ascending: false })

            // Fetch received cards
            const { data: received } = await supabase
                .from('card_sends')
                .select(`
          *,
          sender:users!card_sends_sender_id_fkey(full_name, username, avatar_url),
          profile:profiles(display_name, slug)
        `)
                .eq('receiver_id', user.id)
                .order('created_at', { ascending: false })

            setSentCards((sent || []) as any)
            setReceivedCards((received || []) as any)
        } catch (error) {
            console.error('Fetch cards error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleMarkAsViewed = async (cardId: string) => {
        try {
            await (supabase
                .from('card_sends') as any)
                .update({
                    viewed: true,
                    viewed_at: new Date().toISOString()
                })
                .eq('id', cardId)

            fetchCards()
        } catch (error) {
            console.error('Mark viewed error:', error)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    const stats = {
        sent: sentCards.length,
        received: receivedCards.length,
        unread: receivedCards.filter(c => !c.viewed).length,
        viewRate: sentCards.length > 0
            ? Math.round((sentCards.filter(c => c.viewed).length / sentCards.length) * 100)
            : 0
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-4xl font-black text-gray-900 mb-2">My Cards</h1>
                <p className="text-gray-600">
                    Manage your sent and received digital profile cards
                </p>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <Card className="p-6 premium-gradient-light border-none shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-primary-900 uppercase tracking-wider">Balance</p>
                        <div className="p-2 bg-white/50 rounded-lg">
                            <CreditCard className="w-5 h-5 text-primary-600" />
                        </div>
                    </div>
                    <p className="text-4xl font-black text-gray-900 mb-2">{cardBalance}</p>
                    <Link href="/pricing" className="text-sm font-bold text-primary-700 hover:text-primary-800 flex items-center gap-1 group">
                        Buy more Credits
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                </Card>

                <Card className="p-6 bg-white shadow-lg border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Sent</p>
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Send className="w-5 h-5 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-4xl font-black text-gray-900">{stats.sent}</p>
                    <p className="text-xs text-gray-400 mt-2">Total cards shared</p>
                </Card>

                <Card className="p-6 bg-white shadow-lg border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Received</p>
                        <div className="p-2 bg-green-50 rounded-lg">
                            <Inbox className="w-5 h-5 text-green-600" />
                        </div>
                    </div>
                    <p className="text-4xl font-black text-gray-900">{stats.received}</p>
                    {stats.unread > 0 ? (
                        <Badge variant="success" className="mt-2">{stats.unread} New</Badge>
                    ) : (
                        <p className="text-xs text-gray-400 mt-2">All cards viewed</p>
                    )}
                </Card>

                <Card className="p-6 bg-white shadow-lg border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Engagement</p>
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-4xl font-black text-gray-900">{stats.viewRate}%</p>
                    <p className="text-xs text-gray-400 mt-2">Profile view rate</p>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-2xl mb-8 w-fit">
                <button
                    onClick={() => setActiveTab('received')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'received'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Inbox className="w-5 h-5" />
                    Received
                    <span className="ml-1 bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        {stats.received}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('sent')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'sent'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Send className="w-5 h-5" />
                    Sent
                    <span className="ml-1 bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                        {stats.sent}
                    </span>
                </button>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeTab === 'received' ? (
                    <>
                        {receivedCards.length === 0 ? (
                            <Card className="p-16 text-center lg:col-span-2 bg-white/50 border-dashed border-2 border-gray-200 rounded-3xl">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Inbox className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    Inbox is empty
                                </h3>
                                <p className="text-gray-500 max-w-sm mx-auto">
                                    When other users send you their digital profile cards, they will appear right here.
                                </p>
                            </Card>
                        ) : (
                            receivedCards.map(card => (
                                <Card key={card.id} className={`p-6 bg-white hover:shadow-xl transition-all duration-300 border-l-4 ${!card.viewed ? 'border-primary-500 shadow-md ring-1 ring-primary-100' : 'border-gray-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                {card.sender?.avatar_url ? (
                                                    <img
                                                        src={card.sender.avatar_url}
                                                        alt={card.sender.full_name}
                                                        className="w-16 h-16 rounded-2xl object-cover shadow-sm"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center shadow-sm">
                                                        <span className="text-2xl font-black text-white">
                                                            {card.sender?.full_name?.charAt(0)}
                                                        </span>
                                                    </div>
                                                )}
                                                {!card.viewed && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-500 rounded-full border-2 border-white animate-pulse" />
                                                )}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-lg text-gray-900">
                                                        {card.sender?.full_name}
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-gray-500">
                                                    @{card.sender?.username} • {formatDate(card.created_at)}
                                                </p>
                                                {!card.viewed && (
                                                    <Badge variant="premium" className="mt-2 bg-primary-50 text-primary-700 border-primary-100">
                                                        <Sparkles className="w-3 h-3 mr-1" /> New Card
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <Link href={`/${card.profile?.slug}`}>
                                            <Button
                                                size="md"
                                                onClick={() => !card.viewed && handleMarkAsViewed(card.id)}
                                                className="rounded-xl shadow-sm"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                View
                                            </Button>
                                        </Link>
                                    </div>
                                </Card>
                            ))
                        )}
                    </>
                ) : (
                    <>
                        {sentCards.length === 0 ? (
                            <Card className="p-16 text-center lg:col-span-2 bg-white/50 border-dashed border-2 border-gray-200 rounded-3xl">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Send className="w-10 h-10 text-gray-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    No cards sent yet
                                </h3>
                                <p className="text-gray-500 max-w-sm mx-auto mb-8">
                                    Go to the Hub and send your digital profile card to users you'd like to connect with.
                                </p>
                                <Link href="/hub">
                                    <Button className="rounded-xl px-8 py-6 text-lg premium-gradient border-none">
                                        Explore Hub
                                    </Button>
                                </Link>
                            </Card>
                        ) : (
                            sentCards.map(card => (
                                <Card key={card.id} className="p-6 bg-white hover:shadow-xl transition-all duration-300 group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {card.receiver?.avatar_url ? (
                                                <img
                                                    src={card.receiver.avatar_url}
                                                    alt={card.receiver.full_name}
                                                    className="w-16 h-16 rounded-2xl object-cover"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                                                    <span className="text-2xl font-black text-gray-400">
                                                        {card.receiver?.full_name?.charAt(0)}
                                                    </span>
                                                </div>
                                            )}

                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900 mb-0.5">
                                                    {card.receiver?.full_name}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    @{card.receiver?.username} • {formatDate(card.created_at)}
                                                </p>
                                                <div className="mt-2 flex items-center gap-3">
                                                    {card.viewed ? (
                                                        <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            Viewed {card.viewed_at && formatDate(card.viewed_at)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">
                                                            Pending Review
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
