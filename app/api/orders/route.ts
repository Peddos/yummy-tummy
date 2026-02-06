import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/api'
import crypto from 'crypto'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({
                error: 'Unauthorized. Your session may have expired.',
                details: 'Please log out and sign back in to refresh your secure session tokens.'
            }, { status: 401 })
        }

        const {
            vendorId,
            items,
            subtotal,
            deliveryFee,
            total,
            deliveryAddress,
            deliveryNotes
        } = await req.json()

        // Generate a unique order number
        const orderNumber = `FD-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${Date.now().toString().slice(-4)}`

        // 1. Create the order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                order_number: orderNumber,
                customer_id: user.id,
                vendor_id: vendorId,
                status: 'pending_payment',
                subtotal,
                delivery_fee: deliveryFee,
                total,
                delivery_address: deliveryAddress,
                delivery_notes: deliveryNotes
            })
            .select()
            .single()

        if (orderError) throw orderError

        // 2. Create order items
        const orderItems = items.map((item: any) => ({
            order_id: order.id,
            menu_item_id: item.menuItemId,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
            special_instructions: item.specialInstructions
        }))

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)

        if (itemsError) throw itemsError

        // 3. Create initial transaction record
        const { error: transError } = await supabase
            .from('transactions')
            .insert({
                order_id: order.id,
                user_id: user.id,
                type: 'customer_payment',
                status: 'pending',
                amount: total
            })

        if (transError) throw transError

        return NextResponse.json(order)

    } catch (error: any) {
        console.error('Order Creation Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                *,
                vendor:vendor_id (business_name),
                items:order_items (
                    *,
                    menu_item:menu_item_id (name)
                )
            `)
            .eq('customer_id', user.id)
            .order('created_at', { ascending: false })

        if (error) throw error

        return NextResponse.json(orders)

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
