'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import BottomNav from '@/components/navigation/BottomNav'
import StatusBadge from '@/components/ui/StatusBadge'
import {
    Home, Package, User as UserIcon, Search, MapPin, Clock,
    Star, TrendingUp, Loader2, ShoppingBag, Filter, ChevronRight,
    Bell, Map as MapIcon
} from 'lucide-react'

export default function CustomerDashboard() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [vendors, setVendors] = useState<any[]>([])
    const [activeOrders, setActiveOrders] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        checkUser()
        fetchVendors()
        fetchActiveOrders()

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

        if (!error) setVendors(data || [])
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
            .in('status', ['paid', 'confirmed', 'preparing', 'ready_for_pickup', 'assigned_to_rider', 'picked_up', 'in_transit'])
            .order('created_at', { ascending: false })

        if (!error) setActiveOrders(data || [])
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const filteredVendors = vendors.filter(v =>
        v.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.cuisine_type?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)] opacity-50" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-28">
            {/* Premium Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/20">
                                <ShoppingBag className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-sm font-black text-gray-900 uppercase tracking-tighter leading-none mb-1">Delivering To</h1>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest leading-none">
                                    <MapPin className="w-2.5 h-2.5" />
                                    <span>Current Location • Nairobi</span>
                                    <ChevronRight className="w-2.5 h-2.5" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
                                <Bell className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                                title="Exit Session"
                            >
                                <UserIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Premium Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-[var(--color-primary)] transition-colors" />
                        <input
                            type="text"
                            placeholder="What are you craving today?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-100 border-none rounded-2xl text-sm font-bold placeholder:text-gray-400 focus:bg-white focus:ring-4 focus:ring-[var(--color-primary)-light] outline-none transition-all shadow-inner"
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Active Tracking Carousel */}
                {activeOrders.length > 0 && (
                    <div className="mb-10 animate-in slide-in-from-top-4">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Active Sessions</h2>
                            <Link href="/customer/orders" className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest hover:underline">
                                View Repository
                            </Link>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {activeOrders.map(order => (
                                <Link
                                    key={order.id}
                                    href={`/customer/orders/${order.id}`}
                                    className="flex-shrink-0 w-80 card p-5 flex items-center justify-between bg-white border-none shadow-xl shadow-gray-200/50 hover:scale-[1.02] transition-transform"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-light)] flex items-center justify-center border border-[var(--color-primary-light)]">
                                            <div className="relative">
                                                <Clock className="w-6 h-6 text-[var(--color-primary)] animate-pulse" />
                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-gray-900 leading-none mb-1 uppercase tracking-tighter">{order.vendor?.business_name}</p>
                                            <p className="text-[10px] font-bold text-gray-400 leading-none">TRACK LIVE • #{order.order_number}</p>
                                        </div>
                                    </div>
                                    <StatusBadge status={order.status} className="text-[8px] px-2 py-0.5" />
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filter Categories */}
                <div className="mb-10 overflow-hidden">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Cuisine Categories</h2>
                        <Filter className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                        {['All Discovery', 'Fast Food', 'Pizza & Italian', 'Asian Fusion', 'Healthy Greens', 'Sweet Treats'].map((cat) => (
                            <button
                                key={cat}
                                className={`px-6 py-3 rounded-2xl whitespace-nowrap text-xs font-black tracking-widest transition-all uppercase ${cat.includes('All')
                                    ? 'bg-gray-900 text-white shadow-xl shadow-gray-300'
                                    : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-200 shadow-sm'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Vendors Grid */}
                <div>
                    <div className="flex items-center justify-between mb-6 px-1">
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Available Restaurants</h2>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {filteredVendors.length} Locations
                        </span>
                    </div>

                    {filteredVendors.length === 0 ? (
                        <div className="text-center py-20 card border-none shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShoppingBag className="w-8 h-8 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">Discovery Failed</h3>
                            <p className="text-gray-400 text-sm font-medium">We couldn't find any restaurants matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredVendors.map((vendor) => (
                                <div
                                    key={vendor.id}
                                    className="group card p-0 overflow-hidden cursor-pointer border-none shadow-sm hover:shadow-2xl transition-all duration-500 relative bg-white"
                                    onClick={() => router.push(`/customer/vendor/${vendor.id}`)}
                                >
                                    {/* Cover Image */}
                                    <div className="h-52 bg-gray-100 relative overflow-hidden">
                                        {vendor.image_url ? (
                                            <img
                                                src={vendor.image_url}
                                                alt={vendor.business_name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 group-hover:bg-gray-200 transition-colors">
                                                <TrendingUp className="w-10 h-10 text-gray-200" />
                                            </div>
                                        )}

                                        {/* Premium Badges */}
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            <div className="px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl shadow-lg flex items-center gap-1.5 border border-gray-100">
                                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                                <span className="text-xs font-black text-gray-900">
                                                    {vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="absolute bottom-4 left-4 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                            <div className="px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-xl text-white text-[10px] font-black uppercase tracking-widest">
                                                Free Delivery
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Panel */}
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-black text-xl text-gray-900 tracking-tighter group-hover:text-[var(--color-primary)] transition-colors">
                                                {vendor.business_name}
                                            </h3>
                                        </div>

                                        <div className="flex items-center gap-2 mb-6">
                                            <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-gray-100">
                                                {vendor.cuisine_type || 'Gourmet'}
                                            </span>
                                            <span className="px-3 py-1 bg-orange-50 text-orange-500 rounded-lg text-[8px] font-black uppercase tracking-widest border border-orange-100">
                                                Global Express
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                            <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-blue-500" />
                                                    <span>20-35 min</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapIcon className="w-4 h-4 text-green-500" />
                                                    <span>1.8 KM</span>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Navigation */}
            <BottomNav
                items={[
                    { href: '/customer', icon: Home, label: 'Explore' },
                    { href: '/customer/orders', icon: ShoppingBag, label: 'Sessions' },
                    { href: '/customer/account', icon: UserIcon, label: 'Profile' },
                ]}
            />
        </div>
    )
}
