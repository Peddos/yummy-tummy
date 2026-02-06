'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MapPin, Navigation, Package, Star, Clock, CheckCircle2, Loader2, RefreshCcw } from 'lucide-react'

export default function AvailableOrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [accepting, setAccepting] = useState<string | null>(null)

    useEffect(() => {
        fetchAvailableOrders()

        // Real-time listener for new ready orders
        const channel = supabase
            .channel('rider-feed')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: 'status=eq.ready_for_pickup'
            }, () => fetchAvailableOrders())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const fetchAvailableOrders = async () => {
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
        setAccepting(orderId)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error } = await supabase
            .from('orders')
            .update({
                rider_id: user.id,
                status: 'assigned_to_rider'
            })
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
            <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b px-4 py-8 sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Order Feed</h1>
                        <p className="text-gray-500 font-medium">Orders ready for pickup in your area</p>
                    </div>
                    <button
                        onClick={() => { setLoading(true); fetchAvailableOrders(); }}
                        className="p-3 bg-gray-50 text-orange-600 rounded-full hover:bg-orange-50 transition"
                    >
                        <RefreshCcw className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
                {orders.length === 0 ? (
                    <div className="bg-white rounded-[40px] p-16 text-center shadow-lg border-2 border-dashed border-gray-100">
                        <div className="text-7xl mb-6">🛵</div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Searching for orders...</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">Stay alert! New orders will appear here as soon as they are ready.</p>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-[40px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em]">New Order Available</p>
                                        <h3 className="text-2xl font-black text-gray-900">{order.vendor?.business_name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <span className="font-bold text-gray-600">{order.vendor?.rating} Rating</span>
                                            <span>•</span>
                                            <span>Ready for pickup</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-orange-600">{formatCurrency(150)}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Est. Earning</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                    <div className="relative pl-10">
                                        <div className="absolute left-0 top-0 w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                            <Package className="w-4 h-4" />
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pickup From</p>
                                        <p className="font-bold text-gray-900 leading-tight">{order.vendor?.address}</p>
                                    </div>
                                    <div className="relative pl-10">
                                        <div className="absolute left-0 top-0 w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deliver To</p>
                                        <p className="font-bold text-gray-900 leading-tight">{order.delivery_address}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => acceptOrder(order.id)}
                                    disabled={!!accepting}
                                    className={`
                                        w-full py-5 rounded-2xl font-black text-white text-lg 
                                        transition-all shadow-lg flex items-center justify-center gap-3
                                        ${accepting === order.id
                                            ? 'bg-orange-300'
                                            : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:scale-[1.02] active:scale-95 shadow-orange-100'}
                                    `}
                                >
                                    {accepting === order.id ? <Loader2 className="w-6 h-6 animate-spin" /> : <Navigation className="w-6 h-6" />}
                                    Accept Order & Go
                                </button>
                            </div>
                            <div className="bg-gray-50 px-8 py-3 flex justify-between items-center">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID: #{order.order_number}</span>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ready Since: {formatDate(order.ready_at || order.created_at)}</span>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    )
}
