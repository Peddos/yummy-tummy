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

            await supabase.from('notifications').update({ is_read: true }).eq('id', id)
        } else {
            // Mark all as read
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Optimistic
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)

            await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
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
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Alerts</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAsRead()}
                                    className="text-[10px] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
                                >
                                    <Check className="w-3 h-3" /> Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                                    <p className="text-xs text-gray-400 font-medium">No alerts at the moment</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`p-4 hover:bg-gray-50 transition-colors relative cursor-pointer ${!n.is_read ? 'bg-orange-50/30' : ''}`}
                                            onClick={() => {
                                                if (!n.is_read) markAsRead(n.id)
                                                // Optional: Navigate to order if order_id exists
                                                setIsOpen(false)
                                            }}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${!n.is_read ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                                                    {getIcon(n.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-bold text-gray-900 mb-0.5 ${!n.is_read ? 'pr-2' : ''}`}>
                                                        {n.title}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 leading-relaxed mb-2 line-clamp-2">
                                                        {n.message}
                                                    </p>
                                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-tighter">
                                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                    </p>
                                                </div>
                                                {!n.is_read && (
                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1 flex-shrink-0" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-gray-50 bg-gray-50/30">
                            <span className="block text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                Real-time Updates Active
                            </span>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
