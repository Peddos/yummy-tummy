'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
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
            .in('status', ['paid', 'preparing', 'ready_for_pickup', 'assigned_to_rider', 'picked_up', 'in_transit'])
            .order('created_at', { ascending: false })

        if (!error) setActiveOrders(data || [])
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">
                            F
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 leading-tight">Food Delivery</h1>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Customer Portal</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/customer/orders" className="p-2 text-gray-400 hover:text-blue-600 transition">
                            <History className="w-6 h-6" />
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Live Order Tracker - Only shows confirmed/paid orders */}
                {activeOrders.length > 0 && (
                    <div className="mb-14 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-2 mb-6 px-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/60">
                            <div className="w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
                            Active Tracked Orders
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeOrders.map(order => (
                                <div
                                    key={order.id}
                                    onClick={() => router.push('/customer/orders')}
                                    className="bg-white rounded-[40px] p-8 shadow-2xl shadow-blue-100/50 border border-blue-50/50 flex flex-col gap-6 cursor-pointer hover:scale-[1.02] transition-all duration-300 group relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                            <Package className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-blue-600/40 mb-1 uppercase tracking-widest">{order.vendor?.business_name}</p>
                                            <h3 className="text-xl font-black text-slate-900 leading-tight">
                                                {getOrderStatusLabel(order.status)}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 flex gap-1.5">
                                            {[1, 2, 3, 4].map(idx => (
                                                <div key={idx} className={`h-1.5 flex-1 rounded-full transition-all duration-1000 ${idx <= 2 ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]' : 'bg-slate-100'
                                                    }`}></div>
                                            ))}
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                    </div>
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
