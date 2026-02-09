'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MapPin, Navigation, Package, Star, Clock, CheckCircle2, Loader2, RefreshCcw, ChevronRight } from 'lucide-react'

export default function AvailableOrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [accepting, setAccepting] = useState<string | null>(null)
    const [hasActiveOrder, setHasActiveOrder] = useState(false)

    useEffect(() => {
        fetchAvailableOrders()

        const channel = supabase
            .channel('rider-feed-live')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders'
            }, () => fetchAvailableOrders())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const fetchAvailableOrders = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Check if rider already has an active order
        const { data: activeOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('rider_id', user.id)
            .in('status', ['assigned_to_rider', 'picked_up', 'in_transit'])
            .limit(1)

        setHasActiveOrder(!!activeOrder && activeOrder.length > 0)

        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                vendor:vendor_id (business_name, address, rating),
                customer:customer_id (full_name)
            `)
            .eq('status', 'ready_for_pickup')
            .is('rider_id', null)
            .order('created_at', { ascending: true })

        if (error) console.error('Error:', error)
        else setOrders(data || [])
        setLoading(false)
    }

    const acceptOrder = async (orderId: string) => {
        if (!window.confirm('Are you sure you want to accept this delivery? Once accepted, you must complete it before taking others.')) return

        setAccepting(orderId)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('orders')
            .update({
                rider_id: user.id,
                status: 'assigned_to_rider'
            } as any)
            .eq('id', orderId)

        if (!error) {
            router.push('/rider/dashboard/active')
        } else {
            alert('Failed to accept order. It might have been taken by another rider.')
            fetchAvailableOrders()
        }
        setAccepting(null)
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)]" />
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Available Orders</h1>
                        <p className="text-xs text-gray-500 font-medium">Accept and deliver nearby orders</p>
                    </div>
                    <button
                        onClick={() => { setLoading(true); fetchAvailableOrders(); }}
                        className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 rounded-full hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors"
                    >
                        <RefreshCcw className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
                {orders.length === 0 ? (
                    <div className="card p-16 text-center border-dashed border-2 border-gray-200">
                        <div className="text-6xl mb-6 grayscale opacity-50">🛵</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No orders available</h3>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">New orders will appear here automatically when they are ready for pickup.</p>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="card p-6 overflow-hidden border-l-4 border-l-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all group">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest px-2 py-0.5 bg-[var(--color-primary-light)] rounded-md">New Request</span>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{order.order_number}</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">{order.vendor?.business_name}</h3>
                                    <div className="flex items-center gap-3 mt-1 font-bold">
                                        <div className="flex items-center gap-1 text-sm text-amber-500">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span>{order.vendor?.rating || '4.8'}</span>
                                        </div>
                                        <span className="text-xs text-gray-400 font-medium">• Ready for pickup</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-[var(--color-primary)]">{formatCurrency(order.delivery_fee || 150)}</p>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Est. Reward</p>
                                </div>
                            </div>

                            <div className="space-y-6 mb-8 relative">
                                <div className="absolute left-[13px] top-6 bottom-6 w-0.5 bg-dashed border-l-2 border-dashed border-gray-200" />

                                <div className="flex gap-4 relative">
                                    <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center z-10">
                                        <Package className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pickup</p>
                                        <p className="text-sm font-bold text-gray-700">{order.vendor?.address}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 relative">
                                    <div className="w-7 h-7 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center z-10">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deliver</p>
                                        <p className="text-sm font-bold text-gray-700">{order.delivery_address}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => acceptOrder(order.id)}
                                disabled={!!accepting || hasActiveOrder}
                                className={`btn btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 relative overflow-hidden group/btn ${hasActiveOrder ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                            >
                                {accepting === order.id ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <Navigation className="w-6 h-6 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                        <span>{hasActiveOrder ? 'Active Session in Progress' : 'Accept & Go'}</span>
                                    </>
                                )}
                            </button>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
                                <span>Rider ID Verification Required</span>
                                <span>{formatDate(order.ready_at || order.created_at)}</span>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    )
}
