import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key for backend operations to bypass RLS if needed
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
    try {
        const body = await req.json()
        console.log('M-Pesa Callback Received:', JSON.stringify(body, null, 2))

        const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = body.Body.stkCallback

        if (ResultCode === 0) {
            // Payment Successful
            const amount = CallbackMetadata.Item.find((i: any) => i.Name === 'Amount')?.Value
            const mpesaReceipt = CallbackMetadata.Item.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value
            const phone = CallbackMetadata.Item.find((i: any) => i.Name === 'PhoneNumber')?.Value

            // 1. Find the transaction related to this checkout request
            // Typically you would store the CheckoutRequestID in the transaction record when initiating
            // For now, we'll try to find the pending transaction for this user/order 
            // Better implementation: Map CheckoutRequestID to Transaction record in a DB

            // 2. Update the transaction
            const { data: transaction, error: tError } = await supabaseAdmin
                .from('transactions')
                .update({
                    status: 'completed',
                    mpesa_receipt_number: mpesaReceipt,
                    completed_at: new Date().toISOString()
                })
                .eq('status', 'pending') // Simplified for demo
                .order('created_at', { ascending: false })
                .limit(1)
                .select()
                .single()

            if (transaction) {
                // 3. Update the order status to 'paid'
                await supabaseAdmin
                    .from('orders')
                    .update({ status: 'paid' })
                    .eq('id', transaction.order_id)
            }

        } else {
            // Payment Failed
            console.log(`Payment failed: ${ResultDesc}`)
        }

        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })

    } catch (error: any) {
        console.error('Callback Handling Error:', error)
        return NextResponse.json({ ResultCode: 1, ResultDesc: 'Internal Error' })
    }
}
