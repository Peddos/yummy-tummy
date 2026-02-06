import { NextRequest, NextResponse } from 'next/server'
import { mpesa } from '@/lib/mpesa/daraja'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const { orderId, phoneNumber, amount } = await request.json()

        // Validate request
        if (!orderId || !phoneNumber || !amount) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Get order details
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }

        // Verify amount matches order total
        if (Math.abs(order.total - amount) > 0.01) {
            return NextResponse.json(
                { error: 'Amount mismatch' },
                { status: 400 }
            )
        }

        // Initiate STK Push
        const stkResponse = await mpesa.stkPush({
            phoneNumber,
            amount,
            accountReference: order.order_number,
            transactionDesc: `Payment for order ${order.order_number}`,
        })

        // Create transaction record
        const { error: txError } = await supabaseAdmin
            .from('transactions')
            .insert({
                order_id: orderId,
                user_id: order.customer_id,
                type: 'customer_payment',
                status: 'pending',
                amount,
                phone_number: phoneNumber,
                metadata: {
                    checkout_request_id: stkResponse.CheckoutRequestID,
                    merchant_request_id: stkResponse.MerchantRequestID,
                },
            })

        if (txError) {
            console.error('Failed to create transaction record:', txError)
        }

        return NextResponse.json({
            success: true,
            message: stkResponse.CustomerMessage,
            checkoutRequestId: stkResponse.CheckoutRequestID,
        })
    } catch (error: any) {
        console.error('STK Push error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to initiate payment' },
            { status: 500 }
        )
    }
}
