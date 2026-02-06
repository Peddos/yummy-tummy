'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import ShoppingCart from '@/components/cart/ShoppingCart'
import {
    Clock, Package, MapPin, Star, History, ArrowRight,
    TrendingUp, CheckCircle2, Loader2, AlertCircle
} from 'lucide-react'
import { getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'

export default function CustomerDashboard() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [vendors, setVendors] = useState<any[]>([])
    const [activeOrders, setActiveOrders] = useState<any[]>([])

    useEffect(() => {
        checkUser()
        fetchVendors()
        fetchActiveOrders()

        // Real-time listener for order status changes
        const channel = supabase
            .channel('customer-orders')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders'
            }, () => fetchActiveOrders())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/auth/login?role=customer')
            return
        }
        setUser(user)
        setLoading(false)
    }

    const fetchActiveOrders = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                vendor:vendor_id (business_name)
            `)
            .eq('customer_id', user.id)
            .in('status', ['pending_payment', 'paid', 'preparing', 'ready_for_pickup'])
            .order('created_at', { ascending: false })

        if (!error) setActiveOrders(data || [])
    }

    const retryPayment = async (order: any) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get user phone from profile if not available elsewhere
            const { data: profile } = await supabase
                .from('profiles')
                .select('phone')
                .eq('id', user.id)
                .single()

            const response = await fetch('/api/checkout/stk-push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: order.total,
                    phone: profile?.phone || '',
                    orderId: order.id
                })
            })

            const result = await response.json()
            if (response.ok) {
                alert('Payment prompt sent to your phone!')
            } else {
                alert(result.error || 'Failed to send payment prompt')
            }
        } catch (error) {
            console.error('Retry payment error:', error)
            alert('An error occurred. Please try again.')
        }
    }

    const fetchVendors = async () => {
        const { data, error } = await supabase
            .from('vendors')
            .select('*')
            .eq('is_active', true)
            .order('rating', { ascending: false })

        if (error) {
            console.error('Error fetching vendors:', error)
        } else {
            setVendors(data || [])
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Food Delivery
                            </h1>
                            <p className="text-sm text-gray-600">Welcome back, {user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Active Order Tracker */}
                {activeOrders.length > 0 && (
                    <div className="mb-12 animate-in fade-in slide-in-from-top duration-500">
                        <div className="flex items-center gap-2 mb-4 px-2 text-xs font-black uppercase tracking-widest text-blue-600">
                            <TrendingUp className="w-4 h-4" />
                            Live Order Status
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeOrders.map(order => (
                                <div key={order.id} onClick={() => router.push('/customer/orders')} className="bg-white rounded-[35px] p-6 shadow-xl shadow-blue-100 border border-blue-100 flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform group">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-blue-50 rounded-[25px] flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                            <Package className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-400 mb-1 uppercase tracking-widest">{order.vendor?.business_name}</p>
                                            <h3 className="text-xl font-black text-slate-900 leading-tight">
                                                {order.status === 'pending_payment' ? 'Waiting for Payment' : getOrderStatusLabel(order.status)}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4].map(idx => (
                                                        <div key={idx} className={`h-1 w-8 rounded-full ${order.status === 'pending_payment' ? (idx === 1 ? 'bg-yellow-400' : 'bg-slate-100') :
                                                                idx <= 2 ? 'bg-blue-600' : 'bg-slate-100'
                                                            }`}></div>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] font-black text-blue-600 uppercase">
                                                    {order.status === 'pending_payment' ? 'Step 1 of 4' : 'Step 2 of 4'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {order.status === 'pending_payment' ? (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                retryPayment(order);
                                            }}
                                            className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                                        >
                                            Pay Now
                                        </button>
                                    ) : (
                                        <ArrowRight className="w-6 h-6 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-8">
                    <h2 className="text-4xl font-black text-gray-900 mb-2">Browse Restaurants</h2>
                    <p className="text-gray-500 font-medium tracking-tight">Discover delicious food from local vendors</p>
                </div>

                {/* Vendors Grid */}
                {vendors.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🍽️</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No vendors available yet</h3>
                        <p className="text-gray-600">Check back soon for delicious food options!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {vendors.map((vendor) => (
                            <div
                                key={vendor.id}
                                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer group"
                                onClick={() => router.push(`/customer/vendor/${vendor.id}`)}
                            >
                                {/* Vendor Image */}
                                <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 relative overflow-hidden">
                                    {vendor.image_url ? (
                                        <img
                                            src={vendor.image_url}
                                            alt={vendor.business_name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                                            🍔
                                        </div>
                                    )}
                                </div>

                                {/* Vendor Info */}
                                <div className="p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">
                                        {vendor.business_name}
                                    </h3>

                                    {vendor.cuisine_type && (
                                        <p className="text-sm text-gray-600 mb-3">
                                            🍽️ {vendor.cuisine_type}
                                        </p>
                                    )}

                                    {vendor.description && (
                                        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                                            {vendor.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between">
                                        {/* Rating */}
                                        <div className="flex items-center gap-1">
                                            <span className="text-yellow-500">⭐</span>
                                            <span className="font-semibold text-gray-900">
                                                {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}
                                            </span>
                                            {vendor.total_reviews > 0 && (
                                                <span className="text-sm text-gray-500">
                                                    ({vendor.total_reviews})
                                                </span>
                                            )}
                                        </div>

                                        {/* View Menu Button */}
                                        <span className="text-sm font-semibold text-blue-600 group-hover:text-blue-700">
                                            View Menu →
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Quick Stats */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-md">
                        <div className="text-3xl mb-2">🛒</div>
                        <h3 className="font-semibold text-gray-900 mb-1">My Orders</h3>
                        <p className="text-sm text-gray-600">View your order history</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md">
                        <div className="text-3xl mb-2">📍</div>
                        <h3 className="font-semibold text-gray-900 mb-1">Saved Addresses</h3>
                        <p className="text-sm text-gray-600">Manage delivery locations</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-md">
                        <div className="text-3xl mb-2">⭐</div>
                        <h3 className="font-semibold text-gray-900 mb-1">Favorites</h3>
                        <p className="text-sm text-gray-600">Your favorite restaurants</p>
                    </div>
                </div>
            </main>
            <ShoppingCart />
        </div>
    )
}
