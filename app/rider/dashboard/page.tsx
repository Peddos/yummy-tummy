'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
    Navigation, Package, Wallet, Star, LayoutDashboard,
    LogOut, ClipboardList, TrendingUp, ChevronRight, Bell,
    Truck, CircleDot, Loader2, CheckCircle
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Order {
    id: string;
    status: string;
    rider_id: string;
}

interface Rider {
    id: string;
    vehicle_type: string;
    is_available: boolean;
    rating: number;
}

export default function RiderDashboard() {
    const router = useRouter()
    const [rider, setRider] = useState<Rider | null>(null)
    const [stats, setStats] = useState({
        earnings: 0,
        deliveries: 0,
        rating: 4.8,
        activeOrders: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchRiderData()
    }, [])

    const fetchRiderData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/auth/login?role=rider')
            return
        }

        // 1. Get rider info
        const { data: riderData, error: rError } = (await supabase
            .from('riders')
            .select('*')
            .eq('id', user.id)
            .single()) as { data: any, error: any }

        if (rError || !riderData) {
            console.error('Rider error:', rError)
            setLoading(false)
            return
        }
        setRider(riderData)

        // 2. Get stats
        const { data: orders } = await supabase
            .from('orders')
            .select('*')
            .eq('rider_id', user.id)

        const riderOrders = (orders || []) as Order[]
        const completed = riderOrders.filter(o => o.status === 'delivered' || o.status === 'completed')
        const active = riderOrders.filter(o => ['assigned_to_rider', 'picked_up', 'in_transit'].includes(o.status))

        setStats({
            earnings: completed.length * 150, // Flat fee simulation
            deliveries: completed.length,
            rating: riderData?.rating || 4.9,
            activeOrders: active.length
        })

        setLoading(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col w-72 bg-white border-r h-screen sticky top-0">
                <div className="p-8 border-b">
                    <h1 className="text-2xl font-black bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                        M-Rider
                    </h1>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Delivery Ops</p>
                </div>

                <nav className="flex-1 p-6 space-y-1">
                    <Link href="/rider/dashboard" className="flex items-center gap-3 px-4 py-3 bg-orange-50 text-orange-600 rounded-2xl font-black transition">
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                    </Link>
                    <Link href="/rider/dashboard/available" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-2xl font-bold transition">
                        <Package className="w-5 h-5" /> Find Jobs
                    </Link>
                    <Link href="/rider/dashboard/active" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-2xl font-bold transition">
                        <Navigation className="w-5 h-5" /> Active Trip
                    </Link>
                    <div className="pt-6 mt-6 border-t px-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Account</p>
                        <button onClick={handleLogout} className="flex items-center gap-3 w-full text-left py-2 text-gray-400 hover:text-red-500 font-bold transition">
                            <LogOut className="w-5 h-5" /> Sign Out
                        </button>
                    </div>
                </nav>

                <div className="p-6 border-t">
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl">
                        <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-black">
                            {rider?.id?.[0]?.toUpperCase() || 'R'}
                        </div>
                        <div className="truncate">
                            <p className="text-sm font-black text-gray-900 truncate">{rider?.vehicle_type || 'Rider'}</p>
                            <span className="text-[10px] font-black uppercase text-green-500">ID Verified</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-h-screen">
                <header className="bg-white px-8 py-6 border-b flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`px-4 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${rider?.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            <CircleDot className={`w-3 h-3 ${rider?.is_available ? 'animate-pulse' : ''}`} />
                            {rider?.is_available ? 'Accepting Orders' : 'Offline'}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </div>
                    </div>
                </header>

                <div className="p-10 max-w-6xl">
                    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 className="text-4xl font-black text-gray-900 mb-2">Ride on!</h2>
                            <p className="text-gray-500 font-medium">You have {stats.activeOrders} active deliveries right now</p>
                        </div>
                        <Link
                            href="/rider/dashboard/available"
                            className="bg-orange-600 text-white px-8 py-4 rounded-3xl font-black flex items-center gap-3 hover:bg-orange-700 transition shadow-xl shadow-orange-100"
                        >
                            <Truck className="w-6 h-6" /> Find New Jobs
                        </Link>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-6">
                                <Wallet className="w-6 h-6" />
                            </div>
                            <p className="text-4xl font-black text-gray-900 mb-1">{formatCurrency(stats.earnings)}</p>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Today's Earnings</p>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                <Package className="w-6 h-6" />
                            </div>
                            <p className="text-4xl font-black text-gray-900 mb-1">{stats.deliveries}</p>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Jobs Done</p>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                            <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center mb-6">
                                <Star className="w-6 h-6" />
                            </div>
                            <p className="text-4xl font-black text-gray-900 mb-1">{stats.rating}</p>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Rider Score</p>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
                            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <p className="text-4xl font-black text-gray-900 mb-1">98%</p>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Acceptance Rate</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Order Management Card */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[50px] p-10 text-white relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-3xl font-black mb-4">Start your engine</h3>
                                <p className="text-slate-400 mb-8 max-w-xs">New orders are waiting for pickup. Head to the feed to claim yours.</p>
                                <Link
                                    href="/rider/dashboard/available"
                                    className="inline-flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-3xl font-black hover:scale-105 transition active:scale-95"
                                >
                                    Open Feed <ChevronRight className="w-5 h-5" />
                                </Link>
                            </div>
                            <Navigation className="absolute bottom-[-20px] right-[-20px] w-64 h-64 text-white/5 rotate-12 group-hover:rotate-0 transition duration-1000" />
                        </div>

                        {/* Recent Activity Mini-Feed */}
                        <div className="bg-white rounded-[50px] p-10 shadow-sm border border-gray-100">
                            <h3 className="text-xl font-black text-gray-900 mb-8">Recent Trips</h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between pb-6 border-b border-dashed">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-green-600">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Order delivered</p>
                                            <p className="text-xs text-gray-400">24 mins ago</p>
                                        </div>
                                    </div>
                                    <p className="font-black text-gray-900">+{formatCurrency(150)}</p>
                                </div>
                                <div className="flex items-center justify-center py-10">
                                    <p className="text-sm text-gray-400 italic">No more recent activity</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
