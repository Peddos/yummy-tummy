import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/api'
import { supabaseAdmin } from '@/lib/supabase/server'
import { mpesa } from '@/lib/mpesa/daraja'
import { formatPhoneForMpesa } from '@/lib/utils'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { amount, phone, orderId } = await req.json()

        if (!amount || !phone || !orderId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Determine if we should simulate payment
        // Simulate if: 1) M-Pesa not configured OR 2) Explicitly in sandbox mode
        const shouldSimulate =
            !process.env.MPESA_CONSUMER_KEY ||
            process.env.MPESA_CONSUMER_KEY.includes('your_') ||
            !process.env.MPESA_CONSUMER_SECRET ||
            process.env.MPESA_CONSUMER_SECRET.includes('your_') ||
            process.env.MPESA_ENVIRONMENT === 'sandbox' // Force simulation in sandbox

        if (shouldSimulate) {
            console.log('💳 SIMULATING PAYMENT (Sandbox Mode) for Order:', orderId)

            // Get order details for financial calculation
            const { data: order, error: orderError } = await supabaseAdmin
                .from('orders')
                .select('subtotal, delivery_fee')
                .eq('id', orderId)
                .single() as { data: any, error: any }

            if (orderError || !order) {
                console.error('Failed to fetch order for simulation:', orderError)
                throw new Error('Order not found')
            }

            // Get commission rate
            const { data: settings } = await supabaseAdmin
                .from('system_settings')
                .select('value')
                .eq('key', 'vendor_commission_percentage')
                .single() as { data: any }

            const commissionRate = settings ? Number(settings.value) / 100 : 0.10

            // Calculate financial breakdown
            const platformCommission = Math.round(order.subtotal * commissionRate * 100) / 100
            const vendorShare = Math.round((order.subtotal - platformCommission) * 100) / 100
            const riderShare = order.delivery_fee

            console.log('💰 Financial Breakdown:', {
                subtotal: order.subtotal,
                deliveryFee: order.delivery_fee,
                platformCommission,
                vendorShare,
                riderShare
            })

            // Update transaction with financial breakdown
            const { error: txError } = await supabaseAdmin
                .from('transactions')
                .update({
                    status: 'completed',
                    mpesa_receipt_number: 'SIM-' + Date.now(),
                    vendor_share: vendorShare,
                    rider_share: riderShare,
                    platform_commission: platformCommission
                } as any)
                .eq('order_id', orderId)
                .eq('type', 'customer_payment')

            if (txError) {
                console.error('Failed to update transaction:', txError)
            } else {
                console.log('✅ Transaction updated with financial breakdown')
            }

            // Update order status to paid
            const { error: orderUpdateError } = await supabaseAdmin
                .from('orders')
                .update({ status: 'paid' } as any)
                .eq('id', orderId)

            if (orderUpdateError) {
                console.error('Failed to update order status:', orderUpdateError)
            } else {
                console.log('✅ Order marked as PAID')
            }

            return NextResponse.json({
                MerchantRequestID: 'SIM-12345',
                CheckoutRequestID: 'SIM-CHECKOUT-67890',
                ResponseCode: '0',
                ResponseDescription: 'Success (Simulated - Sandbox Mode)',
                CustomerMessage: 'Payment simulated successfully'
            })
        }

        // Format phone to 254XXXXXXXXX
        const formattedPhone = formatPhoneForMpesa(phone)

        // Initiate STK Push
        const response = await mpesa.stkPush({
            phoneNumber: formattedPhone,
            amount: amount,
            accountReference: orderId.substring(0, 12).toUpperCase(),
            transactionDesc: `Payment for Order ${orderId}`
        })

        // Save the STK Push request IDs to the transaction metadata so we can find it in the callback
        if (response.ResponseCode === '0') {
            const { error: txError } = await supabaseAdmin
                .from('transactions')
                .update({
                    metadata: {
                        checkout_request_id: response.CheckoutRequestID,
                        merchant_request_id: response.MerchantRequestID,
                    }
                })
                .eq('order_id', orderId)
                .eq('type', 'customer_payment')

            if (txError) {
                console.error('Failed to update transaction metadata:', txError)
            }
        }

        return NextResponse.json(response)

    } catch (error: any) {
        console.error('M-Pesa STK Push Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
