import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/api'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if ((profile as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Fetch all transactions
        const { data: transactions } = await supabaseAdmin
            .from('transactions')
            .select('*')
            .eq('type', 'customer_payment')

        // Find transactions missing financial breakdown
        const missingBreakdown = (transactions as any[])?.filter(t =>
            !t.vendor_share || !t.rider_share || !t.platform_commission
        ) || []

        // Fetch all vendors and calculate expected earnings
        const { data: vendors } = await supabaseAdmin
            .from('vendors')
            .select('id, business_name, total_earnings')

        const { data: riders } = await supabaseAdmin
            .from('riders')
            .select('id, total_earnings')

        // Calculate actual earnings from delivered orders
        const { data: deliveredOrders } = await supabaseAdmin
            .from('orders')
            .select(`
                *,
                transactions!inner(vendor_share, rider_share, platform_commission)
            `)
            .eq('status', 'delivered')

        const vendorEarningsMap = new Map()
        const riderEarningsMap = new Map()
        let totalPlatformCommission = 0

            ; (deliveredOrders as any[])?.forEach(order => {
                const tx = order.transactions[0]
                if (tx) {
                    // Vendor earnings
                    const vendorId = order.vendor_id
                    vendorEarningsMap.set(
                        vendorId,
                        (vendorEarningsMap.get(vendorId) || 0) + (tx.vendor_share || 0)
                    )

                    // Rider earnings
                    if (order.rider_id) {
                        riderEarningsMap.set(
                            order.rider_id,
                            (riderEarningsMap.get(order.rider_id) || 0) + (tx.rider_share || 0)
                        )
                    }

                    // Platform commission
                    totalPlatformCommission += tx.platform_commission || 0
                }
            })

        // Find discrepancies
        const vendorDiscrepancies = (vendors as any[])?.map(v => {
            const calculated = vendorEarningsMap.get(v.id) || 0
            const stored = v.total_earnings || 0
            const diff = Math.abs(calculated - stored)

            return {
                vendor_id: v.id,
                vendor_name: v.business_name,
                calculated_earnings: calculated,
                stored_earnings: stored,
                discrepancy: diff,
                has_issue: diff > 0.01 // Allow 1 cent rounding difference
            }
        }).filter(v => v.has_issue) || []

        const riderDiscrepancies = (riders as any[])?.map(r => {
            const calculated = riderEarningsMap.get(r.id) || 0
            const stored = r.total_earnings || 0
            const diff = Math.abs(calculated - stored)

            return {
                rider_id: r.id,
                calculated_earnings: calculated,
                stored_earnings: stored,
                discrepancy: diff,
                has_issue: diff > 0.01
            }
        }).filter(r => r.has_issue) || []

        // Compile audit report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total_transactions: transactions?.length || 0,
                missing_financial_breakdown: missingBreakdown.length,
                vendor_discrepancies: vendorDiscrepancies.length,
                rider_discrepancies: riderDiscrepancies.length,
                total_platform_commission: totalPlatformCommission
            },
            issues: {
                transactions_missing_breakdown: missingBreakdown.map(t => ({
                    transaction_id: t.id,
                    order_id: t.order_id,
                    amount: t.amount,
                    status: t.status,
                    created_at: t.created_at
                })),
                vendor_discrepancies: vendorDiscrepancies,
                rider_discrepancies: riderDiscrepancies
            },
            health_status:
                missingBreakdown.length === 0 &&
                    vendorDiscrepancies.length === 0 &&
                    riderDiscrepancies.length === 0
                    ? 'HEALTHY'
                    : 'NEEDS_ATTENTION'
        }

        return NextResponse.json(report)

    } catch (error: any) {
        console.error('Financial Audit Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST endpoint to repair missing financial data
export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if ((profile as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { action } = await req.json()

        if (action === 'recalculate_all') {
            // Fetch all transactions missing breakdown
            const { data: transactions } = await supabaseAdmin
                .from('transactions')
                .select('id, order_id, vendor_share, rider_share, platform_commission')
                .eq('type', 'customer_payment')

            const { data: settings } = await supabaseAdmin
                .from('system_settings')
                .select('value')
                .eq('key', 'vendor_commission_percentage')
                .single()

            const commissionRate = settings ? Number((settings as any).value) / 100 : 0.10

            let fixed = 0
            for (const tx of (transactions as any[]) || []) {
                if (!tx.vendor_share || !tx.rider_share || !tx.platform_commission) {
                    // Fetch order details
                    const { data: order } = await supabaseAdmin
                        .from('orders')
                        .select('subtotal, delivery_fee')
                        .eq('id', tx.order_id)
                        .single()

                    if (order) {
                        const platformCommission = Math.round((order as any).subtotal * commissionRate * 100) / 100
                        const vendorShare = Math.round(((order as any).subtotal - platformCommission) * 100) / 100
                        const riderShare = (order as any).delivery_fee

                        await (supabaseAdmin
                            .from('transactions') as any)
                            .update({
                                vendor_share: vendorShare,
                                rider_share: riderShare,
                                platform_commission: platformCommission
                            })
                            .eq('id', tx.id)

                        fixed++
                    }
                }
            }

            return NextResponse.json({
                success: true,
                message: `Recalculated financial breakdown for ${fixed} transactions`
            })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    } catch (error: any) {
        console.error('Financial Repair Error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
