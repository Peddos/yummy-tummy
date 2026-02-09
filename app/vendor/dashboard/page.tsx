'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import MetricCard from '@/components/ui/MetricCard'
import StatusBadge from '@/components/ui/StatusBadge'
import {
    LayoutDashboard, Utensils, ClipboardList, LogOut, Package,
    Wallet, Star, TrendingUp, Loader2, Bell, Menu, X
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function VendorDashboard() {
    const router = useRouter()
    const [vendor, setVendor] = useState<any>(null)
    const [stats, setStats] = useState({
        pendingOrders: 0,
        totalEarnings: 0,
        activeMenu: 0,
        recentOrders: [] as any[]
    })
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        fetchDashboardData()

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

        const { data: vendorData, error: vError } = await supabase
            .from('vendors')
            .select('*')
            .eq('id', user.id)
            .single()

        if (vError || !vendorData) {
            console.error('Vendor error:', vError)
            setLoading(false)
            return
        }
        setVendor(vendorData)

        const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .eq('vendor_id', user.id)

        const { count: menuCount } = await supabase
            .from('menu_items')
            .select('*', { count: 'exact' })
            .eq('vendor_id', user.id)
            .eq('is_available', true)

        const earnings = (orders as any[])?.filter((o: any) => o.status === 'delivered' || o.status === 'completed')
            .reduce((sum: number, o: any) => sum + Number(o.subtotal || 0), 0) || 0

        setStats({
            pendingOrders: (orders as any[])?.filter((o: any) => !['delivered', 'completed', 'cancelled', 'pending_payment'].includes(o.status)).length || 0,
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
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)]" />
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900">Yummy Tummy</h1>
                    <p className="text-xs text-gray-500 mt-1">Vendor Portal</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link
                        href="/vendor/dashboard"
                        className="flex items-center gap-3 px-4 py-3 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-lg font-medium transition"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                    </Link>
                    <Link
                        href="/vendor/dashboard/orders"
                        className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition"
                    >
                        <ClipboardList className="w-5 h-5" />
                        Orders
                    </Link>
                    <Link
                        href="/vendor/dashboard/menu"
                        className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition"
                    >
                        <Utensils className="w-5 h-5" />
                        Menu Items
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="card p-3 mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-white font-bold">
                                {vendor?.business_name?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{vendor?.business_name}</p>
                                <span className={`text-xs font-medium ${vendor?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                    {vendor?.is_active ? '● Online' : '● Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-gray-600 hover:text-red-600 font-medium transition"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-h-screen">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between lg:justify-end">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden p-2 text-gray-600"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-gray-600 hover:text-gray-900">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                    </div>
                </header>

                <div className="p-6 max-w-7xl mx-auto">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {vendor?.business_name}!</h2>
                        <p className="text-gray-500">Here's what's happening with your business today</p>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <MetricCard
                            icon={Package}
                            label="Pending Orders"
                            value={stats.pendingOrders}
                            iconColor="text-blue-600"
                        />
                        <MetricCard
                            icon={Wallet}
                            label="Total Revenue"
                            value={formatCurrency(stats.totalEarnings)}
                            iconColor="text-green-600"
                            trend={{ value: 12, isPositive: true }}
                        />
                        <MetricCard
                            icon={Utensils}
                            label="Active Dishes"
                            value={stats.activeMenu}
                            iconColor="text-purple-600"
                        />
                        <MetricCard
                            icon={Star}
                            label="Rating"
                            value={vendor?.rating || 'New'}
                            iconColor="text-yellow-600"
                        />
                    </div>

                    {/* Quick Actions & Recent Orders */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Quick Actions */}
                        <div className="lg:col-span-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <Link
                                    href="/vendor/dashboard/menu"
                                    className="card card-hover p-4 flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                                        <Utensils className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Update Menu</p>
                                        <p className="text-xs text-gray-500">Add or edit dishes</p>
                                    </div>
                                </Link>
                                <Link
                                    href="/vendor/dashboard/orders"
                                    className="card card-hover p-4 flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <ClipboardList className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">View Orders</p>
                                        <p className="text-xs text-gray-500">Manage incoming orders</p>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="lg:col-span-2">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h3>
                            <div className="card">
                                {stats.recentOrders.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        No recent orders
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {stats.recentOrders.map((order) => (
                                            <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">Order #{order.order_number}</p>
                                                        <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-gray-900 mb-1">{formatCurrency(order.subtotal)}</p>
                                                    <StatusBadge status={order.status} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden" onClick={() => setSidebarOpen(false)}>
                    <div className="w-64 h-full bg-white" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h1 className="text-xl font-bold text-gray-900">Menu</h1>
                            <button onClick={() => setSidebarOpen(false)}>
                                <X className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>
                        <nav className="p-4 space-y-1">
                            <Link href="/vendor/dashboard" className="flex items-center gap-3 px-4 py-3 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-lg font-medium">
                                <LayoutDashboard className="w-5 h-5" />
                                Dashboard
                            </Link>
                            <Link href="/vendor/dashboard/orders" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">
                                <ClipboardList className="w-5 h-5" />
                                Orders
                            </Link>
                            <Link href="/vendor/dashboard/menu" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium">
                                <Utensils className="w-5 h-5" />
                                Menu Items
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
                            >
                                <LogOut className="w-5 h-5" />
                                Sign Out
                            </button>
                        </nav>
                    </div>
                </div>
            )}
        </div>
    )
}
