'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useCart } from '@/lib/store/cart'
import { formatCurrency } from '@/lib/utils'
import ShoppingCart from '@/components/cart/ShoppingCart'
import { ArrowLeft, Star, Clock, ShoppingBag, Plus } from 'lucide-react'
import Link from 'next/link'

export default function VendorDetailPage() {
    const { id } = useParams()
    const router = useRouter()
    const { addItem } = useCart()

    const [vendor, setVendor] = useState<any>(null)
    const [menuItems, setMenuItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [addingItem, setAddingItem] = useState<string | null>(null)

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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!vendor) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Vendor not found</h1>
                <Link href="/customer" className="text-blue-600 hover:underline">Return to browse</Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Vendor Cover & Info */}
            <div className="relative h-64 md:h-80 w-full bg-gradient-to-r from-blue-600 to-purple-600">
                {vendor.image_url && (
                    <img
                        src={vendor.image_url}
                        alt={vendor.business_name}
                        className="w-full h-full object-cover opacity-60"
                    />
                )}
                <div className="absolute inset-0 bg-black/30" />

                <div className="absolute top-6 left-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>

                <div className="absolute bottom-8 left-6 right-6">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-lg">
                            {vendor.business_name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-white">
                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold">{vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}</span>
                                {vendor.total_reviews > 0 && <span className="opacity-80">({vendor.total_reviews})</span>}
                            </div>
                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                                <Clock className="w-4 h-4" />
                                <span>15-30 min</span>
                            </div>
                            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                                <ShoppingBag className="w-4 h-4" />
                                <span>{vendor.cuisine_type || 'General'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Sections */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                    {/* Categories / Side Nav (Potential feature) */}
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="sticky top-8 space-y-2">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 px-3">Menu Categories</h3>
                            <button className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold">
                                All Items
                            </button>
                            {/* We could dynamically list categories here */}
                        </div>
                    </div>

                    {/* Menu Items Grid */}
                    <div className="lg:col-span-3">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 px-2">Menu Items</h2>

                        {menuItems.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                                <div className="text-5xl mb-4">🍽️</div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Menu is empty</h3>
                                <p className="text-gray-500">This vendor hasn't added any items to their menu yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {menuItems.map((item) => (
                                    <div key={item.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow p-5 border border-gray-100 flex gap-4">
                                        <div className="flex-1 flex flex-col">
                                            <h4 className="text-lg font-bold text-gray-900">{item.name}</h4>
                                            <p className="text-sm text-gray-500 mt-1 flex-1 line-clamp-2">
                                                {item.description}
                                            </p>
                                            <div className="mt-4 flex items-center justify-between">
                                                <span className="text-lg font-black text-blue-600">
                                                    {formatCurrency(item.price)}
                                                </span>
                                                <button
                                                    onClick={() => handleAddToCart(item)}
                                                    className={`
                                                        p-2 rounded-full transition-all duration-300
                                                        ${addingItem === item.id
                                                            ? 'bg-green-500 scale-110'
                                                            : 'bg-blue-600 hover:bg-blue-700 hover:rotate-90'} 
                                                        text-white shadow-lg
                                                    `}
                                                >
                                                    <Plus className="w-6 h-6" />
                                                </button>
                                            </div>
                                        </div>
                                        {item.image_url && (
                                            <div className="w-24 h-24 rounded-xl overflow-hidden shadow-inner flex-shrink-0">
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
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
