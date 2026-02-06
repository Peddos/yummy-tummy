'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
    LayoutDashboard, Users, Store, Bike, TrendingUp,
    Shield, Bell, Search, Loader2, Package, Wallet, CheckCircle,
    AlertTriangle, ArrowUpRight, ArrowDownRight, MoreVertical, Star
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface AdminStats {
    totalRevenue: number
    commission: number
    vendorCount: number
    riderCount: number
    activeOrders: number
    recentOrders: any[]
    vendors: any[]
    riders: any[]
}

export default function AdminDashboard() {
    const router = useRouter()
    const [stats, setStats] = useState<AdminStats>({
        totalRevenue: 0,
        commission: 0,
        vendorCount: 0,
        riderCount: 0,
        activeOrders: 0,
        recentOrders: [],
        vendors: [],
        riders: []
    })
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')

    useEffect(() => {
        fetchAdminData()
    }, [])

    const fetchAdminData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/auth/login?role=admin')
            return
        }

        // Verify admin role
        const { data: profile } = (await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()) as { data: any, error: any }

        if (profile?.role !== 'admin') {
            router.push('/auth/login?role=admin')
            return
        }

        try {
            // 1. Fetch Vendors
            const { data: vendors } = await supabase.from('vendors').select('*')

            // 2. Fetch Riders
            const { data: riders } = await supabase.from('riders').select('*')

            // 3. Fetch Orders & Calculate Finances
            const { data: orders }: { data: any[] | null } = await supabase
                .from('orders')
                .select(`
                    *,
                    customer:customer_id (full_name),
                    vendor:vendor_id (business_name)
                `)
                .order('created_at', { ascending: false })

            const totalRevenue = orders?.filter((o: any) => o.status === 'delivered')
                .reduce((sum: number, o: any) => sum + Number(o.total), 0) || 0

            const commission = totalRevenue * 0.1 // 10% Platform Commission

            setStats({
                totalRevenue,
                commission,
                vendorCount: vendors?.length || 0,
                riderCount: riders?.length || 0,
                activeOrders: orders?.filter((o: any) => !['delivered', 'cancelled'].includes(o.status)).length || 0,
                recentOrders: orders?.slice(0, 8) || [],
                vendors: vendors || [],
                riders: riders || []
            })
        } catch (error) {
            console.error('Error fetching admin data:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-blue-600">
            <Loader2 className="w-12 h-12 animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Admin Sidebar */}
            <aside className="hidden lg:flex flex-col w-72 bg-slate-900 text-slate-300 h-screen sticky top-0">
                <div className="p-8 border-b border-slate-800">
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <Shield className="text-blue-500" /> Admin
                    </h1>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Control Center</p>
                </div>

                <nav className="flex-1 p-6 space-y-1">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-bold transition ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-slate-800'}`}
                    >
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('vendors')}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-bold transition ${activeTab === 'vendors' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-slate-800 text-slate-400'}`}
                    >
                        <Store className="w-5 h-5" /> Vendors
                    </button>
                    <button
                        onClick={() => setActiveTab('riders')}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-bold transition ${activeTab === 'riders' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-slate-800 text-slate-400'}`}
                    >
                        <Bike className="w-5 h-5" /> Riders
                    </button>
                    <button
                        onClick={() => setActiveTab('finances')}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-bold transition ${activeTab === 'finances' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-slate-800 text-slate-400'}`}
                    >
                        <TrendingUp className="w-5 h-5" /> Finances
                    </button>
                </nav>

                <div className="p-6 border-t border-slate-800">
                    <button
                        onClick={async () => {
                            await supabase.auth.signOut()
                            router.push('/')
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-bold text-red-400 hover:bg-red-500/10 transition"
                    >
                        <CheckCircle className="w-5 h-5" /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 max-w-7xl">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900">System Oversight</h2>
                        <p className="text-slate-500 font-medium mt-1">Platform performance and aggregate metrics</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 relative hover:text-blue-600 cursor-pointer shadow-sm transition">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </div>
                        <div className="hidden sm:flex items-center gap-3 bg-white p-2 pr-4 rounded-2xl shadow-sm border border-gray-100">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm">
                                AD
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-black text-slate-900 leading-tight">Admin User</p>
                                <p className="text-[10px] font-bold text-slate-400">Super User</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all">
                        <div className="absolute top-0 right-0 p-4 bg-blue-50 text-blue-600 rounded-bl-[35px] group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <p className="text-4xl font-black text-slate-900 mb-1">{formatCurrency(stats.totalRevenue)}</p>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Sales</p>
                    </div>

                    <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all">
                        <div className="absolute top-0 right-0 p-4 bg-green-50 text-green-600 rounded-bl-[35px] group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <p className="text-4xl font-black text-slate-900 mb-1">{formatCurrency(stats.commission)}</p>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Platform Earn (10%)</p>
                    </div>

                    <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all">
                        <div className="absolute top-0 right-0 p-4 bg-purple-50 text-purple-600 rounded-bl-[35px] group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Store className="w-5 h-5" />
                        </div>
                        <p className="text-4xl font-black text-slate-900 mb-1">{stats.vendorCount}</p>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Registered Vendors</p>
                    </div>

                    <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-xl transition-all">
                        <div className="absolute top-0 right-0 p-4 bg-yellow-50 text-yellow-600 rounded-bl-[35px] group-hover:bg-yellow-600 group-hover:text-white transition-colors">
                            <Package className="w-5 h-5" />
                        </div>
                        <p className="text-4xl font-black text-slate-900 mb-1">{stats.activeOrders}</p>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Orders</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {activeTab === 'overview' && (
                        <>
                            {/* Recent Orders List */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="text-xl font-bold text-slate-900">Recent Platform Orders</h3>
                                    <button onClick={() => setActiveTab('finances')} className="text-sm font-black text-blue-600 hover:underline">View All</button>
                                </div>
                                <div className="bg-white rounded-[35px] shadow-sm border border-gray-100 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50/50 border-b">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Order</th>
                                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Store</th>
                                                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {stats.recentOrders.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-6 py-20 text-center text-slate-400 italic">No orders found yet.</td>
                                                </tr>
                                            ) : (
                                                stats.recentOrders.map((order) => (
                                                    <tr key={order.id} className="hover:bg-gray-50/50 transition duration-150">
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm font-bold text-slate-900">#{order.order_number}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold">{formatDate(order.created_at)}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm font-bold text-slate-700">{order.vendor?.business_name}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                                                                ${order.status === 'delivered' ? 'bg-green-100 text-green-600' :
                                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                                                                        'bg-blue-100 text-blue-600'}
                                                            `}>
                                                                {order.status.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Quick Stats / Rankings */}
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-6 px-2">Top Vendors</h3>
                                    <div className="space-y-4">
                                        {stats.vendors.slice(0, 5).map((v) => (
                                            <div key={v.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:scale-[1.02] transition">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-600 text-sm">
                                                        {v.business_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">{v.business_name}</p>
                                                        <div className="flex items-center gap-1">
                                                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                            <span className="text-[10px] font-black text-slate-400">{v.rating || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'vendors' && (
                        <div className="lg:col-span-3 animate-in fade-in duration-500">
                            <div className="flex justify-between items-center mb-8 px-2">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">Partner Vendors</h3>
                                    <p className="text-slate-400 text-sm font-bold">Manage restaurant partnerships and status</p>
                                </div>
                                <button className="px-5 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-100">Add New Partner</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {stats.vendors.length === 0 ? (
                                    <div className="col-span-full py-20 text-center text-slate-400 italic">No vendors registered yet.</div>
                                ) : (
                                    stats.vendors.map((vendor) => (
                                        <div key={vendor.id} className="bg-white p-6 rounded-[35px] shadow-sm border border-gray-100 group hover:shadow-xl transition-all">
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-14 h-14 bg-slate-100 rounded-[22px] flex items-center justify-center font-black text-slate-600 text-xl">
                                                    {vendor.business_name?.[0]}
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${vendor.is_active ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {vendor.is_active ? 'Active' : 'Offline'}
                                                </span>
                                            </div>
                                            <h4 className="text-xl font-black text-slate-900 mb-1">{vendor.business_name}</h4>
                                            <p className="text-sm text-slate-400 font-bold mb-4">{vendor.cuisine_type || 'General Cuisine'}</p>
                                            <div className="flex items-center gap-4 pt-4 border-t border-dashed border-gray-100">
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                                    <span className="text-sm font-black text-slate-900">{vendor.rating || '0.0'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Ranked #1</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'riders' && (
                        <div className="lg:col-span-3 animate-in fade-in duration-500">
                            <div className="flex justify-between items-center mb-8 px-2">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900">Delivery Fleet</h3>
                                    <p className="text-slate-400 text-sm font-bold">Monitor rider availability and performance</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 border-b">
                                        <tr>
                                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Rider</th>
                                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Earnings</th>
                                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {stats.riders.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">No riders in the fleet yet.</td>
                                            </tr>
                                        ) : (
                                            stats.riders.map((rider) => (
                                                <tr key={rider.id} className="hover:bg-gray-50/50 transition duration-150">
                                                    <td className="px-8 py-5 flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs">
                                                            {rider.vehicle_type === 'bike' ? '🚲' : '🛵'}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900">Rider #{rider.id.slice(0, 5)}</p>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{rider.vehicle_type}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${rider.is_available ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                                            {rider.is_available ? 'Available' : 'Offline'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-sm font-black text-blue-600">
                                                        {formatCurrency(0)}
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <button className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-400">
                                                            <MoreVertical className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'finances' && (
                        <div className="lg:col-span-3 animate-in fade-in duration-500">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black text-slate-900">Financial Performance</h3>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition">Export CSV</button>
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-200">Reconcile All</button>
                                </div>
                            </div>

                            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 border-b">
                                        <tr>
                                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Transaction ID</th>
                                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Volume (KSH)</th>
                                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Commission (10%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {stats.recentOrders.filter(o => o.status === 'delivered').length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">No completed transactions to display.</td>
                                            </tr>
                                        ) : (
                                            stats.recentOrders.filter(o => o.status === 'delivered').map((order) => (
                                                <tr key={order.id} className="hover:bg-blue-50/20 transition duration-150">
                                                    <td className="px-8 py-5 text-sm font-bold text-slate-400">
                                                        {formatDate(order.created_at)}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-sm font-black text-slate-900">#TRX-{order.order_number.split('-')[1]}</p>
                                                        <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">SETTLED</p>
                                                    </td>
                                                    <td className="px-8 py-5 text-sm font-black text-slate-900">
                                                        {formatCurrency(order.total)}
                                                    </td>
                                                    <td className="px-8 py-5 text-right font-black text-green-600">
                                                        + {formatCurrency(order.total * 0.1)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
