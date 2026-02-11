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
    Bell, Map as MapIcon, X
} from 'lucide-react'
import NotificationBell from '@/components/ui/NotificationBell'
import dynamic from 'next/dynamic'

const Map = dynamic(() => import('@/components/ui/Map'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-96 bg-gray-100 flex items-center justify-center rounded-3xl animate-pulse">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
    )
})

export default function CustomerDashboard() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [vendors, setVendors] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [activeOrders, setActiveOrders] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All Discovery')
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')

    useEffect(() => {
        checkUser()
        fetchData()
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

    const fetchData = async () => {
        // Fetch Vendors
        const { data: vendorsData } = await supabase
            .from('vendors')
            .select('*')
            .eq('is_active', true)
            .eq('approval_status', 'approved')
            .order('rating', { ascending: false })

        if (vendorsData) setVendors(vendorsData)

        // Fetch Categories
        const { data: categoriesData } = await supabase
            .from('business_categories')
            .select('*')
            .order('name')

        if (categoriesData) setCategories(categoriesData)
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

    const filteredVendors = vendors.filter(v => {
        const matchesSearch = v.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.cuisine_type?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesCategory = selectedCategory === 'All Discovery' ||
            categories.find(c => c.name === selectedCategory)?.id === v.business_category_id

        return matchesSearch && matchesCategory
    })

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
                                    <span>Current Location</span>
                                    <ChevronRight className="w-2.5 h-2.5" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <NotificationBell />
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
                <div className="mb-8 overflow-hidden">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Explore Categories</h2>
                        <Filter className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                        {['All Discovery', ...categories.map(c => c.name)].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2.5 rounded-xl whitespace-nowrap text-xs font-black tracking-wide transition-all uppercase ${(selectedCategory === cat)
                                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-200 transform scale-105'
                                    : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-300 shadow-sm'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Top Performers Spotlight */}
                {vendors.some(v => v.rating >= 4.5) && (
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-4 px-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Top Performers</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {vendors.filter(v => v.rating >= 4.5).slice(0, 2).map(vendor => (
                                <div
                                    key={vendor.id}
                                    onClick={() => router.push(`/customer/vendor/${vendor.id}`)}
                                    className="bg-gray-900 rounded-3xl p-6 relative overflow-hidden cursor-pointer group shadow-2xl shadow-gray-200"
                                >
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--color-primary)] to-purple-600 opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-30 transition-opacity" />
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-white text-[10px] font-black uppercase tracking-widest mb-2 inline-block">
                                                    Featured
                                                </span>
                                                <h3 className="text-2xl font-black text-white mb-1 group-hover:text-[var(--color-primary)] transition-colors">{vendor.business_name}</h3>
                                                <p className="text-gray-400 text-xs font-medium">{vendor.cuisine_type} • {vendor.address}</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white font-black text-lg border border-white/10">
                                                {vendor.rating.toFixed(1)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>Under 30 mins</span>
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-gray-600" />
                                            <div className="flex items-center gap-1.5 text-[var(--color-primary)]">
                                                <TrendingUp className="w-3.5 h-3.5" />
                                                <span>Trending today</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Vendors Grid / Map Toggle */}
                <div>
                    <div className="flex items-center justify-between mb-6 px-1">
                        <div className="flex items-center gap-4">
                            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Nearby Locations</h2>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <Package className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('map')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    <MapIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {filteredVendors.length} Spots
                        </span>
                    </div>

                    {viewMode === 'map' ? (
                        <div className="w-full h-96 bg-gray-100 rounded-3xl overflow-hidden relative shadow-inner z-0">
                            <Map vendors={filteredVendors} center={[-1.2921, 36.8219]} />
                            <button
                                onClick={() => setViewMode('grid')}
                                className="absolute top-4 right-4 bg-white p-2 rounded-xl shadow-lg z-[1000] hover:bg-gray-50 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    ) : filteredVendors.length === 0 ? (
                        <div className="text-center py-20 card border-none shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShoppingBag className="w-8 h-8 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">Discovery Failed</h3>
                            <p className="text-gray-400 text-sm font-medium">We couldn't find any spots matching your criteria.</p>
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
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                            <div className="flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-blue-500" />
                                                    <span>20-35 min</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapIcon className="w-4 h-4 text-green-500" />
                                                    <span>nearby</span>
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
