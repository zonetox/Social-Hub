'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '../types/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

interface PurchaseResult {
    success: boolean
    message?: string
    transactionId?: string
}

export async function initiateCreditPurchase(
    packageId: string,
    credits: number,
    amountVnd: number,
    proofUrl: string
): Promise<PurchaseResult> {
    const supabase = createClient() as SupabaseClient<Database>

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Unauthorized' }

    // Create Transaction
    const { data, error } = await supabase
        .from('payment_transactions')
        .insert({
            user_id: user.id,
            type: 'credit_purchase',
            amount_usd: 0, // Assuming 0 for VND native flow
            amount_vnd: amountVnd,
            currency: 'VND',
            payment_method: 'bank_transfer',
            status: 'pending',
            proof_image_url: proofUrl,
            metadata: {
                package_id: packageId,
                credits: credits
            }
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating transaction:', error)
        return { success: false, message: error.message }
    }

    return { success: true, transactionId: data.id }
}

export async function approveCreditTransaction(transactionId: string): Promise<PurchaseResult> {
    const supabase = createClient() as SupabaseClient<Database>
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, message: 'Unauthorized' }

    const { data: result, error } = await supabase.rpc(
        'approve_credit_transaction',
        { p_transaction_id: transactionId }
    )

    if (error) {
        console.error('RPC Error:', error)
        return { success: false, message: error.message }
    }

    const castedResult = result as { success: boolean, message: string } | null

    if (!castedResult || !castedResult.success) {
        return { success: false, message: castedResult?.message || 'Approval failed' }
    }

    return { success: true, message: 'Transaction approved successfully' }
}
