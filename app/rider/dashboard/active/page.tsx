'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import {
    Phone, MapPin, CheckCircle2, Navigation,
    MessageSquare, AlertCircle, Loader2, PackageCheck,
    Truck, CircleDot
} from 'lucide-react'

export default function ActiveDeliveriesPage() {
    const router = useRouter()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)

    useEffect(() => {
        fetchActiveOrder()
    }, [])

    const fetchActiveOrder = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                vendor:vendor_id (business_name, address, phone),
                customer:customer_id (full_name, phone),
                items:order_items (quantity, menu_item:menu_item_id (name))
            `)
            .eq('rider_id', user.id)
            .in('status', ['assigned_to_rider', 'picked_up', 'in_transit'])
            .single()

        if (!error) setOrder(data)
        setLoading(false)
    }

    const updateStatus = async (status: string) => {
        setUpdating(status)
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', order.id)

        if (!error) {
            if (status === 'delivered') {
                router.push('/rider/dashboard')
            } else {
                fetchActiveOrder()
            }
        }
        setUpdating(null)
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
        </div>
    )

    if (!order) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <Truck className="w-20 h-20 text-gray-200 mb-6" />
            <h1 className="text-2xl font-black text-gray-900 mb-2">No Active Orders</h1>
            <p className="text-gray-500 mb-8">You haven't accepted any deliveries yet.</p>
            <button
                onClick={() => router.push('/rider/dashboard/available')}
                className="bg-orange-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-orange-100"
            >
                Find Jobs
            </button>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Real-time Map Simulation Placeholder */}
            <div className="h-64 bg-slate-800 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 grid grid-cols-12 gap-0 overflow-hidden">
                        {Array.from({ length: 144 }).map((_, i) => (
                            <div key={i} className="border-r border-b border-white/20 h-12 w-12" />
                        ))}
                    </div>
                </div>
                <div className="relative z-10 text-center animate-pulse">
                    <CircleDot className="w-12 h-12 text-orange-500 mx-auto mb-2" />
                    <p className="text-white text-xs font-black uppercase tracking-[0.3em]">GPS Tracking Active</p>
                </div>

                {/* Status Badge */}
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl flex items-center justify-between shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping" />
                            <span className="font-black text-gray-900 uppercase text-xs tracking-widest">{order.status.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="font-bold text-gray-500 text-xs">#{order.order_number}</span>
                    </div>
                </div>
            </div>

            <main className="max-w-xl mx-auto px-4 mt-[-20px] relative z-20 space-y-6">
                {/* Vendor Pickup Card */}
                <div className={`bg-white rounded-[40px] p-8 shadow-xl border-t-8 ${order.status === 'assigned_to_rider' ? 'border-orange-500' : 'border-green-500'}`}>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Step 1: Pickup</p>
                            <h2 className="text-2xl font-black text-gray-900">{order.vendor?.business_name}</h2>
                        </div>
                        <a href={`tel:${order.vendor?.phone}`} className="p-3 bg-gray-50 text-blue-600 rounded-2xl hover:bg-gray-100">
                            <Phone className="w-6 h-6" />
                        </a>
                    </div>

                    <div className="flex gap-4 mb-8">
                        <MapPin className="w-6 h-6 text-gray-400 flex-shrink-0" />
                        <p className="font-bold text-gray-700">{order.vendor?.address}</p>
                    </div>

                    {order.status === 'assigned_to_rider' ? (
                        <button
                            onClick={() => updateStatus('picked_up')}
                            disabled={!!updating}
                            className="w-full py-5 bg-orange-600 text-white rounded-3xl font-black text-lg shadow-lg shadow-orange-100 hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-3"
                        >
                            {updating ? <Loader2 className="w-6 h-6 animate-spin" /> : <PackageCheck className="w-6 h-6" />}
                            Confirm Pickup
                        </button>
                    ) : (
                        <div className="flex items-center gap-3 text-green-600 bg-green-50 py-4 px-6 rounded-2xl font-black">
                            <CheckCircle2 className="w-6 h-6" /> Picked Up Successfully
                        </div>
                    )}
                </div>

                {/* Customer Delivery Card */}
                <div className={`bg-white rounded-[40px] p-8 shadow-xl border-t-8 transition-opacity ${order.status === 'assigned_to_rider' ? 'opacity-50 border-gray-100' : 'border-orange-500'}`}>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Step 2: Delivery</p>
                            <h2 className="text-2xl font-black text-gray-900">{order.customer?.full_name}</h2>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-3 bg-gray-50 text-blue-600 rounded-2xl">
                                <MessageSquare className="w-6 h-6" />
                            </button>
                            <a href={`tel:${order.customer?.phone}`} className="p-3 bg-gray-50 text-blue-600 rounded-2xl">
                                <Phone className="w-6 h-6" />
                            </a>
                        </div>
                    </div>

                    <div className="flex gap-4 mb-8">
                        <MapPin className="w-6 h-6 text-gray-400 flex-shrink-0" />
                        <p className="font-bold text-gray-700">{order.delivery_address}</p>
                    </div>

                    {order.delivery_notes && (
                        <div className="mb-8 p-4 bg-blue-50/50 rounded-2xl flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <p className="text-sm text-blue-900 font-medium">"{order.delivery_notes}"</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {order.status === 'picked_up' && (
                            <button
                                onClick={() => updateStatus('in_transit')}
                                className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-lg shadow-lg hover:bg-blue-700 transition flex items-center justify-center gap-3"
                            >
                                <Navigation className="w-6 h-6" />
                                Start Travel
                            </button>
                        )}
                        {order.status === 'in_transit' && (
                            <button
                                onClick={() => updateStatus('delivered')}
                                className="w-full py-5 bg-green-600 text-white rounded-3xl font-black text-lg shadow-lg hover:bg-green-700 transition flex items-center justify-center gap-3"
                            >
                                <PackageCheck className="w-6 h-6" />
                                Mark as Delivered
                            </button>
                        )}
                    </div>
                </div>

                {/* Order Summary (Items) */}
                <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Checkout Items</p>
                    <div className="space-y-3 divide-y">
                        {order.items?.map((item: any, i: number) => (
                            <div key={i} className="flex justify-between py-3">
                                <span className="font-bold text-gray-700">{item.quantity}x {item.menu_item?.name}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 pt-6 border-t flex justify-between items-center">
                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Customer Paid</p>
                        <p className="text-2xl font-black text-gray-900">{formatCurrency(order.total)}</p>
                    </div>
                </div>
            </main>
        </div>
    )
}
