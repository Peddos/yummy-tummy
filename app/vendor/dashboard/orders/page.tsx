'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'
import {
    Clock, CheckCircle2, Package, Truck,
    XCircle, Loader2, Phone, MapPin, Search
} from 'lucide-react'

export default function VendorOrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)

    useEffect(() => {
        fetchOrders()

        // Listen for new orders
        const channel = supabase
            .channel('vendor-orders')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'orders'
            }, () => fetchOrders())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const fetchOrders = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                customer:customer_id (full_name, phone),
                items:order_items (
                    *,
                    menu_item:menu_item_id (name)
                )
            `)
            .eq('vendor_id', user.id)
            .order('created_at', { ascending: false })

        if (error) console.error('Error:', error)
        else setOrders(data || [])
        setLoading(false)
    }

    const updateStatus = async (orderId: string, status: string) => {
        setUpdating(orderId)
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId)

        if (!error) fetchOrders()
        setUpdating(null)
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b px-4 py-8 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Order Management</h1>
                        <p className="text-gray-500 font-medium">Keep track of incoming requests and deliveries</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Active/Incoming Orders */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-black text-gray-900 px-2 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                            Active Orders
                        </h2>

                        {orders.filter(o => !['delivered', 'completed', 'cancelled'].includes(o.status)).length === 0 ? (
                            <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-bold">No active orders right now</p>
                            </div>
                        ) : (
                            orders.filter(o => !['delivered', 'completed', 'cancelled'].includes(o.status)).map((order) => (
                                <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                                    <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1 text-xs font-black uppercase tracking-widest text-blue-600">
                                                <span>#{order.order_number}</span>
                                                <span>•</span>
                                                <span className={getOrderStatusColor(order.status) + " px-2 py-0.5 rounded-full"}>
                                                    {getOrderStatusLabel(order.status)}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900">{order.customer?.full_name}</h3>
                                            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                                                <span className="flex items-center gap-1 font-bold"><Phone className="w-3 h-3" /> {order.customer?.phone}</span>
                                                <span className="flex items-center gap-1 font-bold"><Clock className="w-3 h-3" /> {formatDate(order.created_at)}</span>
                                            </div>
                                        </div>

                                        {/* Status Action Buttons */}
                                        <div className="flex gap-2">
                                            {order.status === 'pending_payment' && (
                                                <div className="flex flex-col gap-2">
                                                    <span className="text-xs font-black text-yellow-600">Waiting for payment...</span>
                                                    <button
                                                        onClick={() => updateStatus(order.id, 'paid')}
                                                        className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase hover:bg-blue-100 transition"
                                                    >
                                                        Verify Payment (Dev)
                                                    </button>
                                                </div>
                                            )}
                                            {order.status === 'paid' && (
                                                <button
                                                    onClick={() => updateStatus(order.id, 'confirmed')}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-blue-700 transition"
                                                >
                                                    Confirm Order
                                                </button>
                                            )}
                                            {order.status === 'confirmed' && (
                                                <button
                                                    onClick={() => updateStatus(order.id, 'preparing')}
                                                    className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-orange-600 transition"
                                                >
                                                    Start Preparing
                                                </button>
                                            )}
                                            {order.status === 'preparing' && (
                                                <button
                                                    onClick={() => updateStatus(order.id, 'ready_for_pickup')}
                                                    className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-black hover:bg-green-700 transition"
                                                >
                                                    Ready for Pickup
                                                </button>
                                            )}
                                            {['ready_for_pickup', 'assigned_to_rider', 'picked_up', 'in_transit'].includes(order.status) && (
                                                <span className="flex items-center gap-2 text-xs font-black text-blue-600 bg-blue-50 px-3 py-2 rounded-xl">
                                                    <Truck className="w-4 h-4" />
                                                    Dispatching...
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Items List */}
                                    <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Order Items</p>
                                        <div className="space-y-2">
                                            {order.items?.map((item: any) => (
                                                <div key={item.id} className="flex justify-between items-center">
                                                    <p className="text-sm text-gray-700 font-bold">
                                                        <span className="text-blue-600 mr-2">{item.quantity}x</span>
                                                        {item.menu_item?.name}
                                                    </p>
                                                    <p className="text-sm font-black text-gray-900">{formatCurrency(item.total_price)}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex justify-between">
                                            <span className="text-sm font-bold text-gray-500">Subtotal</span>
                                            <span className="text-lg font-black text-gray-900">{formatCurrency(order.subtotal)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-500 px-2">
                                        <MapPin className="w-4 h-4 flex-shrink-0" />
                                        <p className="truncate font-medium">{order.delivery_address}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Right Column: Order History / Feed */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-black text-gray-900 px-2 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            Recent History
                        </h2>

                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 divide-y">
                            {orders.filter(o => ['delivered', 'completed', 'cancelled'].includes(o.status)).slice(0, 10).map((order) => (
                                <div key={order.id} className="py-4 first:pt-0 last:pb-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-bold text-gray-900">{order.customer?.full_name}</p>
                                        <span className="text-xs font-black text-gray-400">#{order.order_number}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${getOrderStatusColor(order.status)}`}>
                                            {getOrderStatusLabel(order.status)}
                                        </div>
                                        <p className="text-sm font-black text-blue-600">{formatCurrency(order.total)}</p>
                                    </div>
                                </div>
                            ))}
                            {orders.filter(o => ['delivered', 'completed', 'cancelled'].includes(o.status)).length === 0 && (
                                <p className="text-center py-6 text-gray-400 text-sm font-medium italic">No past orders yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
