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

        // Delete the order. RLS should ideally handle authorization, 
        // but we can also check here if the order belongs to the user.
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', id)
            .eq('customer_id', user.id) // Security check

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
