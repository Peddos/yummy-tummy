'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import {
    MapPin,
    Plus,
    Trash2,
    Check,
    ChevronLeft,
    Loader2,
    Navigation,
    Home,
    Briefcase,
    Building
} from 'lucide-react'

export default function AddressesPage() {
    const router = useRouter()
    const [addresses, setAddresses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAddresses()
    }, [])

    const fetchAddresses = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false })

        setAddresses(data || [])
        setLoading(false)
    }

    const handleDelete = async (id: string) => {
        await supabase.from('addresses').delete().eq('id', id)
        fetchAddresses()
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)] opacity-50" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest">Saved Locations</h1>
                    <div className="w-10" /> {/* Spacer */}
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 py-8">
                <div className="space-y-4">
                    {addresses.length === 0 ? (
                        <div className="card p-12 text-center border-none shadow-sm">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <MapPin className="w-8 h-8 text-gray-200" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">No Locations Set</h3>
                            <p className="text-gray-400 text-sm font-medium mb-8">Add your delivery points for a faster checkout experience.</p>
                        </div>
                    ) : (
                        addresses.map((addr) => (
                            <div key={addr.id} className="card p-5 border-none shadow-sm bg-white group hover:shadow-xl transition-all">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[var(--color-primary-light)] group-hover:text-[var(--color-primary)] transition-colors">
                                            {addr.label?.toLowerCase() === 'home' ? <Home className="w-6 h-6" /> :
                                                addr.label?.toLowerCase() === 'work' ? <Briefcase className="w-6 h-6" /> :
                                                    <Building className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">{addr.label}</h3>
                                                {addr.is_default && (
                                                    <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-md text-[8px] font-black uppercase tracking-widest border border-green-100">
                                                        Primary
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[200px]">
                                                {addr.address}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleDelete(addr.id)}
                                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    <button className="w-full card p-5 border-dashed border-2 border-gray-200 bg-transparent flex items-center justify-center gap-3 text-gray-400 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-all group">
                        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Map New Location</span>
                    </button>
                </div>

                <div className="mt-12 p-6 bg-blue-50 rounded-3xl border border-blue-100">
                    <div className="flex gap-4">
                        <Navigation className="w-6 h-6 text-blue-500 shrink-0" />
                        <div>
                            <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">Precision Logistics</h4>
                            <p className="text-[10px] text-blue-600 font-bold leading-relaxed">
                                Our couriers use high-precision telemetry. Pinning your exact foyer or entrance reduces delivery latency by up to 15%.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
