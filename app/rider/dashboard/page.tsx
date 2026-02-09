'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import BottomNav from '@/components/navigation/BottomNav'
import MetricCard from '@/components/ui/MetricCard'
import StatusBadge from '@/components/ui/StatusBadge'
import {
    Home, Package, User as UserIcon, Wallet, TrendingUp,
    Clock, MapPin, Phone, Loader2, Navigation
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function RiderDashboard() {
    const router = useRouter()
    const [rider, setRider] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        todayEarnings: 0,
        weekEarnings: 0,
        activeDeliveries: 0,
        completedToday: 0
    })
    const [activeOrder, setActiveOrder] = useState<any>(null)

    useEffect(() => {
        fetchDashboardData()

        const channel = supabase
            .channel('rider-dashboard')
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
            router.push('/auth/login?role=rider')
            return
        }

        const { data: riderData } = await supabase
            .from('riders')
            .select('*')
            .eq('id', user.id)
            .single()

        if (riderData) setRider(riderData)

        // Fetch active order
        const { data: activeOrders } = await supabase
            .from('orders')
            .select(`
                *,
                vendor:vendor_id (business_name, phone),
                customer:customer_id (phone)
            `)
            .eq('rider_id', user.id)
            .in('status', ['assigned_to_rider', 'picked_up', 'in_transit'])
            .order('created_at', { ascending: false })
            .limit(1)

        if (activeOrders && activeOrders.length > 0) {
            setActiveOrder(activeOrders[0])
        }

        // Calculate stats
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data: todayOrders } = await supabase
            .from('orders')
            .select('*')
            .eq('rider_id', user.id)
            .gte('created_at', today.toISOString())

        const todayCompleted = todayOrders?.filter(o => o.status === 'delivered') || []
        const todayEarnings = todayCompleted.reduce((sum, o) => sum + (o.delivery_fee || 0), 0)

        setStats({
            todayEarnings,
            weekEarnings: todayEarnings * 5, // Mock data
            activeDeliveries: activeOrders?.length || 0,
            completedToday: todayCompleted.length
        })

        setLoading(false)
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)]" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Rider Dashboard</h1>
                        <p className="text-sm text-gray-500">Welcome back, {rider?.full_name || 'Rider'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-600 hover:text-gray-900"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* Earnings Summary */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Earnings</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <MetricCard
                            icon={Wallet}
                            label="Today"
                            value={formatCurrency(stats.todayEarnings)}
                            iconColor="text-green-600"
                        />
                        <MetricCard
                            icon={TrendingUp}
                            label="This Week"
                            value={formatCurrency(stats.weekEarnings)}
                            iconColor="text-blue-600"
                        />
                        <MetricCard
                            icon={Package}
                            label="Active"
                            value={stats.activeDeliveries}
                            iconColor="text-orange-600"
                        />
                        <MetricCard
                            icon={Clock}
                            label="Completed Today"
                            value={stats.completedToday}
                            iconColor="text-purple-600"
                        />
                    </div>
                </div>

                {/* Active Delivery */}
                {activeOrder ? (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Active Delivery</h2>
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Order #{activeOrder.order_number}</p>
                                    <h3 className="text-xl font-bold text-gray-900">{activeOrder.vendor?.business_name}</h3>
                                </div>
                                <StatusBadge status={activeOrder.status} />
                            </div>

                            {/* Delivery Steps */}
                            <div className="space-y-4 mb-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">Pickup Location</p>
                                        <p className="text-sm text-gray-600">{activeOrder.vendor?.business_name}</p>
                                        <a href={`tel:${activeOrder.vendor?.phone}`} className="text-sm text-[var(--color-primary)] flex items-center gap-1 mt-1">
                                            <Phone className="w-4 h-4" />
                                            {activeOrder.vendor?.phone}
                                        </a>
                                    </div>
                                </div>

                                <div className="ml-5 border-l-2 border-gray-200 h-8"></div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">Delivery Address</p>
                                        <p className="text-sm text-gray-600">{activeOrder.delivery_address}</p>
                                        <a href={`tel:${activeOrder.customer?.phone}`} className="text-sm text-[var(--color-primary)] flex items-center gap-1 mt-1">
                                            <Phone className="w-4 h-4" />
                                            {activeOrder.customer?.phone}
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button className="btn btn-outline flex items-center justify-center gap-2">
                                    <Navigation className="w-5 h-5" />
                                    Navigate
                                </button>
                                <button className="btn btn-primary flex items-center justify-center gap-2">
                                    Update Status
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Active Delivery</h2>
                        <div className="card p-12 text-center">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Deliveries</h3>
                            <p className="text-gray-500 mb-4">Check available orders to start earning</p>
                            <button
                                onClick={() => router.push('/rider/dashboard/available')}
                                className="btn btn-primary"
                            >
                                View Available Orders
                            </button>
                        </div>
                    </div>
                )}

                {/* Performance Stats */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Performance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="card p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">On-Time Rate</span>
                                <span className="text-2xl font-bold text-green-600">98%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full" style={{ width: '98%' }}></div>
                            </div>
                        </div>
                        <div className="card p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Customer Rating</span>
                                <span className="text-2xl font-bold text-yellow-600">4.9</span>
                            </div>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="flex-1 bg-yellow-400 h-2 rounded"></div>
                                ))}
                            </div>
                        </div>
                        <div className="card p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Total Deliveries</span>
                                <span className="text-2xl font-bold text-blue-600">247</span>
                            </div>
                            <p className="text-xs text-gray-500">All time</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Navigation */}
            <BottomNav
                items={[
                    { href: '/rider/dashboard', icon: Home, label: 'Home' },
                    { href: '/rider/dashboard/available', icon: Package, label: 'Available' },
                    { href: '/rider/dashboard/active', icon: Navigation, label: 'Active' },
                    { href: '/rider/account', icon: UserIcon, label: 'Account' },
                ]}
            />
        </div>
    )
}
