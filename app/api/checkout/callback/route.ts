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

        const { ResultCode, ResultDesc, CheckoutRequestID } = body.Body.stkCallback

        // 1. Find the transaction related to this checkout request using the metadata
        const { data: transaction, error: tError } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .contains('metadata', { checkout_request_id: CheckoutRequestID })
            .single()

        if (tError || !transaction) {
            console.error('Transaction not found for CheckoutRequestID:', CheckoutRequestID)
            return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' }) // M-Pesa requires 0 even if we can't find it
        }

        if (ResultCode === 0) {
            // Payment Successful
            const amount = body.Body.stkCallback.CallbackMetadata.Item.find((i: any) => i.Name === 'Amount')?.Value
            const mpesaReceipt = body.Body.stkCallback.CallbackMetadata.Item.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value

            // Update the transaction
            await supabaseAdmin
                .from('transactions')
                .update({
                    status: 'completed',
                    mpesa_receipt_number: mpesaReceipt,
                    completed_at: new Date().toISOString()
                })
                .eq('id', transaction.id)

            // Update the order status to 'paid'
            if (transaction.order_id) {
                await supabaseAdmin
                    .from('orders')
                    .update({ status: 'paid' })
                    .eq('id', transaction.order_id)
            }

            console.log(`Payment confirmed for Order: ${transaction.order_id}`)

        } else {
            // Payment Failed
            console.log(`Payment failed (${ResultCode}): ${ResultDesc}`)

            // Delete the order and transaction as requested (cleanup)
            if (transaction.order_id) {
                // Deleting the order will cascade to order_items
                await supabaseAdmin
                    .from('orders')
                    .delete()
                    .eq('id', transaction.order_id)

                console.log(`Deleted failed Order: ${transaction.order_id}`)
            }

            // Also delete the transaction record
            await supabaseAdmin
                .from('transactions')
                .delete()
                .eq('id', transaction.id)
        }

        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })

    } catch (error: any) {
        console.error('Callback Handling Error:', error)
        return NextResponse.json({ ResultCode: 1, ResultDesc: 'Internal Error' })
    }
}
