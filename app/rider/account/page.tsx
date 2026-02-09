'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import BottomNav from '@/components/navigation/BottomNav'
import MetricCard from '@/components/ui/MetricCard'
import {
    User, Home, Package, Navigation, Wallet,
    Settings, LogOut, ChevronRight, Truck, Phone,
    Calendar, TrendingUp, Clock
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function RiderAccountPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)
    const [earnings, setEarnings] = useState<any>({
        today: 0,
        week: 0,
        month: 0,
        total: 0,
        history: [] // { date: string, amount: number, count: number }
    })
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState({
        full_name: '',
        vehicle_type: '',
        vehicle_number: ''
    })

    useEffect(() => {
        fetchAccountData()
    }, [])

    const fetchAccountData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/auth/login?role=rider')
            return
        }

        // Fetch Profile & Rider Details
        const { data: profileData } = await supabase
            .from('profiles')
            .select(`
                *,
                rider:riders(*)
            `)
            .eq('id', user.id)
            .single()

        if (profileData) {
            setProfile(profileData)
            setEditForm({
                full_name: profileData.full_name || '',
                vehicle_type: profileData.rider?.vehicle_type || 'Motorcycle',
                vehicle_number: profileData.rider?.vehicle_number || ''
            })
        }

        // Fetch Earnings Data (Source of Truth: Delivered Orders)
        const { data: orders } = await supabase
            .from('orders')
            .select('delivery_fee, created_at, status')
            .eq('rider_id', user.id)
            .eq('status', 'delivered')
            .order('created_at', { ascending: false })

        if (orders) {
            calculateEarnings(orders)
        }

        setLoading(false)
    }

    const calculateEarnings = (orders: any[]) => {
        const now = new Date()
        const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString()

        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)

        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)

        let todaySum = 0
        let weekSum = 0
        let monthSum = 0
        let totalSum = 0

        // Group by Date for History
        const historyMap = new Map<string, { amount: number, count: number }>()

        orders.forEach(order => {
            const amount = Number(order.delivery_fee) || 0
            const date = new Date(order.created_at)
            const dateKey = date.toLocaleDateString('en-KE', {
                year: 'numeric', month: 'short', day: 'numeric'
            })

            totalSum += amount

            if (order.created_at >= startOfDay) todaySum += amount
            if (date >= weekAgo) weekSum += amount
            if (date >= monthAgo) monthSum += amount

            // History Accumulation
            const current = historyMap.get(dateKey) || { amount: 0, count: 0 }
            historyMap.set(dateKey, {
                amount: current.amount + amount,
                count: current.count + 1
            })
        })

        // Convert Map to Array
        const history = Array.from(historyMap.entries()).map(([date, data]) => ({
            date,
            amount: data.amount,
            count: data.count
        }))

        setEarnings({
            today: todaySum,
            week: weekSum,
            month: monthSum,
            total: totalSum,
            history
        })
    }

    const handleUpdateProfile = async () => {
        if (!profile) return

        // Update Profile Name
        await supabase
            .from('profiles')
            .update({ full_name: editForm.full_name })
            .eq('id', profile.id)

        // Update Rider Details
        await supabase
            .from('riders')
            .update({
                vehicle_type: editForm.vehicle_type,
                vehicle_number: editForm.vehicle_number
            })
            .eq('id', profile.id)

        setIsEditing(false)
        fetchAccountData()
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-[var(--color-primary)] text-white pt-12 pb-24 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-32 blur-3xl"></div>

                <div className="relative z-10 flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold">My Account</h1>
                    <button onClick={handleLogout} className="p-2 bg-white/20 rounded-xl hover:bg-white/30 backdrop-blur-sm transition-all">
                        <LogOut className="w-5 h-5 text-white" />
                    </button>
                </div>

                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-20 h-20 bg-white p-1 rounded-full shadow-xl">
                        <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-gray-400" />
                            )}
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{profile?.full_name}</h2>
                        <div className="flex items-center gap-2 mt-1 opacity-90 text-sm">
                            <span className="bg-white/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                {profile?.rider?.vehicle_type}
                            </span>
                            <span className="bg-white/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {profile?.phone}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <main className="px-5 -mt-16 relative z-20 space-y-6">
                {/* Earnings Card */}
                <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-green-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Today's Earnings</h3>
                    </div>
                    <p className="text-4xl font-black text-gray-900 mb-6 flex items-baseline gap-1">
                        {formatCurrency(earnings.today)}
                        <span className="text-sm font-bold text-gray-400">/ 24h</span>
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">This Week</p>
                            <p className="text-lg font-bold text-gray-900">{formatCurrency(earnings.week)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase mb-1">All Time</p>
                            <p className="text-lg font-bold text-[var(--color-primary)]">{formatCurrency(earnings.total)}</p>
                        </div>
                    </div>
                </div>

                {/* Profile Settings */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-gray-400" />
                            Profile Details
                        </h3>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="text-sm font-bold text-[var(--color-primary)] hover:underline"
                        >
                            {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                    </div>

                    {isEditing ? (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                                <input
                                    type="text"
                                    value={editForm.full_name}
                                    onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                                    className="w-full mt-1 p-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-[var(--color-primary)] font-semibold"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Vehicle Type</label>
                                    <select
                                        value={editForm.vehicle_type}
                                        onChange={e => setEditForm({ ...editForm, vehicle_type: e.target.value })}
                                        className="w-full mt-1 p-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-[var(--color-primary)] font-semibold"
                                    >
                                        <option value="Motorcycle">Motorcycle</option>
                                        <option value="Bicycle">Bicycle</option>
                                        <option value="Car">Car</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Plate Number</label>
                                    <input
                                        type="text"
                                        value={editForm.vehicle_number}
                                        onChange={e => setEditForm({ ...editForm, vehicle_number: e.target.value })}
                                        placeholder="KAA 123A"
                                        className="w-full mt-1 p-3 bg-gray-50 rounded-xl border-0 focus:ring-2 focus:ring-[var(--color-primary)] font-semibold"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleUpdateProfile}
                                className="w-full btn btn-primary py-3 rounded-xl shadow-lg shadow-orange-500/20"
                            >
                                Save Changes
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase">Full Name</p>
                                        <p className="font-bold text-gray-900">{profile?.full_name}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-400">
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase">Vehicle</p>
                                        <p className="font-bold text-gray-900">{profile?.rider?.vehicle_type} <span className="text-gray-400 text-xs">({profile?.rider?.vehicle_number || 'No Plate'})</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Earnings History */}
                <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                        Earnings History
                    </h3>

                    <div className="space-y-4">
                        {earnings.history.length > 0 ? (
                            earnings.history.map((day: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{day.date}</p>
                                            <p className="text-xs text-gray-500">{day.count} Deliveries</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-gray-900">{formatCurrency(day.amount)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400">
                                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No earnings history yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <BottomNav
                items={[
                    { href: '/rider/dashboard', icon: Home, label: 'Home' },
                    { href: '/rider/dashboard/available', icon: Package, label: 'Available' },
                    { href: '/rider/dashboard/active', icon: Navigation, label: 'Active' },
                    { href: '/rider/account', icon: User, label: 'Account' },
                ]}
            />
        </div>
    )
}
