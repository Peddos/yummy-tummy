'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Power, PowerOff, Loader2, Image as ImageIcon, Search, Filter } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function MenuManagementPage() {
    const router = useRouter()
    const [id, setVendorId] = useState<string | null>(null)
    const [menuItems, setMenuItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        image_url: '',
        is_available: true
    })

    useEffect(() => {
        fetchVendorAndMenu()
    }, [])

    const fetchVendorAndMenu = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/auth/login?role=vendor')
            return
        }

        // Get vendor record for this user
        const { data: vendor, error: vError } = await supabase
            .from('vendors')
            .select('id')
            .eq('id', user.id)
            .single()

        if (vError) {
            console.error('Error fetching vendor:', vError)
            return
        }

        setVendorId(vendor.id)

        // Fetch menu items
        const { data: items, error: iError } = await supabase
            .from('menu_items')
            .select('*')
            .eq('vendor_id', vendor.id)
            .order('created_at', { ascending: false })

        if (iError) console.error('Error fetching items:', iError)
        else setMenuItems(items || [])

        setLoading(false)
    }

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const itemData = {
                ...formData,
                price: parseFloat(formData.price),
                vendor_id: id
            }

            if (editingItem) {
                const { error } = await supabase
                    .from('menu_items')
                    .update(itemData)
                    .eq('id', editingItem.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('menu_items')
                    .insert(itemData)
                if (error) throw error
            }

            setShowModal(false)
            setEditingItem(null)
            setFormData({ name: '', description: '', price: '', category: '', image_url: '', is_available: true })
            fetchVendorAndMenu()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setSaving(false)
        }
    }

    const toggleAvailability = async (item: any) => {
        const { error } = await supabase
            .from('menu_items')
            .update({ is_available: !item.is_available })
            .eq('id', item.id)

        if (!error) fetchVendorAndMenu()
    }

    const deleteItem = async (itemId: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return

        const { error } = await supabase
            .from('menu_items')
            .delete()
            .eq('id', itemId)

        if (!error) fetchVendorAndMenu()
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b px-4 py-6 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Menu Management</h1>
                        <p className="text-sm text-gray-500 font-medium">Add and manage your restaurant items</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingItem(null)
                            setFormData({ name: '', description: '', price: '', category: '', image_url: '', is_available: true })
                            setShowModal(true)
                        }}
                        className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add New Item</span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-10">
                {/* Stats / Toolbar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-lg">
                        <p className="text-blue-100 font-bold uppercase tracking-widest text-xs">Total Items</p>
                        <p className="text-4xl font-black mt-2">{menuItems.length}</p>
                    </div>
                    <div className="bg-green-600 rounded-3xl p-6 text-white shadow-lg">
                        <p className="text-green-100 font-bold uppercase tracking-widest text-xs">Active Items</p>
                        <p className="text-4xl font-black mt-2">{menuItems.filter(i => i.is_available).length}</p>
                    </div>
                    <div className="bg-white border text-gray-900 rounded-3xl p-6 shadow-sm">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Categories</p>
                        <p className="text-4xl font-black mt-2">
                            {new Set(menuItems.map(i => i.category).filter(Boolean)).size || 0}
                        </p>
                    </div>
                </div>

                {/* Menu Table/Grid */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Item Detail</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Price</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {menuItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                            <ImageIcon className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{item.name}</p>
                                                    <p className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">{item.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold uppercase">
                                                {item.category || 'Standard'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-black text-gray-900">
                                            {formatCurrency(item.price)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleAvailability(item)}
                                                className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full transition ${item.is_available
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    }`}
                                            >
                                                {item.is_available ? <><Power className="w-3 h-3" /> Active</> : <><PowerOff className="w-3 h-3" /> Hidden</>}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingItem(item)
                                                        setFormData({
                                                            name: item.name,
                                                            description: item.description || '',
                                                            price: item.price.toString(),
                                                            category: item.category || '',
                                                            image_url: item.image_url || '',
                                                            is_available: item.is_available
                                                        })
                                                        setShowModal(true)
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => deleteItem(item.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
                            <h2 className="text-2xl font-black">{editingItem ? 'Edit Menu Item' : 'New Menu Item'}</h2>
                            <p className="text-blue-100 text-sm">Tell your customers what's cooking!</p>
                        </div>

                        <form onSubmit={handleSaveItem} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Item Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition"
                                        placeholder="e.g., Supreme Burger"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Price (KSH)</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition"
                                        placeholder="500"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition"
                                        placeholder="e.g., Burgers"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-5 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition resize-none"
                                        placeholder="Add mouth-watering details..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-[2] px-6 py-4 bg-blue-600 text-white rounded-2xl font-black hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                                >
                                    {saving && <Loader2 className="w-5 h-5 animate-spin" />}
                                    {saving ? 'Saving...' : 'Save Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
