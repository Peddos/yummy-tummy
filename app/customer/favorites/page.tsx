'use client'

import { useRouter } from 'next/navigation'
import {
    ChevronLeft,
    Heart,
    ShoppingBag,
    Search,
    Star,
    Clock,
    TrendingUp
} from 'lucide-react'

export default function FavoritesPage() {
    const router = useRouter()

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest">Saved Catalog</h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="max-w-xl mx-auto px-4 py-12 text-center">
                <div className="w-24 h-24 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <Heart className="w-12 h-12 fill-red-500/10" />
                </div>

                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-4">No Cravings Saved Yet?</h2>
                <p className="text-gray-400 text-sm font-medium mb-12 max-w-xs mx-auto">
                    Start exploring our global kitchen and save your favorite restaurants for instant access.
                </p>

                <button
                    onClick={() => router.push('/customer')}
                    className="btn btn-primary px-10 py-4 flex items-center justify-center gap-3 mx-auto"
                >
                    <Search className="w-4 h-4" />
                    Discover Kitchens
                </button>

                {/* Suggestions Grid */}
                <div className="mt-20 grid grid-cols-1 gap-6 text-left">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Curated For You</h3>
                    <div className="card p-5 border-none shadow-sm bg-white">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                                <TrendingUp className="w-8 h-8 text-gray-200" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Rising Stars</h4>
                                <p className="text-[10px] text-gray-400 font-bold mb-2">MOST SAVED IN YOUR AREA</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-[10px] font-black text-yellow-600">
                                        <Star className="w-3 h-3 fill-yellow-600" />
                                        4.9
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-black text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        20 MIN
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
