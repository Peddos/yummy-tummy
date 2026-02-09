import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('--- M-PESA CALLBACK START ---')
        console.log('Payload:', JSON.stringify(body, null, 2))

        const { Body } = body
        if (!Body?.stkCallback) {
            console.error('CRITICAL: Malformed M-Pesa body received.')
            return NextResponse.json({ ResultCode: 1, ResultDesc: 'Malformed body' })
        }

        const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback
        console.log(`Processing ID: ${CheckoutRequestID} | Result: ${ResultCode} (${ResultDesc})`)

        // Find transaction. Note: We use a more flexible search for metadata
        const { data: transaction, error: findError } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .filter('metadata->>checkout_request_id', 'eq', CheckoutRequestID)
            .single() as { data: any | null, error: any }

        if (findError || !transaction) {
            console.error('SEARCH FAILED: No transaction found with CheckoutRequestID:', CheckoutRequestID)
            // Still return 0 to Safaricom so they stop retrying
            return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success (but log: tx not found)' })
        }

        const tx = transaction as any
        console.log('MATCH FOUND: Internal Transaction ID:', tx.id)

        if (ResultCode === 0) {
            // SUCCESS FLOW
            const metadataItems = CallbackMetadata?.Item || []
            const mpesaReceipt = metadataItems.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value
            const amount = metadataItems.find((i: any) => i.Name === 'Amount')?.Value

            console.log(`PAYMENT VERIFIED: Receipt ${mpesaReceipt} | Amount: ${amount}`)

            // Update Transaction
            await (supabaseAdmin
                .from('transactions') as any)
                .update({
                    status: 'completed',
                    mpesa_receipt_number: mpesaReceipt,
                    completed_at: new Date().toISOString(),
                    metadata: {
                        ...((tx.metadata as object) || {}),
                        full_callback: Body.stkCallback
                    }
                })
                .eq('id', tx.id)

            // Update Order
            if (tx.order_id) {
                const { error: orderUpdateErr } = await (supabaseAdmin
                    .from('orders') as any)
                    .update({ status: 'paid' })
                    .eq('id', tx.order_id)

                if (orderUpdateErr) console.error('ORDER UPDATE FAILED:', orderUpdateErr)
                else console.log('ORDER STATUS: Successfully marked as PAID')
            }

        } else {
            // FAILURE/CANCELLATION FLOW
            console.warn(`PAYMENT REJECTED: ${ResultDesc}`)
            await (supabaseAdmin
                .from('transactions') as any)
                .update({
                    status: 'failed',
                    metadata: {
                        ...((tx.metadata as object) || {}),
                        failure_reason: ResultDesc
                    }
                })
                .eq('id', tx.id)

            // Optional: Mark order as payment_failed instead of deleting to allow retry
            if (tx.order_id) {
                await (supabaseAdmin
                    .from('orders') as any)
                    .update({ status: 'payment_failed' })
                    .eq('id', tx.order_id)
            }
        }

        console.log('--- M-PESA CALLBACK END ---')
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Success' })

    } catch (error: any) {
        console.error('CALLBACK FATAL ERROR:', error)
        return NextResponse.json({ ResultCode: 1, ResultDesc: 'Internal Server Error' })
    }
}
