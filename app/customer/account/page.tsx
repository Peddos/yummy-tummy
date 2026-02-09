'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'
import BottomNav from '@/components/navigation/BottomNav'
import {
    User as UserIcon,
    Mail,
    MapPin,
    Phone,
    ChevronRight,
    LogOut,
    ShoppingBag,
    Shield,
    CreditCard,
    Bell,
    Settings,
    Home,
    Package,
    Loader2,
    Heart,
    Headset
} from 'lucide-react'

export default function CustomerAccountPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login?role=customer')
                return
            }
            setUser(user)

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            setProfile(profileData)
            setLoading(false)
        }

        fetchUserData()
    }, [router])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)] opacity-50" />
            </div>
        )
    }

    const menuItems = [
        { label: 'Order History', icon: Package, href: '/customer/orders', color: 'text-blue-500', bg: 'bg-blue-50' },
        { label: 'Delivery Addresses', icon: MapPin, href: '/customer/account/addresses', color: 'text-green-500', bg: 'bg-green-50' },
        { label: 'Saved Restaurants', icon: Heart, href: '/customer/favorites', color: 'text-red-500', bg: 'bg-red-50' },
        { label: 'Payment Methods', icon: CreditCard, href: '/customer/account/payments', color: 'text-purple-500', bg: 'bg-purple-50' },
    ]

    const settingsItems = [
        { label: 'Notifications', icon: Bell, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'Security', icon: Shield, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { label: 'Help & Support', icon: Headset, color: 'text-teal-500', bg: 'bg-teal-50' },
        { label: 'Theme Settings', icon: Settings, color: 'text-gray-500', bg: 'bg-gray-50' },
    ]

    return (
        <div className="min-h-screen bg-gray-50 pb-28">
            {/* Premium Header/Cover */}
            <div className="h-48 bg-[var(--color-primary)] relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="grid grid-cols-6 gap-4">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <ShoppingBag key={i} className="w-12 h-12 rotate-12" />
                        ))}
                    </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/20" />
            </div>

            {/* Profile Content */}
            <div className="max-w-xl mx-auto px-4 -mt-20 relative z-10">
                {/* Profile Card */}
                <div className="card p-8 border-none shadow-2xl bg-white mb-6">
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-3xl bg-gray-100 flex items-center justify-center mb-4 border-4 border-white shadow-xl relative overflow-hidden">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <UserIcon className="w-10 h-10 text-gray-300" />
                            )}
                            <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-2 border-white rounded-full" />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
                            {profile?.full_name || 'Premium User'}
                        </h1>
                        <p className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-[0.2em] mb-4">
                            Series V3 Elite Member
                        </p>

                        <div className="flex gap-2 w-full mt-4">
                            <div className="flex-1 p-3 bg-gray-50 rounded-2xl text-center border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Balance</p>
                                <p className="text-sm font-black text-gray-900">KES 0.00</p>
                            </div>
                            <div className="flex-1 p-3 bg-gray-50 rounded-2xl text-center border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Rewards</p>
                                <p className="text-sm font-black text-gray-900">120 pts</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Actions */}
                <div className="space-y-6">
                    <div>
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-1">My Repository</h2>
                        <div className="card p-2 border-none shadow-sm space-y-1">
                            {menuItems.map((item, i) => {
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={i}
                                        href={item.href}
                                        className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">{item.label}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-1">Global Settings</h2>
                        <div className="card p-2 border-none shadow-sm space-y-1">
                            {settingsItems.map((item, i) => {
                                const Icon = item.icon
                                return (
                                    <button
                                        key={i}
                                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 ${item.bg} ${item.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">{item.label}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Meta Data */}
                    <div className="card p-6 border-none shadow-sm space-y-4">
                        <div className="flex items-center gap-3 text-gray-500">
                            <Mail className="w-4 h-4" />
                            <span className="text-xs font-bold">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-500">
                            <Phone className="w-4 h-4" />
                            <span className="text-xs font-bold">{profile?.phone || 'No phone added'}</span>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-600 rounded-3xl font-black text-xs uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all active:scale-[0.98]"
                    >
                        <LogOut className="w-5 h-5" />
                        Terminate Session
                    </button>

                    <p className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest py-4">
                        Series Environment v3.4.2-stable
                    </p>
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav
                items={[
                    { href: '/customer', icon: Home, label: 'Explore' },
                    { href: '/customer/orders', icon: Package, label: 'Sessions' },
                    { href: '/customer/account', icon: UserIcon, label: 'Profile' },
                ]}
            />
        </div>
    )
}
