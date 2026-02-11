'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/ui/StatusBadge'
import {
    ArrowLeft, Package, Clock, MapPin,
    Phone, Store, Bike, ChefHat, CheckCircle2,
    Loader2, AlertCircle, Navigation, Star, X, Utensils
} from 'lucide-react'
import Link from 'next/link'

export default function OrderTrackingPage() {
    const { id } = useParams()
    const router = useRouter()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showRating, setShowRating] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [ratings, setRatings] = useState({ vendor: 5, rider: 5 })
    const [comments, setComments] = useState({ vendor: '', rider: '' })

    useEffect(() => {
        if (!id) return
        fetchOrder()

        const channel = supabase
            .channel(`order-${id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${id}`
            }, (payload) => {
                setOrder((prev: any) => prev ? { ...prev, ...payload.new } : payload.new)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [id])

    const fetchOrder = async () => {
        if (!id) return
        try {
            setLoading(true)
            setError(null)

            // Stage 1: Fetch base order (Minimal Joins)
            const { data: baseOrder, error: baseErr } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single()

            if (baseErr) throw baseErr
            setOrder(baseOrder)

            // Stage 2: Fetch Joins (Resilient)
            const { data: fullData, error: joinErr } = await supabase
                .from('orders')
                .select(`
                    vendor:vendor_id (*),
                    rider:rider_id (*, profile:id (full_name, phone)),
                    items:order_items (*, menu_item:menu_item_id (name))
                `)
                .eq('id', id)
                .single()

            if (!joinErr && fullData) {
                setOrder((prev: any) => prev ? { ...prev, ...fullData } : fullData)
            } else if (joinErr) {
                console.warn('Metadata enrichment failed:', joinErr)
            }

        } catch (err: any) {
            console.error('Core fetch error:', err)
            setError(err.message || 'Unknown synchronization error')
        } finally {
            setLoading(false)
        }
    }

    const handleConfirmDelivery = async () => {
        try {
            setSubmitting(true)
            // 1. Update Order Status to delivered
            const { error: orderError } = await (supabase.from('orders') as any)
                .update({ status: 'delivered' })
                .eq('id', id)

            if (orderError) throw orderError

            // 2. Submit Reviews
            const { error: reviewError } = await (supabase.from('reviews') as any)
                .upsert({
                    order_id: id,
                    customer_id: order.customer_id,
                    vendor_id: order.vendor_id,
                    rider_id: order.rider_id,
                    vendor_rating: ratings.vendor,
                    rider_rating: ratings.rider,
                    vendor_comment: comments.vendor,
                    rider_comment: comments.rider
                })

            if (reviewError) console.error('Review Error:', reviewError)

            setShowRating(false)
            fetchOrder()
            alert('🎉 Thank you for your feedback! Enjoy your meal.')
        } catch (err: any) {
            alert(`Failed to confirm delivery: ${err.message}`)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)] opacity-50" />
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                <AlertCircle className="w-16 h-16 text-red-100 mb-6" />
                <h2 className="text-2xl font-black text-gray-900 mb-2">Order Synchronization Failed</h2>
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-8 max-w-sm">
                    <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1">Error Diagnostic</p>
                    <p className="text-red-500 text-sm font-bold leading-tight">
                        {error || "Order session ID mismatch. We couldn't find this order record."}
                    </p>
                </div>
                <button onClick={() => router.back()} className="btn btn-primary px-8">Return Home</button>
            </div>
        )
    }

    const steps = [
        { key: 'paid', label: 'Payment Recieved', icon: CheckCircle2, color: 'text-green-500' },
        { key: 'confirmed', label: 'Confirmed by Restuarant', icon: Store, color: 'text-orange-500' },
        { key: 'preparing', label: 'In the Kitchen', icon: ChefHat, color: 'text-blue-500' },
        { key: 'ready_for_pickup', label: 'Order Packaged', icon: Package, color: 'text-purple-500' },
        { key: 'picked_up', label: 'Out for Delivery', icon: Bike, color: 'text-[var(--color-primary)]' },
        { key: 'arrived', label: 'Courier at Location', icon: MapPin, color: 'text-orange-600' },
        { key: 'delivered', label: 'Enjoy Your Meal', icon: Utensils, color: 'text-green-600' }
    ]

    const getStepStatus = (stepKey: string) => {
        const statusMap: Record<string, number> = {
            'pending_payment': 0,
            'paid': 1,
            'confirmed': 2,
            'preparing': 3,
            'ready_for_pickup': 4,
            'assigned_to_rider': 4,
            'picked_up': 5,
            'in_transit': 5,
            'arrived': 6,
            'delivered': 7,
            'completed': 7
        }

        const currentLevel = statusMap[order.status] || 0
        const stepLevel = steps.findIndex(s => s.key === stepKey) + 1

        if (currentLevel >= stepLevel) return 'completed'
        if (currentLevel === stepLevel - 1) return 'active'
        return 'pending'
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none mb-1">Live Tracking</h1>
                        <p className="text-[10px] font-bold text-gray-400">Order #{order.order_number}</p>
                    </div>
                    <div className="relative">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping absolute -top-0.5 -right-0.5" />
                        <StatusBadge status={order.status} className="text-[10px]" />
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-xl mx-auto w-full px-4 py-8 space-y-6">
                {/* 1. Visual Progress */}
                <div className="card p-8 border-none shadow-sm overflow-hidden relative">
                    <div className="flex flex-col gap-8">
                        {steps.map((step, idx) => {
                            const status = getStepStatus(step.key)
                            const Icon = step.icon

                            return (
                                <div key={step.key} className="flex gap-6 relative">
                                    {/* Line connector */}
                                    {idx !== steps.length - 1 && (
                                        <div className={`absolute left-6 top-10 bottom-[-2rem] w-0.5 ${status === 'completed' ? 'bg-green-500' : 'bg-gray-100'}`} />
                                    )}

                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 relative z-10 ${status === 'completed' ? 'bg-green-100 text-green-600' :
                                        status === 'active' ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)] ring-4 ring-[var(--color-primary-light)]/50' :
                                            'bg-gray-50 text-gray-300'
                                        }`}>
                                        <Icon className={`w-6 h-6 ${status === 'active' ? 'animate-pulse' : ''}`} />
                                    </div>

                                    <div className="flex-1 pt-3">
                                        <p className={`text-sm font-black uppercase tracking-widest leading-none mb-1 ${status === 'pending' ? 'text-gray-300' : 'text-gray-900'
                                            }`}>
                                            {step.label}
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                            {status === 'completed' ? 'Verified' : status === 'active' ? 'Processing Now' : 'Upcoming Stage'}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* 2. Restaurant / Delivery Details */}
                <div className="grid grid-cols-1 gap-4">
                    <div className="card p-6 border-none shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shadow-inner">
                                <Store className="w-7 h-7" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Provider</p>
                                <h3 className="text-xl font-black text-gray-900 leading-none">{order.vendor?.business_name}</h3>
                                <p className="text-xs text-gray-400 font-medium mt-2 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {order.vendor?.address}
                                </p>
                            </div>
                        </div>
                    </div>

                    {order.rider && (
                        <div className="card p-6 border-none shadow-sm bg-[var(--color-primary-light)]/30 border border-[var(--color-primary-light)]">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white text-[var(--color-primary)] rounded-2xl flex items-center justify-center shadow-sm">
                                    <Bike className="w-7 h-7" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest leading-none mb-1">Courier Dispatched</p>
                                    <h3 className="text-xl font-black text-gray-900 leading-none">{order.rider.profile?.full_name}</h3>
                                    <p className="text-xs text-gray-500 font-bold mt-2 flex items-center gap-1">
                                        {order.rider.vehicle_type} • {order.rider.vehicle_number}
                                    </p>
                                </div>
                                <a href={`tel:${order.rider.profile?.phone}`} className="w-12 h-12 bg-[var(--color-primary)] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20 active:scale-90 transition-transform">
                                    <Phone className="w-5 h-5" />
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Order Summary */}
                <div className="card p-6 border-none shadow-sm">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Manifest Content</h3>
                    <div className="space-y-4">
                        {order.items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center text-[10px] font-black text-[var(--color-primary)] border border-gray-100">
                                        {item.quantity}
                                    </span>
                                    <p className="text-sm font-bold text-gray-800">{item.menu_item?.name}</p>
                                </div>
                                <p className="text-sm font-black text-gray-900">{formatCurrency(item.total_price)}</p>
                            </div>
                        ))}

                        <div className="pt-4 border-t border-gray-50 space-y-2">
                            <div className="flex justify-between text-xs font-bold text-gray-400">
                                <span>LOGISTICS FEE</span>
                                <span>{formatCurrency(order.delivery_fee)}</span>
                            </div>
                            <div className="flex justify-between items-end pt-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Settlemet</p>
                                <p className="text-xl font-black text-[var(--color-primary)] leading-none">{formatCurrency(order.total)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Delivery Address */}
                <div className="card p-6 border-none shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 border border-gray-100">
                            <Navigation className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">Drop-off Point</p>
                            <p className="text-sm font-bold text-gray-700 leading-relaxed">{order.delivery_address}</p>
                            {order.delivery_notes && (
                                <p className="text-xs text-gray-400 font-medium mt-2 bg-gray-50 p-3 rounded-lg border-l-2 border-[var(--color-primary)] italic">
                                    "{order.delivery_notes}"
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Confirmation & Rating UI */}
            {order.status === 'arrived' && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
                    <div className="max-w-xl mx-auto">
                        <button
                            onClick={() => setShowRating(true)}
                            className="btn btn-primary w-full h-14 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-[var(--color-primary)]/20 active:scale-[0.98] transition-all"
                        >
                            Confirm & Rate Package
                        </button>
                    </div>
                </div>
            )}

            {showRating && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowRating(false)} />
                    <div className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] relative z-10 p-8 shadow-2xl animate-in slide-in-from-bottom duration-500">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-gray-900 leading-none">Rate Your Experience</h2>
                            <button onClick={() => setShowRating(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Vendor Rating */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center">
                                        <Store className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Food Quality ( {order.vendor?.business_name} )</p>
                                </div>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRatings(prev => ({ ...prev, vendor: star }))}
                                            className={`p-2 rounded-xl transition-all ${ratings.vendor >= star ? 'text-orange-500 bg-orange-50 scale-110' : 'text-gray-200'}`}
                                        >
                                            <Star className="w-8 h-8 fill-current" />
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    value={comments.vendor}
                                    onChange={(e) => setComments(prev => ({ ...prev, vendor: e.target.value }))}
                                    placeholder="Any feedback for the restaurant?"
                                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-orange-100 resize-none h-20"
                                />
                            </div>

                            {/* Rider Rating */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center">
                                        <Bike className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Logistics ( {order.rider?.profile?.full_name} )</p>
                                </div>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRatings(prev => ({ ...prev, rider: star }))}
                                            className={`p-2 rounded-xl transition-all ${ratings.rider >= star ? 'text-blue-500 bg-blue-50 scale-110' : 'text-gray-200'}`}
                                        >
                                            <Star className="w-8 h-8 fill-current" />
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    value={comments.rider}
                                    onChange={(e) => setComments(prev => ({ ...prev, rider: e.target.value }))}
                                    placeholder="How was the delivery service?"
                                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-100 resize-none h-20"
                                />
                            </div>

                            <button
                                onClick={handleConfirmDelivery}
                                disabled={submitting}
                                className="btn btn-primary w-full h-16 rounded-2xl text-base flex items-center justify-center gap-3"
                            >
                                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                                Complete & Confirm Delivery
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
