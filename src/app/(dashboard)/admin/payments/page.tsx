'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatDate, formatNumber } from '@/lib/utils/formatting'
import {
    DollarSign,
    Check,
    X,
    Eye,
    Search,
    Filter,
    CreditCard,
    Building
} from 'lucide-react'
import { redirect } from 'next/navigation'
import type { PaymentTransaction } from '@/types/payment.types'

export default function AdminPaymentsPage() {
    const { isAdmin, loading: authLoading } = useAuth()
    const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
    const [filteredTransactions, setFilteredTransactions] = useState<PaymentTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null)
    const supabase = createClient()

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            redirect('/hub')
        }
    }, [authLoading, isAdmin])

    useEffect(() => {
        if (isAdmin) {
            fetchTransactions()
        }
    }, [isAdmin])

    useEffect(() => {
        filterTransactions()
    }, [transactions, searchQuery, statusFilter])

    const fetchTransactions = async () => {
        try {
            const { data, error } = await supabase
                .from('payment_transactions')
                .select(`
          *,
          user:users(full_name, username, email)
        `)
                .order('created_at', { ascending: false })

            if (error) throw error
            setTransactions((data || []) as any)
        } catch (error) {
            console.error('Fetch transactions error:', error)
        } finally {
            setLoading(false)
        }
    }

    const filterTransactions = () => {
        let filtered = [...transactions]

        if (statusFilter !== 'all') {
            filtered = filtered.filter(t => t.status === statusFilter)
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter((t: any) =>
                t.user?.full_name?.toLowerCase().includes(query) ||
                t.user?.username?.toLowerCase().includes(query) ||
                t.user?.email?.toLowerCase().includes(query) ||
                t.id.toLowerCase().includes(query)
            )
        }

        setFilteredTransactions(filtered)
    }

    const handleApprove = async (transactionId: string) => {
        if (!confirm('Approve this payment?')) return

        try {
            const transaction = transactions.find(t => t.id === transactionId)
            if (!transaction) return

            // Update transaction status first
            const { error: updateError } = await (supabase
                .from('payment_transactions') as any)
                .update({
                    status: 'completed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', transactionId)

            if (updateError) throw updateError

            // Process fulfillment based on type
            const metadata = transaction.metadata as any

            if (transaction.type === 'subscription') {
                const { data: plan } = await (supabase
                    .from('subscription_plans') as any)
                    .select('*')
                    .eq('id', metadata.planId)
                    .single()

                if (plan) {
                    const now = new Date()
                    const expiresAt = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000)

                    await (supabase.from('user_subscriptions') as any).insert({
                        user_id: transaction.user_id,
                        plan_id: plan.id,
                        status: 'active',
                        starts_at: now.toISOString(),
                        expires_at: expiresAt.toISOString(),
                        payment_method: transaction.payment_method
                    })

                    // Give verification badge
                    await (supabase
                        .from('users') as any)
                        .update({ is_verified: true, updated_at: new Date().toISOString() })
                        .eq('id', transaction.user_id)
                }
            } else if (transaction.type === 'credits') {
                await (supabase.from('card_credits') as any).insert({
                    user_id: transaction.user_id,
                    amount: metadata.creditAmount || 100
                })
            }

            alert('Payment approved successfully!')
            fetchTransactions()
        } catch (error) {
            console.error('Approve error:', error)
            alert('Failed to approve payment')
        }
    }

    const handleReject = async (transactionId: string) => {
        const reason = prompt('Reason for rejection:')
        if (!reason) return

        try {
            const { error } = await (supabase
                .from('payment_transactions') as any)
                .update({
                    status: 'failed',
                    notes: reason,
                    updated_at: new Date().toISOString()
                })
                .eq('id', transactionId)

            if (error) throw error

            alert('Payment rejected')
            fetchTransactions()
        } catch (error) {
            console.error('Reject error:', error)
            alert('Failed to reject payment')
        }
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    const stats = {
        total: transactions.length,
        pending: transactions.filter(t => t.status === 'pending').length,
        completed: transactions.filter(t => t.status === 'completed').length,
        revenue: transactions
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + Number(t.amount_usd), 0)
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
                <p className="text-gray-600">Review and approve payment transactions</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Total Transactions</p>
                        <DollarSign className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Pending Review</p>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                    </div>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Completed</p>
                        <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Total Revenue</p>
                        <DollarSign className="w-5 h-5 text-primary-600" />
                    </div>
                    <p className="text-3xl font-bold text-primary-600">
                        ${stats.revenue.toFixed(2)}
                    </p>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search by user, email, or transaction ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </Card>

            {/* Transactions Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Method
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTransactions.map((transaction: any) => (
                                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {transaction.user?.full_name || 'Unknown User'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                @{transaction.user?.username || 'unknown'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge variant={transaction.type === 'subscription' ? 'info' : 'default'}>
                                            {transaction.type}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                ${transaction.amount_usd}
                                            </p>
                                            {transaction.amount_vnd && (
                                                <p className="text-xs text-gray-500">
                                                    {transaction.amount_vnd.toLocaleString('vi-VN')} VNĐ
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-gray-700 capitalize">
                                            {transaction.payment_method.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {transaction.status === 'pending' && (
                                            <Badge variant="warning">Pending</Badge>
                                        )}
                                        {transaction.status === 'completed' && (
                                            <Badge variant="success">Completed</Badge>
                                        )}
                                        {transaction.status === 'failed' && (
                                            <Badge variant="danger">Failed</Badge>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(transaction.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setSelectedTransaction(transaction)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>

                                            {transaction.status === 'pending' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleApprove(transaction.id)}
                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleReject(transaction.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredTransactions.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No transactions found</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Transaction Detail Modal */}
            {selectedTransaction && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6 border-b pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
                                    <p className="text-sm text-gray-500 font-mono mt-1">{selectedTransaction.id}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedTransaction(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer</h3>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="font-bold text-gray-900">
                                            {(selectedTransaction as any).user?.full_name}
                                        </p>
                                        <p className="text-sm text-gray-600">@{(selectedTransaction as any).user?.username}</p>
                                        <p className="text-sm text-gray-600">{(selectedTransaction as any).user?.email}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Type</h3>
                                        <Badge variant={selectedTransaction.type === 'subscription' ? 'info' : 'default'} className="text-base py-1 px-3">
                                            {selectedTransaction.type}
                                        </Badge>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</h3>
                                        <Badge
                                            variant={
                                                selectedTransaction.status === 'pending' ? 'warning' :
                                                    selectedTransaction.status === 'completed' ? 'success' : 'danger'
                                            }
                                            className="text-base py-1 px-3"
                                        >
                                            {selectedTransaction.status}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Amount (USD)</h3>
                                        <p className="text-2xl font-black text-gray-900">
                                            ${selectedTransaction.amount_usd}
                                        </p>
                                    </div>
                                    {selectedTransaction.amount_vnd && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Amount (VND)</h3>
                                            <p className="text-2xl font-black text-gray-900">
                                                {selectedTransaction.amount_vnd.toLocaleString('vi-VN')} ₫
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment method</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            {selectedTransaction.payment_method === 'bank_transfer' ? <Building className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                        </div>
                                        <p className="font-bold text-gray-900 capitalize">
                                            {selectedTransaction.payment_method.replace('_', ' ')}
                                        </p>
                                    </div>
                                </div>

                                {selectedTransaction.proof_image_url && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment Proof</h3>
                                        <a
                                            href={selectedTransaction.proof_image_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block group relative overflow-hidden rounded-xl border-2 border-gray-100"
                                        >
                                            <img
                                                src={selectedTransaction.proof_image_url}
                                                alt="Payment proof"
                                                className="w-full object-cover max-h-[400px] transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <p className="text-white font-bold flex items-center gap-2">
                                                    <Eye className="w-5 h-5" />
                                                    View Full Screen
                                                </p>
                                            </div>
                                        </a>
                                    </div>
                                )}

                                {selectedTransaction.notes && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Admin Notes / Rejection Reason</h3>
                                        <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl italic">
                                            {selectedTransaction.notes}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 pt-4 border-t">
                                    <p>Created: {formatDate(selectedTransaction.created_at)}</p>
                                    <p className="text-right">Last Updated: {formatDate((selectedTransaction as any).updated_at)}</p>
                                </div>

                                {selectedTransaction.status === 'pending' && (
                                    <div className="flex gap-4 pt-4 mt-6 border-t border-gray-100">
                                        <Button
                                            onClick={() => handleApprove(selectedTransaction.id)}
                                            className="flex-1 py-6 text-lg"
                                            variant="primary"
                                        >
                                            <Check className="w-5 h-5" />
                                            Approve Payment
                                        </Button>
                                        <Button
                                            onClick={() => handleReject(selectedTransaction.id)}
                                            variant="danger"
                                            className="flex-1 py-6 text-lg"
                                        >
                                            <X className="w-5 h-5" />
                                            Reject Transaction
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
