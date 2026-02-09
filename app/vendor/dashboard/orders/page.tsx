'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/ui/StatusBadge'
import {
    Clock, CheckCircle2, Package, Truck,
    XCircle, Loader2, Phone, MapPin, Search, Calendar, ChevronRight,
    Trash2
} from 'lucide-react'

export default function VendorOrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)

    useEffect(() => {
        fetchOrders()

        const channel = supabase
            .channel('vendor-orders-live')
            .on('postgres_changes', {
                event: '*',
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
            .update({ status } as any)
            .eq('id', orderId)

        if (!error) fetchOrders()
        setUpdating(null)
    }

    const deleteOrder = async (id: string) => {
        if (!confirm('Confirm deletion of this record? This action is logged for accountability.')) return
        try {
            const response = await fetch(`/api/orders/${id}`, { method: 'DELETE' })
            if (response.ok) fetchOrders()
            else alert('Access Denied: You may not have authority to purge this record.')
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)]" />
        </div>
    )

    const activeOrders = orders.filter(o => !['delivered', 'completed', 'cancelled'].includes(o.status))
    const pastOrders = orders.filter(o => ['delivered', 'completed', 'cancelled'].includes(o.status))

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Order Management</h1>
                        <p className="text-xs text-gray-500 font-medium">Real-time order tracking and updates</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            Live System Connected
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Active Orders Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-[var(--color-primary)]" />
                                Active Requests
                            </h2>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{activeOrders.length} New</span>
                        </div>

                        {activeOrders.length === 0 ? (
                            <div className="card p-16 text-center border-dashed border-2 border-gray-200">
                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-gray-900 mb-1">No pending orders</h3>
                                <p className="text-gray-500 text-sm">New orders will appear here automatically</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {activeOrders.map((order) => (
                                    <div key={order.id} className="card p-6 border-l-4 border-l-[var(--color-primary)]">
                                        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-xs font-black text-[var(--color-primary)]">#{order.order_number}</span>
                                                    <StatusBadge status={order.status} />
                                                    {['cancelled', 'pending_payment'].includes(order.status) && (
                                                        <button
                                                            onClick={() => deleteOrder(order.id)}
                                                            className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                                                            title="Purge Record"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                <h3 className="text-xl font-bold text-gray-900">{order.customer?.full_name}</h3>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-medium">
                                                    <span className="flex items-center gap-1.5 text-gray-700">
                                                        <Phone className="w-3.5 h-3.5" /> {order.customer?.phone}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5" /> {formatDate(order.created_at)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-2">
                                                {order.status === 'pending_payment' ? (
                                                    <div className="flex flex-col items-end gap-2">
                                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Waiting for customer...</span>
                                                        <button
                                                            onClick={() => updateStatus(order.id, 'paid')}
                                                            className="text-[10px] font-black text-[var(--color-primary)] bg-[var(--color-primary-light)] px-3 py-1.5 rounded-lg uppercase"
                                                        >
                                                            Force Verify (Dev)
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        {order.status === 'paid' && (
                                                            <button
                                                                onClick={() => updateStatus(order.id, 'confirmed')}
                                                                className="btn btn-primary px-6 py-2.5 text-xs flex items-center gap-2"
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" /> Accept Order
                                                            </button>
                                                        )}
                                                        {order.status === 'confirmed' && (
                                                            <button
                                                                onClick={() => updateStatus(order.id, 'preparing')}
                                                                className="btn btn-primary bg-orange-500 hover:bg-orange-600 border-orange-500 px-6 py-2.5 text-xs"
                                                            >
                                                                Start Preparing
                                                            </button>
                                                        )}
                                                        {order.status === 'preparing' && (
                                                            <button
                                                                onClick={() => updateStatus(order.id, 'ready_for_pickup')}
                                                                className="btn btn-primary bg-green-600 hover:bg-green-700 border-green-600 px-6 py-2.5 text-xs"
                                                            >
                                                                Ready for Pickup
                                                            </button>
                                                        )}
                                                        {['ready_for_pickup', 'assigned_to_rider', 'picked_up', 'in_transit'].includes(order.status) && (
                                                            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-2">
                                                                <Truck className="w-4 h-4 animate-bounce" /> Dispatching
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                                            <div className="space-y-2">
                                                {order.items?.map((item: any) => (
                                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-600 font-medium">
                                                            <span className="text-[var(--color-primary)] font-bold mr-2">{item.quantity}x</span>
                                                            {item.menu_item?.name}
                                                        </span>
                                                        <span className="font-bold text-gray-900">{formatCurrency(item.total_price)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-3 pt-3 border-t border-dashed border-gray-200 flex justify-between">
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Revenue</span>
                                                <span className="text-lg font-bold text-gray-900">{formatCurrency(order.subtotal)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2 bg-gray-50/50 p-3 rounded-xl">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-gray-500 leading-tight italic">{order.delivery_address}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* History Sidebar */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                Recent History
                            </h2>
                        </div>

                        <div className="card divide-y border-gray-100">
                            {pastOrders.length === 0 ? (
                                <p className="p-8 text-center text-xs text-gray-400 font-medium italic">No past orders to show</p>
                            ) : (
                                pastOrders.slice(0, 8).map((order) => (
                                    <div key={order.id} className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">
                                                    {order.customer?.full_name}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase letter tracking-tighter">#{order.order_number}</p>
                                            </div>
                                            <StatusBadge status={order.status} />
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-400">{formatDate(order.created_at)}</span>
                                            <span className="font-bold text-[var(--color-primary)]">{formatCurrency(order.total)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                            {pastOrders.length > 8 && (
                                <button className="w-full py-3 text-xs font-bold text-gray-400 hover:text-[var(--color-primary)] transition-colors flex items-center justify-center gap-1">
                                    View Full History <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
