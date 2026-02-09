'use client'

import { useRouter } from 'next/navigation'
import {
    ChevronLeft,
    CreditCard,
    Plus,
    ShieldCheck,
    Smartphone,
    Lock,
    Landmark
} from 'lucide-react'

export default function PaymentsPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest">Settlemet Methods</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 py-8">
                {/* Active Method */}
                <div className="mb-8">
                    <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 mb-4">Primary Gateway</h2>
                    <div className="card p-6 border-none shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Smartphone className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                    <Smartphone className="w-6 h-6" />
                                </div>
                                <ShieldCheck className="w-6 h-6 text-white/50" />
                            </div>
                            <h3 className="text-xl font-black tracking-tighter mb-1 uppercase">M-Pesa Express</h3>
                            <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Connected via Safaricom</p>
                        </div>
                    </div>
                </div>

                {/* Other Options */}
                <div className="space-y-4">
                    <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Alternative Channels</h2>

                    <button className="w-full card p-5 border-none shadow-sm bg-white flex items-center justify-between group grayscale hover:grayscale-0 transition-all opacity-50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Debit/Credit Card</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Coming Soon</p>
                            </div>
                        </div>
                        <Lock className="w-4 h-4 text-gray-300" />
                    </button>

                    <button className="w-full card p-5 border-none shadow-sm bg-white flex items-center justify-between group grayscale hover:grayscale-0 transition-all opacity-50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center">
                                <Landmark className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Bank Transfer</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Corporate only</p>
                            </div>
                        </div>
                        <Lock className="w-4 h-4 text-gray-300" />
                    </button>

                    <button className="w-full card p-5 border-dashed border-2 border-gray-200 bg-transparent flex items-center justify-center gap-3 text-gray-400 hover:border-green-500 hover:text-green-500 transition-all group">
                        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Authorize New Channel</span>
                    </button>
                </div>

                <div className="mt-12 p-8 bg-gray-900 rounded-[2.5rem] text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h4 className="text-sm font-black uppercase tracking-widest mb-2">Vault Security</h4>
                        <p className="text-xs text-gray-400 leading-relaxed font-medium">
                            Series V3 utilizes end-to-end encryption for all fiscal transactions. Your payment tokens are never stored on our application servers.
                        </p>
                    </div>
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-[var(--color-primary)] rounded-full blur-3xl opacity-20" />
                </div>
            </main>
        </div>
    )
}
