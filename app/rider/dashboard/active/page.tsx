'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import {
    Phone, MapPin, CheckCircle2, Navigation,
    MessageSquare, AlertCircle, Loader2, PackageCheck,
    Truck, CircleDot, ChevronDown, List
} from 'lucide-react'

export default function ActiveDeliveriesPage() {
    const router = useRouter()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [updating, setUpdating] = useState<string | null>(null)
    const [showItems, setShowItems] = useState(false)

    useEffect(() => {
        fetchActiveOrder()
    }, [])

    const fetchActiveOrder = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // SELF-HEALING: Verify rider record exists
        const { data: riderExists } = await supabase
            .from('riders')
            .select('id')
            .eq('id', user.id)
            .single()

        if (!riderExists) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single() as { data: any }
            if (profile?.role === 'rider') {
                console.log('Self-healing active page: Creating missing rider record')
                await supabase.from('riders').insert({ id: user.id, vehicle_type: 'Motorcycle' } as any)
            }
        }

        // Stage 1: Simple fetch to confirm basic access
        const { data: basicOrder, error: basicError } = await supabase
            .from('orders')
            .select('id, order_number, status')
            .eq('rider_id', user.id)
            .in('status', ['assigned_to_rider', 'picked_up', 'in_transit'])
            .order('created_at', { ascending: false })
            .limit(1)

        if (basicError) {
            console.error('Basic Access Error (Check RLS):', basicError)
        }

        // Stage 2: Full fetch with joins
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                vendor:vendor_id (id, business_name, address, phone),
                customer:customer_id (id, full_name, phone),
                items:order_items (id, quantity, menu_item:menu_item_id (name))
            `)
            .eq('rider_id', user.id)
            .in('status', ['assigned_to_rider', 'picked_up', 'in_transit'])
            .order('created_at', { ascending: false })
            .limit(1)

        if (error) {
            console.error('Complex Join Error (Check Joins/RLS):', error)
            // Fallback to basic data if joins failed but basic worked
            if (basicOrder && (basicOrder as any[]).length > 0) {
                console.warn('Falling back to basic order data due to join failure')
                const b = (basicOrder as any[])[0]
                setOrder({
                    id: b.id,
                    order_number: b.order_number,
                    status: b.status,
                    vendor: { business_name: 'Vendor Info Pending', address: 'Loading...', phone: '' },
                    customer: { full_name: 'Customer Info Pending', phone: '' },
                    items: []
                })
            } else {
                setOrder(null)
            }
        } else if (data && data.length > 0) {
            setOrder(data[0])
        } else {
            setOrder(null)
        }
        setLoading(false)
    }

    const updateStatus = async (status: string) => {
        if (status === 'delivered') {
            if (!window.confirm('Confirm Delivery: Have you successfully handed the order to the customer?')) return
        } else if (status === 'picked_up') {
            if (!window.confirm('Confirm Pickup: Have you received all items from the vendor?')) return
        } else if (status === 'in_transit') {
            if (!window.confirm('Ready to start the trip? This will notify the customer.')) return
        }

        setUpdating(status)
        const { error } = await supabase
            .from('orders')
            .update({ status } as any)
            .eq('id', order.id)

        if (!error) {
            if (status === 'delivered') {
                alert('🎉 Delivery Completed! Great job.')
                router.push('/rider/dashboard')
            } else {
                fetchActiveOrder()
            }
        }
        setUpdating(null)
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)]" />
        </div>
    )

    if (!order) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-8">
                <Truck className="w-12 h-12 text-gray-300" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Active Order</h1>
            <p className="text-gray-500 mb-8 text-center max-w-xs">You have no pending deliveries at the moment. Check the feed for new jobs.</p>
            <button
                onClick={() => router.push('/rider/dashboard/available')}
                className="btn btn-primary px-10 h-14"
            >
                Find Deliveries
            </button>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Map Area */}
            <div className="h-72 bg-gray-900 relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 grid grid-cols-12 gap-0 overflow-hidden">
                        {Array.from({ length: 144 }).map((_, i) => (
                            <div key={i} className="border-r border-b border-white h-12 w-12" />
                        ))}
                    </div>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-[var(--color-primary)] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,102,0,0.4)] animate-pulse">
                        <Navigation className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-white text-[10px] font-black uppercase tracking-[0.4em] mt-4">Safe Travel Mode</p>
                </div>

                {/* Float Status */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md">
                    <div className="bg-white/95 backdrop-blur-md p-4 rounded-3xl flex items-center justify-between shadow-2xl border border-white/20">
                        <div className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 bg-[var(--color-primary)] rounded-full animate-pulse" />
                            <span className="font-bold text-gray-900 uppercase text-[10px] tracking-widest">{order.status.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="font-bold text-gray-400 text-[10px]">ID: #{order.order_number}</span>
                    </div>
                </div>
            </div>

            <main className="max-w-xl mx-auto px-4 -mt-8 relative z-20 space-y-4">
                {/* Pickup Section */}
                <div className={`card overflow-hidden transition-all border-l-4 ${order.status === 'assigned_to_rider' ? 'border-l-[var(--color-primary)]' : 'border-l-green-500 opacity-60'}`}>
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pickup Contact</p>
                                <h2 className="text-xl font-bold text-gray-900">{order.vendor?.business_name}</h2>
                            </div>
                            <a href={`tel:${order.vendor?.phone}`} className="w-11 h-11 flex items-center justify-center bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-2xl hover:bg-[var(--color-primary)] hover:text-white transition-all">
                                <Phone className="w-5 h-5" />
                            </a>
                        </div>

                        <div className="flex gap-3 mb-8">
                            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <p className="text-sm font-bold text-gray-700">{order.vendor?.address}</p>
                        </div>

                        {order.status === 'assigned_to_rider' ? (
                            <button
                                onClick={() => updateStatus('picked_up')}
                                disabled={!!updating}
                                className="btn btn-primary w-full py-4 text-sm flex items-center justify-center gap-2"
                            >
                                {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <PackageCheck className="w-5 h-5" />}
                                Confirm Pickup
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 text-green-600 font-bold text-xs bg-green-50 p-3 rounded-xl">
                                <CheckCircle2 className="w-4 h-4" /> Picked up successfully
                            </div>
                        )}
                    </div>
                </div>

                {/* Delivery Section */}
                <div className={`card overflow-hidden transition-all border-l-4 ${['picked_up', 'in_transit'].includes(order.status) ? 'border-l-[var(--color-primary)] shadow-xl scale-[1.02]' : 'border-l-gray-200 opacity-60'}`}>
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Client Destination</p>
                                <h2 className="text-xl font-bold text-gray-900">{order.customer?.full_name}</h2>
                            </div>
                            <div className="flex gap-2">
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-11 h-11 flex items-center justify-center bg-blue-50 text-blue-600 rounded-2xl"
                                >
                                    <Navigation className="w-5 h-5" />
                                </a>
                                <a href={`tel:${order.customer?.phone}`} className="w-11 h-11 flex items-center justify-center bg-blue-50 text-blue-600 rounded-2xl">
                                    <Phone className="w-5 h-5" />
                                </a>
                            </div>
                        </div>

                        <div className="flex gap-3 mb-6">
                            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <p className="text-sm font-bold text-gray-700">{order.delivery_address}</p>
                        </div>

                        {order.delivery_notes && (
                            <div className="mb-6 p-3 bg-blue-50/50 rounded-xl flex gap-2 border border-blue-100">
                                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <p className="text-xs text-blue-800 font-medium italic">"{order.delivery_notes}"</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {order.status === 'picked_up' && (
                                <button
                                    onClick={() => updateStatus('in_transit')}
                                    className="btn btn-primary w-full py-4 text-sm bg-blue-600 border-blue-600 flex items-center justify-center gap-2"
                                >
                                    <Navigation className="w-5 h-5" />
                                    Start Trip
                                </button>
                            )}
                            {order.status === 'in_transit' && (
                                <button
                                    onClick={() => updateStatus('delivered')}
                                    className="btn btn-primary w-full py-4 text-sm bg-green-600 border-green-600 flex items-center justify-center gap-2"
                                >
                                    <PackageCheck className="w-5 h-5" />
                                    Complete Delivery
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items Summary Accordion */}
                <div className="card overflow-hidden">
                    <button
                        onClick={() => setShowItems(!showItems)}
                        className="w-full p-4 flex items-center justify-between text-left"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                <List className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">Order Contents</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.items?.length || 0} Items</p>
                            </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showItems ? 'rotate-180' : ''}`} />
                    </button>

                    {showItems && (
                        <div className="px-4 pb-4 space-y-2 border-t border-gray-50 pt-4">
                            {order.items?.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-gray-50 rounded-lg">
                                    <span className="text-gray-600 font-medium">
                                        <span className="text-[var(--color-primary)] font-bold mr-2">{item.quantity}x</span>
                                        {item.menu_item?.name}
                                    </span>
                                </div>
                            ))}
                            <div className="mt-4 pt-4 border-t border-dashed border-gray-200 flex justify-between items-center px-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rider Reward</span>
                                <span className="text-sm font-bold text-[var(--color-primary)]">{formatCurrency(order.delivery_fee || 0)}</span>
                            </div>
                            <div className="mt-2 flex justify-between items-center px-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Value</span>
                                <span className="text-lg font-bold text-gray-900">{formatCurrency(order.total)}</span>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
