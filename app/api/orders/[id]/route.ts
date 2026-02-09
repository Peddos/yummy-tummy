import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/api'

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = await createClient()
        const { id } = params

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check user role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const role = profile?.role

        let query = supabase.from('orders').delete().eq('id', id)

        // Scoped deletion based on role
        if (role === 'admin') {
            // Admin can delete any order
        } else if (role === 'vendor') {
            // Vendor can delete orders assigned to them
            query = query.eq('vendor_id', user.id)
        } else {
            // Customer can only delete their own orders
            query = query.eq('customer_id', user.id)
        }

        const { error } = await query

        if (error) throw error

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Order Deletion Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
