'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/ui/StatusBadge'
import {
    ArrowLeft, Package, Clock, MapPin, RefreshCcw,
    ExternalLink, Trash2, Loader2, ChevronRight,
    ShoppingBag, Search, Filter, Store
} from 'lucide-react'
import Link from 'next/link'

export default function OrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOrders()

        const channel = supabase
            .channel('customer-orders')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders'
            }, () => fetchOrders())
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

    const deleteOrder = async (id: string) => {
        if (!confirm('Permanently remove this order from your records?')) return
        try {
            const response = await fetch(`/api/orders/${id}`, { method: 'DELETE' })
            if (response.ok) fetchOrders()
            else alert('Deletion restricted by system rules.')
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    const clearHistory = async () => {
        if (!confirm('Clear order history? Active orders will remain.')) return

        try {
            const response = await fetch('/api/orders/clear', { method: 'POST' })
            if (response.ok) {
                fetchOrders()
            }
        } catch (error) {
            console.error('Clear history error:', error)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)] opacity-50" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Order Repository</h1>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={fetchOrders}
                            className="p-2 text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                            title="Sync Data"
                        >
                            <RefreshCcw className="w-5 h-5" />
                        </button>
                        <button
                            onClick={clearHistory}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Flush History"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {orders.length === 0 ? (
                    <div className="card p-16 text-center border-none shadow-sm">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-gray-100">
                            <ShoppingBag className="w-10 h-10 text-gray-200" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">History Empty</h3>
                        <p className="text-gray-400 text-sm font-medium mb-10 max-w-xs mx-auto">
                            It looks like you haven't placed any orders yet. Ready to try something delicious?
                        </p>
                        <Link href="/customer" className="btn btn-primary px-8 py-4 shadow-xl shadow-[var(--color-primary)]/20 active:scale-95 transition-all">
                            Browse Local Flavors
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    {orders.length} Entries
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {orders.map((order) => {
                                const isActive = !['delivered', 'completed', 'cancelled'].includes(order.status)

                                return (
                                    <div key={order.id} className="card p-0 overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow group">
                                        {/* Status & ID Line */}
                                        <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                                    <Package className="w-4 h-4 text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Session ID</p>
                                                    <p className="text-xs font-bold text-gray-900 leading-none">#{order.order_number}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <StatusBadge status={order.status} />
                                                {['pending_payment', 'cancelled'].includes(order.status) && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            deleteOrder(order.id)
                                                        }}
                                                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors bg-white rounded-lg border border-gray-100 shadow-sm"
                                                        title="Delete Instance"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Core Content */}
                                        <div className="p-6">
                                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                                <div className="flex-1 space-y-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100">
                                                            <Store className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Provider</p>
                                                            <h3 className="text-lg font-black text-gray-900 leading-none">{order.vendor?.business_name || 'Vendor'}</h3>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 pl-1">
                                                        <MapPin className="w-4 h-4 text-gray-300" />
                                                        <p className="text-sm font-bold text-gray-500 line-clamp-1">{order.delivery_address}</p>
                                                    </div>
                                                </div>

                                                <div className="w-full md:w-auto flex flex-row md:flex-col justify-between items-end md:items-end gap-2 border-t md:border-t-0 md:border-l border-gray-50 pt-6 md:pt-0 md:pl-10">
                                                    <div className="text-left md:text-right">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Settlement</p>
                                                        <p className="text-2xl font-black text-[var(--color-primary)] tracking-tighter leading-none">{formatCurrency(order.total)}</p>
                                                    </div>
                                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        {formatDate(order.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dynamic Action Footer */}
                                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                                            {isActive ? (
                                                <Link
                                                    href={`/customer/orders/${order.id}`}
                                                    className="w-full bg-[var(--color-primary)] text-white py-3 rounded-xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-[0.2em] shadow-lg shadow-[var(--color-primary)]/20 active:scale-[0.98] transition-all"
                                                >
                                                    <Clock className="w-4 h-4 animate-pulse" />
                                                    Track Dynamic Status
                                                    <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            ) : (
                                                <div className="w-full flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    <span>Transaction Finalized</span>
                                                    <div className="flex items-center gap-2 text-[var(--color-primary)] cursor-pointer group-hover:underline">
                                                        View Receipt
                                                        <ChevronRight className="w-3 h-3" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
