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

        // Check if M-Pesa is configured. If not, simulate success for development.
        const isConfigured =
            process.env.MPESA_CONSUMER_KEY &&
            !process.env.MPESA_CONSUMER_KEY.includes('your_') &&
            process.env.MPESA_CONSUMER_SECRET &&
            !process.env.MPESA_CONSUMER_SECRET.includes('your_')

        if (!isConfigured) {
            console.log('⚠️ M-Pesa not configured. Simulating successful STK Push for Order:', orderId)

            // Simulating a "Paid" status directly in DB so user can test vendor/rider flow
            await supabaseAdmin
                .from('orders')
                .update({ status: 'paid' })
                .eq('id', orderId)

            return NextResponse.json({
                MerchantRequestID: 'SIM-12345',
                CheckoutRequestID: 'SIM-CHECKOUT-67890',
                ResponseCode: '0',
                ResponseDescription: 'Success (Simulated)',
                CustomerMessage: 'Success (Simulated)'
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
