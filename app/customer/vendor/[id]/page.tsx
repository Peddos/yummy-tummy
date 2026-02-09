'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useCart } from '@/lib/store/cart'
import { formatCurrency } from '@/lib/utils'
import ShoppingCart from '@/components/cart/ShoppingCart'
import {
    ArrowLeft, Star, Clock, ShoppingBag, Plus,
    Search, Loader2, Info, ChevronRight, Filter,
    UtensilsCrossed, Zap
} from 'lucide-react'
import Link from 'next/link'

export default function VendorDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { addItem } = useCart()

    const [vendor, setVendor] = useState<any>(null)
    const [menuItems, setMenuItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [addingItem, setAddingItem] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (id) {
            fetchVendorData()
        }
    }, [id])

    const fetchVendorData = async () => {
        try {
            // Fetch vendor info
            const { data: vendorData, error: vendorError } = await supabase
                .from('vendors')
                .select('*')
                .eq('id', id)
                .single()

            if (vendorError) throw vendorError
            setVendor(vendorData)

            // Fetch menu items
            const { data: itemsData, error: itemsError } = await supabase
                .from('menu_items')
                .select('*')
                .eq('vendor_id', id)
                .eq('is_available', true)
                .order('name')

            if (itemsError) throw itemsError
            setMenuItems(itemsData || [])

        } catch (error) {
            console.error('Error fetching vendor data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddToCart = (item: any) => {
        setAddingItem(item.id)
        addItem({
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            vendorId: vendor.id,
            vendorName: vendor.business_name
        })

        // Brief feedback animation
        setTimeout(() => setAddingItem(null), 500)
    }

    const filteredItems = menuItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)] opacity-50" />
            </div>
        )
    }

    if (!vendor) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Info className="w-10 h-10 text-gray-300" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Vendor Unavailable</h1>
                <p className="text-gray-500 mb-8">This restaurant is not currently accepting orders on Series V3.</p>
                <Link href="/customer" className="btn btn-primary px-8">Explored Other Options</Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
            {/* Header / Cover */}
            <div className="relative h-64 md:h-80 w-full bg-gray-200">
                {vendor.image_url ? (
                    <img
                        src={vendor.image_url}
                        alt={vendor.business_name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <UtensilsCrossed className="w-20 h-20 text-gray-300" />
                    </div>
                )}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent" />

                <div className="absolute top-6 left-6">
                    <button
                        onClick={() => router.back()}
                        className="p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl text-gray-900 hover:bg-white transition-all active:scale-95"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Vendor Info Card */}
            <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-10">
                <div className="card p-8 border-none shadow-2xl bg-white">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                                    Open Now
                                </span>
                                <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-100">
                                    {vendor.cuisine_type || 'Gourmet'}
                                </span>
                            </div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-4">
                                {vendor.business_name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-gray-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    </div>
                                    <div>
                                        <span className="text-gray-900 block leading-tight">{vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}</span>
                                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-black">{vendor.total_reviews}+ reviews</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <span className="text-gray-900 block leading-tight">25-35 min</span>
                                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-black">Est. Delivery</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-gray-900 block leading-tight">Flash Prep</span>
                                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-black">Service Type</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search menu catalog..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-400 focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Items */}
            <main className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Categories Sidebar */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                        <div className="sticky top-24">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Menu Categories</h3>
                            <div className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
                                <button className="whitespace-nowrap flex items-center justify-between px-5 py-3.5 bg-[var(--color-primary)] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[var(--color-primary)]/20 transition-all active:scale-95">
                                    Full Catalog
                                    <ChevronRight className="w-4 h-4 hidden lg:block" />
                                </button>
                                <button className="whitespace-nowrap flex items-center justify-between px-5 py-3.5 bg-white text-gray-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100">
                                    Most Popular
                                </button>
                                <button className="whitespace-nowrap flex items-center justify-between px-5 py-3.5 bg-white text-gray-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100">
                                    Main Courses
                                </button>
                                <button className="whitespace-nowrap flex items-center justify-between px-5 py-3.5 bg-white text-gray-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100">
                                    Sides & Drinks
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items Grid */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Available Selection</h2>
                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <Filter className="w-3.5 h-3.5" />
                                {filteredItems.length} Products
                            </div>
                        </div>

                        {filteredItems.length === 0 ? (
                            <div className="card p-20 text-center border-none shadow-sm">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ShoppingBag className="w-8 h-8 text-gray-200" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">No Matches</h3>
                                <p className="text-gray-400 text-sm font-medium">Try refining your search criteria.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredItems.map((item) => (
                                    <div key={item.id} className="card group p-5 flex gap-5 border-none shadow-sm hover:shadow-xl transition-all duration-300 active:scale-[0.98]">
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h4 className="font-black text-gray-900 text-lg mb-1 group-hover:text-[var(--color-primary)] transition-colors">{item.name}</h4>
                                                <p className="text-xs font-medium text-gray-400 line-clamp-2 leading-relaxed mb-4">
                                                    {item.description || 'Crafted with premium ingredients and authentic techniques.'}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="font-black text-xl text-gray-900 tracking-tighter">
                                                    {formatCurrency(item.price)}
                                                </span>
                                                <button
                                                    onClick={() => handleAddToCart(item)}
                                                    className={`
                                                        px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center gap-2
                                                        ${addingItem === item.id
                                                            ? 'bg-green-500 scale-105 text-white'
                                                            : 'bg-gray-900 text-white hover:bg-[var(--color-primary)] shadow-lg shadow-gray-200'}
                                                    `}
                                                >
                                                    {addingItem === item.id ? (
                                                        <>Added</>
                                                    ) : (
                                                        <>
                                                            <Plus className="w-3.5 h-3.5" />
                                                            Add to Cart
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        {item.image_url && (
                                            <div className="w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <ShoppingCart />
        </div>
    )
}
