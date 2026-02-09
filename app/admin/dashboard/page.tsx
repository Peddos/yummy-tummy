'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
    LayoutDashboard, Users, Store, Bike, TrendingUp,
    Shield, Bell, Search, Loader2, Package, Wallet, CheckCircle,
    AlertTriangle, ArrowUpRight, ArrowDownRight, MoreVertical, Star,
    LogOut, Settings, Filter, Download, List, ChevronRight, Trash2,
    Truck, Save, RefreshCw
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import NotificationBell from '@/components/ui/NotificationBell'

interface AdminStats {
    totalRevenue: number
    platformEarnings: number
    vendorEarnings: number
    riderEarnings: number
    vendorCount: number
    riderCount: number
    activeOrders: number
    recentOrders: any[]
    vendors: any[]
    riders: any[]
}

interface SystemSettings {
    delivery_fee: number
    vendor_commission_percentage: number
}

export default function AdminDashboard() {
    const router = useRouter()
    const [stats, setStats] = useState<AdminStats>({
        totalRevenue: 0,
        platformEarnings: 0,
        vendorEarnings: 0,
        riderEarnings: 0,
        vendorCount: 0,
        riderCount: 0,
        activeOrders: 0,
        recentOrders: [],
        vendors: [],
        riders: []
    })
    const [settings, setSettings] = useState<SystemSettings>({
        delivery_fee: 1,
        vendor_commission_percentage: 10
    })
    const [loading, setLoading] = useState(true)
    const [savingSettings, setSavingSettings] = useState(false)
    const [activeTab, setActiveTab] = useState('overview')
    const [sortBy, setSortBy] = useState<'date' | 'sales'>('date')

    useEffect(() => {
        fetchAdminData()
    }, [])

    const fetchAdminData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/auth/login?role=admin')
            return
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if ((profile as any)?.role !== 'admin') {
            router.push('/auth/login?role=admin')
            return
        }

        try {
            // Fetch Settings
            const { data: settingsData } = await supabase
                .from('system_settings')
                .select('*')

            const currentSettings = { ...settings }
                ; (settingsData as any[])?.forEach(s => {
                    if (s.key === 'delivery_fee') currentSettings.delivery_fee = Number(s.value)
                    if (s.key === 'vendor_commission_percentage') currentSettings.vendor_commission_percentage = Number(s.value)
                })
            setSettings(currentSettings)

            const { data: vendors } = await supabase.from('vendors').select('*')
            const { data: riders } = await supabase.from('riders').select('*')
            const { data: orders } = await supabase
                .from('orders')
                .select(`
                    *,
                    customer:customer_id (full_name),
                    vendor:vendor_id (business_name)
                `)
                .order('created_at', { ascending: false })

            const deliveredOrders = orders?.filter((o: any) => o.status === 'delivered') || []

            const totalRevenue = deliveredOrders.reduce((sum: number, o: any) => sum + Number(o.total), 0)
            const riderEarnings = deliveredOrders.reduce((sum: number, o: any) => sum + Number(o.delivery_fee), 0)
            const vendorSalesTotal = deliveredOrders.reduce((sum: number, o: any) => sum + Number(o.subtotal), 0)

            const commissionRate = currentSettings.vendor_commission_percentage / 100
            const platformEarnings = vendorSalesTotal * commissionRate
            const vendorEarnings = vendorSalesTotal - platformEarnings

            setStats({
                totalRevenue,
                platformEarnings,
                vendorEarnings,
                riderEarnings,
                vendorCount: vendors?.length || 0,
                riderCount: riders?.length || 0,
                activeOrders: orders?.filter((o: any) => !['delivered', 'cancelled', 'completed'].includes(o.status)).length || 0,
                recentOrders: orders?.slice(0, 10) || [],
                vendors: vendors || [],
                riders: riders || []
            })
        } catch (error) {
            console.error('Error fetching admin data:', error)
        } finally {
            setLoading(false)
        }
    }

    const saveSettings = async () => {
        setSavingSettings(true)
        try {
            await Promise.all([
                (supabase.from('system_settings') as any).upsert({ key: 'delivery_fee', value: settings.delivery_fee.toString() }),
                (supabase.from('system_settings') as any).upsert({ key: 'vendor_commission_percentage', value: settings.vendor_commission_percentage.toString() })
            ])
            alert('Settings updated successfully!')
            fetchAdminData()
        } catch (error) {
            console.error('Error saving settings:', error)
            alert('Failed to save settings')
        } finally {
            setSavingSettings(false)
        }
    }

    const deleteOrder = async (id: string) => {
        if (!confirm('System Directive: Are you authorized to permanently purge this transaction?')) return
        try {
            const { error } = await supabase.from('orders').delete().eq('id', id)
            if (!error) fetchAdminData()
            else alert('Access Terminated: Insufficient administrative privileges.')
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    const handleLogout = async () => {
        if (!confirm('Proceed with secure logout from Administrative Center?')) return
        await supabase.auth.signOut()
        router.push('/')
    }

    const sortedOrders = [...stats.recentOrders].sort((a, b) => {
        if (sortBy === 'sales') return b.total - a.total
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-12 h-12 animate-spin text-[var(--color-primary)]" />
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-200 h-screen sticky top-0 z-50">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-white">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Admin<span className="text-[var(--color-primary)]">Center</span></h1>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">V3.1 Delivery System</p>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {[
                        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
                        { id: 'vendors', label: 'Partner Stores', icon: Store },
                        { id: 'riders', label: 'Rider Fleet', icon: Bike },
                        { id: 'finances', label: 'Financials', icon: TrendingUp },
                        { id: 'settings', label: 'System Settings', icon: Settings },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl font-bold transition-all duration-200 ${activeTab === item.id
                                ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="px-4 pb-8 space-y-2">
                    <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 mb-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Platform Status</p>
                        <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-tight">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            System Online
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-4 rounded-2xl font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all group"
                    >
                        <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto">
                <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 h-20 sticky top-0 z-40 px-8 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 capitalize">{activeTab} Oversight</h2>
                        <p className="text-xs text-gray-500 font-medium tracking-wide">Aggregate metrics and system control</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <button onClick={() => fetchAdminData()} className="p-2 text-gray-400 hover:text-[var(--color-primary)] transition-colors">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <div className="hidden md:flex items-center gap-3">
                            <NotificationBell />
                            <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-white font-bold">
                                AD
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-7xl mx-auto">
                    {/* Top Metric Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {[
                            { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: 'Gross Profit', value: formatCurrency(stats.platformEarnings), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                            { label: 'Rider Payouts', value: formatCurrency(stats.riderEarnings), icon: Bike, color: 'text-purple-600', bg: 'bg-purple-50' },
                            { label: 'Active Orders', value: stats.activeOrders, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
                        ].map((metric, i) => (
                            <div key={i} className="card p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                                <div className={`absolute top-0 right-0 p-4 ${metric.bg} ${metric.color} rounded-bl-3xl opacity-80 group-hover:scale-110 transition-transform`}>
                                    <metric.icon className="w-5 h-5" />
                                </div>
                                <p className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{metric.label}</p>
                            </div>
                        ))}
                    </div>

                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Platform Activity */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" />
                                        Platform Activity
                                    </h3>
                                    <button onClick={() => setActiveTab('finances')} className="text-xs font-bold text-[var(--color-primary)] hover:underline uppercase tracking-widest">Full Record</button>
                                </div>

                                <div className="card overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-900" onClick={() => setSortBy('date')}>Order Ref {sortBy === 'date' && '↓'}</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Business</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right cursor-pointer hover:text-gray-900" onClick={() => setSortBy('sales')}>Value {sortBy === 'sales' && '↓'}</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Ops</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {sortedOrders.length === 0 ? (
                                                <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-medium italic">Searching platform records...</td></tr>
                                            ) : (
                                                sortedOrders.map((order) => (
                                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors group/row">
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm font-bold text-gray-900 mb-0.5">#{order.order_number}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold">{formatDate(order.created_at)}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm font-bold text-gray-600">{order.vendor?.business_name}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border
                                                                ${order.status === 'delivered' ? 'bg-green-50 text-green-600 border-green-200' :
                                                                    order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                                                                        'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]/10'}
                                                            `}>
                                                                {order.status.replace(/_/g, ' ')}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <p className="text-sm font-bold text-gray-900">{formatCurrency(order.total)}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => deleteOrder(order.id)}
                                                                className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover/row:opacity-100 transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Sidebar Ranking */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 px-2 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                    Top Performers
                                </h3>
                                <div className="space-y-4">
                                    {stats.vendors.slice(0, 5).map((v, i) => (
                                        <div key={v.id} className="card p-4 flex items-center justify-between group hover:border-[var(--color-primary)] transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-500 uppercase">
                                                        {v.business_name?.[0]}
                                                    </div>
                                                    <div className="absolute -top-1 -left-1 w-5 h-5 bg-white border border-gray-100 rounded-full flex items-center justify-center text-[8px] font-black text-[var(--color-primary)] shadow-sm">
                                                        #{i + 1}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">{v.business_name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                        <span className="text-[10px] font-black text-gray-400">{v.rating || '4.8'}</span>
                                                        <span className="text-[10px] text-gray-300">•</span>
                                                        <span className="text-[10px] font-black text-green-500">98% Success</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'vendors' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Partner Vendors</h3>
                                    <p className="text-sm text-gray-500 font-medium">Manage restaurant ecosystem and health status</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="btn btn-outline h-11 px-4 flex items-center gap-2">
                                        <Filter className="w-4 h-4" /> Filter
                                    </button>
                                    <button className="btn btn-primary h-11 px-6 flex items-center gap-2">
                                        <Download className="w-4 h-4" /> Reports
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {stats.vendors.map((vendor) => (
                                    <div key={vendor.id} className="card p-6 hover:shadow-2xl transition-all duration-300 relative group">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center font-black text-gray-400 text-2xl group-hover:bg-[var(--color-primary-light)] group-hover:text-[var(--color-primary)] transition-colors">
                                                {vendor.business_name?.[0]}
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${vendor.is_active ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
                                                    {vendor.is_active ? 'System Active' : 'System Offline'}
                                                </span>
                                            </div>
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900 mb-1">{vendor.business_name}</h4>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">{vendor.cuisine_type || 'General Food'}</p>

                                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Vibe Rating</p>
                                                <div className="flex items-center gap-1">
                                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                                    <span className="text-sm font-bold text-gray-900">{vendor.rating || '4.5'}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Earnings</p>
                                                <p className="text-sm font-bold text-gray-900">{formatCurrency(vendor.total_earnings || 0)}</p>
                                            </div>
                                        </div>

                                        <button className="absolute bottom-6 right-6 p-2 text-gray-300 hover:text-[var(--color-primary)] transition-colors">
                                            <Settings className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'riders' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Rider Fleet</h3>
                                    <p className="text-sm text-gray-500 font-medium">Monitoring active couriers and dispatch health</p>
                                </div>
                            </div>

                            <div className="card overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rider Delegate</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Earnings</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {stats.riders.map((rider) => (
                                            <tr key={rider.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center font-bold text-xs">
                                                            {rider.id.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">#{rider.id.slice(0, 8)}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{rider.vehicle_type}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                                                        ${rider.is_available ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}
                                                    `}>
                                                        {rider.is_available ? 'Accepting Jobs' : 'Offline'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-bold text-gray-900">{formatCurrency(rider.total_earnings || 0)}</p>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-gray-900 hover:bg-white rounded-xl transition-all">
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'finances' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center px-2">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">Revenue Records</h3>
                                    <p className="text-sm text-gray-500 font-medium">Full ledger of platform transactions and commission splits</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="card p-6 bg-blue-50 border-blue-100">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Sales (GMV)</p>
                                    <p className="text-3xl font-black text-blue-900">{formatCurrency(stats.totalRevenue)}</p>
                                </div>
                                <div className="card p-6 bg-green-50 border-green-100">
                                    <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Platform Earnings ({settings.vendor_commission_percentage}%)</p>
                                    <p className="text-3xl font-black text-green-900">{formatCurrency(stats.platformEarnings)}</p>
                                </div>
                                <div className="card p-6 bg-purple-50 border-purple-100">
                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Rider Revenue</p>
                                    <p className="text-3xl font-black text-purple-900">{formatCurrency(stats.riderEarnings)}</p>
                                </div>
                            </div>

                            <div className="card overflow-hidden">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">TXN Date</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference ID</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total (KSH)</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Plat. Comm ({settings.vendor_commission_percentage}%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {stats.recentOrders.filter(o => o.status === 'delivered').length === 0 ? (
                                            <tr><td colSpan={4} className="p-20 text-center text-gray-400 font-medium italic">No settled transactions found...</td></tr>
                                        ) : (
                                            stats.recentOrders.filter(o => o.status === 'delivered').map((order) => (
                                                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-8 py-6 text-sm font-bold text-gray-500 italic">
                                                        {formatDate(order.created_at)}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <p className="text-sm font-black text-gray-900 mb-0.5 uppercase tracking-tighter">TRX-{order.order_number.slice(-8)}</p>
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                                            <span className="text-[9px] text-green-600 font-black uppercase tracking-widest">Settled</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-sm font-bold text-gray-900">
                                                        {formatCurrency(order.total)}
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-black text-[var(--color-primary)]">
                                                        + {formatCurrency(order.subtotal * (settings.vendor_commission_percentage / 100))}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">System Configuration</h3>
                                <p className="text-sm text-gray-500 font-medium">Global parameters for logistics and commissions</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="card p-8 space-y-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                                            <Truck className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">Logistics Settings</h4>
                                            <p className="text-xs text-gray-500">Delivery fee parameters</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Standard Delivery Fee (KSH)</label>
                                            <input
                                                type="number"
                                                value={settings.delivery_fee}
                                                onChange={(e) => setSettings({ ...settings, delivery_fee: Number(e.target.value) })}
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="card p-8 space-y-6">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">Revenue Model</h4>
                                            <p className="text-xs text-gray-500">Platform commission settings</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="group">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Vendor Commission (%)</label>
                                            <input
                                                type="number"
                                                value={settings.vendor_commission_percentage}
                                                onChange={(e) => setSettings({ ...settings, vendor_commission_percentage: Number(e.target.value) })}
                                                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-[var(--color-primary)] transition-all"
                                            />
                                            <p className="text-[10px] text-gray-400 font-medium mt-2">Percentage deducted from each vendor's subtotal.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={saveSettings}
                                    disabled={savingSettings}
                                    className="btn btn-primary h-14 px-10 flex items-center gap-3 shadow-xl shadow-[var(--color-primary)]/20"
                                >
                                    {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    Save System Configuration
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
