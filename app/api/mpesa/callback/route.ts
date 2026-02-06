import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        console.log('M-Pesa Callback received:', JSON.stringify(body, null, 2))

        // Extract callback data
        const { Body } = body
        const { stkCallback } = Body

        if (!stkCallback) {
            return NextResponse.json({ error: 'Invalid callback format' }, { status: 400 })
        }

        const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback

        // Find transaction by checkout request ID
        const { data: transactions, error: findError } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .contains('metadata', { checkout_request_id: CheckoutRequestID })
            .eq('type', 'customer_payment')

        if (findError || !transactions || transactions.length === 0) {
            console.error('Transaction not found for CheckoutRequestID:', CheckoutRequestID)
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
        }

        const transaction = transactions[0]

        // ResultCode 0 means success
        if (ResultCode === 0) {
            // 1. Fetch the actual order to get dynamic pricing (subtotal, delivery fee)
            const { data: order, error: orderFetchError } = await supabaseAdmin
                .from('orders')
                .select('*')
                .eq('id', transaction.order_id)
                .single()

            if (orderFetchError || !order) {
                console.error('Order not found for transaction:', transaction.order_id)
                return NextResponse.json({ error: 'Order not found' }, { status: 404 })
            }

            // Extract payment details from callback metadata
            const metadata = CallbackMetadata?.Item || []
            const mpesaReceiptNumber = metadata.find((item: any) => item.Name === 'MpesaReceiptNumber')?.Value
            const transactionDate = metadata.find((item: any) => item.Name === 'TransactionDate')?.Value
            const phoneNumber = metadata.find((item: any) => item.Name === 'PhoneNumber')?.Value

            // 2. Calculate payment breakdown based on ACTUAL order fees
            const platformCommission = transaction.amount * (parseFloat(process.env.PLATFORM_COMMISSION || '10') / 100)
            const deliveryFee = order.delivery_fee
            const vendorShare = transaction.amount - platformCommission - deliveryFee
            const riderShare = deliveryFee

            // 3. Update transaction as completed
            const { error: updateTxError } = await supabaseAdmin
                .from('transactions')
                .update({
                    status: 'completed',
                    mpesa_receipt_number: mpesaReceiptNumber,
                    mpesa_transaction_id: transactionDate?.toString(),
                    phone_number: phoneNumber,
                    vendor_share: vendorShare,
                    rider_share: riderShare,
                    platform_commission: platformCommission,
                    completed_at: new Date().toISOString(),
                    metadata: {
                        ...transaction.metadata,
                        callback_data: CallbackMetadata,
                    },
                })
                .eq('id', transaction.id)

            if (updateTxError) {
                console.error('Failed to update transaction:', updateTxError)
            }

            // 4. Update order status to paid
            const { error: updateOrderError } = await supabaseAdmin
                .from('orders')
                .update({
                    status: 'paid',
                })
                .eq('id', order.id)

            if (updateOrderError) {
                console.error('Failed to update order:', updateOrderError)
            }

            // 5. Update vendor pending earnings
            await supabaseAdmin.rpc('increment', {
                table_name: 'vendors',
                row_id: order.vendor_id,
                column_name: 'pending_earnings',
                amount: vendorShare,
            }).catch(console.error)

            console.log('Payment successful:', mpesaReceiptNumber)
        } else {
            // Payment failed
            const { error: updateTxError } = await supabaseAdmin
                .from('transactions')
                .update({
                    status: 'failed',
                    metadata: {
                        ...transaction.metadata,
                        error_code: ResultCode,
                        error_message: ResultDesc,
                    },
                })
                .eq('id', transaction.id)

            if (updateTxError) {
                console.error('Failed to update transaction:', updateTxError)
            }

            // Update order status to payment failed
            if (transaction.order_id) {
                await supabaseAdmin
                    .from('orders')
                    .update({ status: 'payment_failed' })
                    .eq('id', transaction.order_id)
            }

            console.log('Payment failed:', ResultDesc)
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Callback processing error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to process callback' },
            { status: 500 }
        )
    }
}
