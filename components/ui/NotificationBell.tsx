'use client'

import { useEffect, useState, useRef } from 'react'
import { Bell, Check, Package, Info, AlertTriangle, CheckCircle, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Notification {
    id: string
    title: string
    message: string
    type: 'order_update' | 'new_job' | 'payment_success' | 'payment_failed' | 'system_alert'
    is_read: boolean
    order_id?: string
    created_at: string
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        // Initialize audio
        audioRef.current = new Audio('/sounds/notification.mp3') // Fallback or use a base64 generic sound if file missing

        fetchNotifications()

        // Get current user for subscription filtering
        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Subscribe to real-time notifications for THIS user only
            const channel = supabase
                .channel(`user-notifications-${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                }, (payload) => {
                    const newNotif = payload.new as Notification

                    // Optimistic update
                    setNotifications(prev => [newNotif, ...prev])
                    setUnreadCount(prev => prev + 1)

                    // Play sound
                    playNotificationSound()
                })
                .subscribe()

            return () => { supabase.removeChannel(channel) }
        }

        const cleanup = setupSubscription()
        return () => {
            cleanup.then(unsub => unsub && unsub())
        }
    }, [])

    const playNotificationSound = () => {
        try {
            // Simple beep using Web Audio API if file fails, or just use this inline
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()

            osc.connect(gain)
            gain.connect(ctx.destination)

            osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
            osc.type = 'sine'

            gain.gain.setValueAtTime(0.1, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5)

            osc.start()
            osc.stop(ctx.currentTime + 0.5)
        } catch (e) {
            console.error('Audio play failed', e)
        }
    }

    const fetchNotifications = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (!error && data) {
            setNotifications(data)
            setUnreadCount(data.filter(n => !n.is_read).length)
        }
    }

    const markAsRead = async (id?: string) => {
        if (id) {
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))

            await supabase.from('notifications').update({ is_read: true } as any).eq('id', id)
        } else {
            // Mark all as read
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Optimistic
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)

            await supabase.from('notifications').update({ is_read: true } as any).eq('user_id', user.id).eq('is_read', false)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'new_job': return <Zap className="w-4 h-4 text-orange-500" />
            case 'order_update': return <Package className="w-4 h-4 text-blue-500" />
            case 'payment_success': return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'payment_failed': return <AlertTriangle className="w-4 h-4 text-red-500" />
            default: return <Info className="w-4 h-4 text-gray-400" />
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 bg-gray-50 rounded-xl text-gray-500 hover:text-[var(--color-primary)] hover:bg-gray-100 transition-all border border-gray-100"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 -mr-16 md:mr-0 mt-4 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 ring-1 ring-gray-900/5">
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-white/50 backdrop-blur-xl">
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                                <Bell className="w-3 h-3 text-[var(--color-primary)]" />
                                Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAsRead()}
                                    className="text-[10px] font-bold text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 flex items-center gap-1 bg-[var(--color-primary)]/10 px-2 py-1 rounded-lg transition-colors"
                                >
                                    <Check className="w-3 h-3" /> Mark read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bell className="w-8 h-8 text-gray-200" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-900 mb-1">All caught up!</p>
                                    <p className="text-xs text-gray-400 font-medium">No new alerts to show</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`p-4 hover:bg-gray-50 transition-all relative cursor-pointer group ${!n.is_read ? 'bg-[var(--color-primary)]/5' : ''}`}
                                            onClick={() => {
                                                if (!n.is_read) markAsRead(n.id)
                                                setIsOpen(false)
                                            }}
                                        >
                                            <div className="flex gap-4">
                                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${!n.is_read ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:shadow-sm'}`}>
                                                    {getIcon(n.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <p className={`text-xs font-bold text-gray-900 ${!n.is_read ? '' : 'text-gray-600'}`}>
                                                            {n.title}
                                                        </p>
                                                        <span className="text-[9px] font-bold text-gray-300 whitespace-nowrap ml-2">
                                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                                                        {n.message}
                                                    </p>
                                                </div>
                                                {!n.is_read && (
                                                    <div className="self-center">
                                                        <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full ring-4 ring-[var(--color-primary)]/20" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-gray-50 bg-gray-50/50 backdrop-blur-sm text-center">
                            <Link href="/customer/notifications" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-[var(--color-primary)] transition-colors">
                                View All History
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
