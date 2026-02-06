import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/api'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Delete orders that are in terminal states (delivered, completed, cancelled)
        // This keeps truly active orders safe while allowing the user to clear their history.
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('customer_id', user.id)
            .in('status', ['delivered', 'completed', 'cancelled', 'payment_failed'])

        if (error) throw error

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Clear History Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
