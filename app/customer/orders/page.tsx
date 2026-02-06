'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'
import { ArrowLeft, Package, Clock, MapPin, RefreshCcw, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function OrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOrders()

        // Subscribe to order status updates
        const channel = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
                setOrders(prev => prev.map(order =>
                    order.id === payload.new.id ? { ...order, status: payload.new.status } : order
                ))
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchOrders = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/orders')
            const data = await response.json()
            if (response.ok) {
                setOrders(data)
            }
        } catch (error) {
            console.error('Failed to fetch orders:', error)
        } finally {
            setLoading(false)
        }
    }


    const clearHistory = async () => {
        if (!confirm('Are you sure you want to clear your order history? Active orders will not be affected.')) return

        try {
            const response = await fetch('/api/orders/clear', { method: 'POST' })
            if (response.ok) {
                fetchOrders()
            } else {
                alert('Failed to clear history')
            }
        } catch (error) {
            console.error('Clear history error:', error)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b px-4 py-6 sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/customer" className="p-2 hover:bg-gray-100 rounded-full transition">
                            <ArrowLeft className="w-6 h-6 text-gray-600" />
                        </Link>
                        <h1 className="text-2xl font-black text-gray-900">My Orders</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={clearHistory}
                            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition"
                        >
                            Clear History
                        </button>
                        <button
                            onClick={fetchOrders}
                            className="p-2 hover:bg-gray-100 rounded-full transition text-blue-600"
                            title="Refresh"
                        >
                            <RefreshCcw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
                <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <p className="text-xs text-blue-800 leading-normal">
                        <span className="font-black uppercase tracking-tighter mr-2">Auto-Cleanup:</span>
                        Failed or abandoned orders are automatically deleted within 5 minutes to keep your history clean. Only successfully paid orders are recorded.
                    </p>
                </div>

                {orders.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                        <div className="text-6xl mb-6">🥡</div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No orders found</h3>
                        <p className="text-gray-500 mb-8">You haven't placed any orders yet. Hungry?</p>
                        <Link
                            href="/customer"
                            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                        >
                            Browse Restaurants
                        </Link>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                            {/* Order Card Header */}
                            <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <Package className="w-5 h-5 text-blue-600" />
                                        <span className="font-black text-gray-900">{order.order_number}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 font-medium">{formatDate(order.created_at)}</p>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${getOrderStatusColor(order.status)}`}>
                                    {getOrderStatusLabel(order.status)}
                                </div>
                            </div>

                            {/* Order Details */}
                            <div className="p-6 flex flex-col md:flex-row gap-8">
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            <ExternalLink className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">Restaurant</p>
                                            <p className="font-bold text-gray-900 text-lg">{order.vendor?.business_name || 'Vendor'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-gray-50 rounded-lg">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">Delivery Address</p>
                                            <p className="text-sm text-gray-700 max-w-sm line-clamp-2">{order.delivery_address}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full md:w-48 bg-gray-50 rounded-2xl p-4 flex flex-col justify-between">
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase">Items</p>
                                        <p className="font-bold text-gray-900 mt-1">{order.items?.length || 0} Item(s)</p>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-xs text-gray-400 font-bold uppercase">Total Bill</p>
                                        <p className="text-xl font-black text-blue-600">{formatCurrency(order.total)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* View Details Toggle */}
                            <div className="bg-gray-50/50 p-4 border-t flex items-center justify-between gap-4">
                                <button className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-blue-600 transition">
                                    View Full Details
                                </button>
                                <div className="text-[10px] text-gray-400 font-medium italic">
                                    Payment Verified
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    )
}
