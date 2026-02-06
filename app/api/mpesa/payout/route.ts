import { NextRequest, NextResponse } from 'next/server'
import { mpesa } from '@/lib/mpesa/daraja'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const { vendorId, riderId, amount, type } = await request.json()

        if (!amount || !type) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const userId = vendorId || riderId
        if (!userId) {
            return NextResponse.json(
                { error: 'User ID required' },
                { status: 400 }
            )
        }

        // Get user phone number
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('phone')
            .eq('id', userId)
            .single()

        if (profileError || !profile) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Initiate B2C payment
        const b2cResponse = await mpesa.b2cPayment({
            phoneNumber: profile.phone,
            amount,
            remarks: type === 'vendor_payout' ? 'Vendor earnings payout' : 'Rider earnings payout',
            occasion: `Payout for ${type}`,
        })

        // Create transaction record
        const { error: txError } = await supabaseAdmin
            .from('transactions')
            .insert({
                user_id: userId,
                type,
                status: 'processing',
                amount,
                phone_number: profile.phone,
                metadata: {
                    conversation_id: b2cResponse.ConversationID,
                    originator_conversation_id: b2cResponse.OriginatorConversationID,
                },
            })

        if (txError) {
            console.error('Failed to create transaction record:', txError)
        }

        // Update pending earnings
        const table = type === 'vendor_payout' ? 'vendors' : 'riders'
        await supabaseAdmin
            .from(table)
            .update({
                pending_earnings: 0,
            })
            .eq('id', userId)

        return NextResponse.json({
            success: true,
            message: 'Payout initiated successfully',
            conversationId: b2cResponse.ConversationID,
        })
    } catch (error: any) {
        console.error('Payout error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to initiate payout' },
            { status: 500 }
        )
    }
}
