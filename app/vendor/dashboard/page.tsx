'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
    LayoutDashboard, Utensils, ClipboardList, TrendingUp,
    Settings, LogOut, Package, Wallet, Star, ChevronRight,
    Bell, Search, Loader2
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function VendorDashboard() {
    const router = useRouter()
    const [id, setVendorId] = useState<string | null>(null)
    const [vendor, setVendor] = useState<any>(null)
    const [stats, setStats] = useState({
        pendingOrders: 0,
        totalEarnings: 0,
        activeMenu: 0,
        recentOrders: [] as any[]
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()

        // Real-time listener for dashboard updates
        const channel = supabase
            .channel('vendor-dashboard-sync')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders'
            }, () => fetchDashboardData())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const fetchDashboardData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/auth/login?role=vendor')
            return
        }

        // 1. Get vendor info
        const { data: vendorData, error: vError } = (await supabase
            .from('vendors')
            .select('*')
            .eq('id', user.id)
            .single()) as { data: any, error: any }

        if (vError || !vendorData) {
            console.error('Vendor error:', vError)
            setLoading(false)
            return
        }
        setVendor(vendorData)
        setVendorId(user.id)

        // 2. Get stats
        const { data: orders } = (await supabase
            .from('orders')
            .select('*')
            .eq('vendor_id', user.id)) as { data: any[] | null }

        const { count: menuCount } = await supabase
            .from('menu_items')
            .select('*', { count: 'exact' })
            .eq('vendor_id', user.id)
            .eq('is_available', true)

        const earnings = orders?.filter(o => o.status === 'completed')
            .reduce((sum, o) => sum + Number(o.subtotal), 0) || 0

        setStats({
            pendingOrders: orders?.filter(o => !['delivered', 'completed', 'cancelled', 'pending_payment'].includes(o.status)).length || 0,
            totalEarnings: earnings,
            activeMenu: menuCount || 0,
            recentOrders: orders?.slice(0, 5) || []
        })

        setLoading(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col w-72 bg-white border-r h-screen sticky top-0">
                <div className="p-8 border-b">
                    <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        M-Delivery
                    </h1>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Vendor Portal</p>
                </div>

                <nav className="flex-1 p-6 space-y-1">
                    <Link href="/vendor/dashboard" className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-600 rounded-2xl font-black transition">
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                    </Link>
                    <Link href="/vendor/dashboard/orders" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl font-bold transition">
                        <ClipboardList className="w-5 h-5" /> Orders
                    </Link>
                    <Link href="/vendor/dashboard/menu" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl font-bold transition">
                        <Utensils className="w-5 h-5" /> Menu Items
                    </Link>
                    <div className="pt-6 mt-6 border-t px-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Account</p>
                        <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left py-2 text-gray-400 hover:text-red-500 font-bold transition">
                            <LogOut className="w-5 h-5" /> Sign Out
                        </button>
                    </div>
                </nav>

                {/* Profile Card */}
                <div className="p-6 border-t">
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-black">
                            {vendor?.business_name?.[0]}
                        </div>
                        <div className="truncate">
                            <p className="text-sm font-black text-gray-900 truncate">{vendor?.business_name}</p>
                            <span className={`text-[10px] font-black uppercase ${vendor?.is_active ? 'text-green-500' : 'text-red-500'}`}>
                                {vendor?.is_active ? 'Live Now' : 'Offline'}
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-h-screen">
                {/* Mobile Header / Search Bar */}
                <header className="bg-white px-8 py-6 border-b flex items-center justify-between">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search orders, dishes..."
                            className="bg-gray-100 border-0 rounded-2xl pl-12 pr-4 py-3 w-full focus:ring-2 focus:ring-blue-500 transition"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 relative hover:text-blue-600 cursor-pointer transition">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </div>
                    </div>
                </header>

                <div className="p-10 max-w-6xl">
                    <div className="mb-10">
                        <h2 className="text-4xl font-black text-gray-900 mb-2">Hello, {vendor?.business_name}!</h2>
                        <p className="text-gray-500 font-medium">Here's how your business is doing today</p>
                    </div>

                    {/* Dashboard Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-50 transition duration-300">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                <Package className="w-6 h-6" />
                            </div>
                            <p className="text-4xl font-black text-gray-900 mb-1">{stats.pendingOrders}</p>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Pending Orders</p>
                        </div>

                        <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-green-50 transition duration-300">
                            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <p className="text-4xl font-black text-gray-900 mb-1">{formatCurrency(stats.totalEarnings)}</p>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Revenue</p>
                        </div>

                        <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-purple-50 transition duration-300">
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                                <Utensils className="w-6 h-6" />
                            </div>
                            <p className="text-4xl font-black text-gray-900 mb-1">{stats.activeMenu}</p>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Active Dishes</p>
                        </div>

                        <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-yellow-50 transition duration-300">
                            <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center mb-6">
                                <Star className="w-6 h-6" />
                            </div>
                            <p className="text-4xl font-black text-gray-900 mb-1">{vendor?.rating || 'New'}</p>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Customer Rating</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Quick Actions */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" /> Quick Actions
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Link
                                    href="/vendor/dashboard/menu"
                                    className="p-6 bg-white border border-gray-100 rounded-3xl hover:border-blue-500 hover:bg-blue-50/20 group transition"
                                >
                                    <h4 className="font-black text-gray-900 group-hover:text-blue-600 transition">Update Menu</h4>
                                    <p className="text-xs text-gray-400 mt-1">Add new dishes or change prices</p>
                                </Link>
                                <Link
                                    href="/vendor/dashboard/orders"
                                    className="p-6 bg-white border border-gray-100 rounded-3xl hover:border-blue-500 hover:bg-blue-50/20 group transition"
                                >
                                    <h4 className="font-black text-gray-900 group-hover:text-blue-600 transition">Incoming Orders</h4>
                                    <p className="text-xs text-gray-400 mt-1">Manage and track live orders</p>
                                </Link>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
                            <div className="bg-white border border-gray-100 rounded-[35px] overflow-hidden">
                                {stats.recentOrders.length === 0 ? (
                                    <div className="p-10 text-center text-gray-400 italic">No activity yet today</div>
                                ) : (
                                    stats.recentOrders.map((order, idx) => (
                                        <div key={order.id} className="p-5 border-b last:border-0 flex items-center justify-between hover:bg-gray-50 transition">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-blue-600">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">Order #{order.order_number}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase font-black">{formatDate(order.created_at)}</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-300" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
