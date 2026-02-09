'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Power, PowerOff, Loader2, Image as ImageIcon, Search, Filter, Layers, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function MenuManagementPage() {
    const router = useRouter()
    const [id, setVendorId] = useState<string | null>(null)
    const [menuItems, setMenuItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showModal, setShowModal] = useState(false)
    const [editingItem, setEditingItem] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState('')

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

        const { data: items, error: iError } = await supabase
            .from('menu_items')
            .select('*')
            .eq('vendor_id', vendor.id)
            .order('name', { ascending: true })

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
        if (!confirm('Delete this item from your menu?')) return

        const { error } = await supabase
            .from('menu_items')
            .delete()
            .eq('id', itemId)

        if (!error) fetchVendorAndMenu()
    }

    const filteredItems = menuItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)]" />
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Menu Management</h1>
                        <p className="text-xs text-gray-500 font-medium">Design and update your restaurant's digital menu</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingItem(null)
                            setFormData({ name: '', description: '', price: '', category: '', image_url: '', is_available: true })
                            setShowModal(true)
                        }}
                        className="btn btn-primary px-6 h-11 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Item</span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card p-6 flex items-center gap-6">
                        <div className="w-14 h-14 bg-[var(--color-primary-light)] text-[var(--color-primary)] rounded-2xl flex items-center justify-center">
                            <Layers className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Products</p>
                            <p className="text-2xl font-bold text-gray-900">{menuItems.length}</p>
                        </div>
                    </div>
                    <div className="card p-6 flex items-center gap-6">
                        <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                            <CheckCircle2 className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Live</p>
                            <p className="text-2xl font-bold text-gray-900">{menuItems.filter(i => i.is_available).length}</p>
                        </div>
                    </div>
                    <div className="card p-6 flex items-center gap-6">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                            <AlertCircle className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hidden Items</p>
                            <p className="text-2xl font-bold text-gray-900">{menuItems.filter(i => !i.is_available).length}</p>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Find an item by name or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-10 h-11 text-sm shadow-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 px-2 italic">{filteredItems.length} items showing</span>
                    </div>
                </div>

                {/* Grid View (Better for Food Apps) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="card hover:border-[var(--color-primary)] transition-all group overflow-hidden">
                            <div className="flex gap-4 p-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative group">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <ImageIcon className="w-8 h-8" />
                                        </div>
                                    )}
                                    <button
                                        onClick={() => toggleAvailability(item)}
                                        className={`absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]`}
                                    >
                                        {item.is_available ? <Power className="w-6 h-6 text-green-400" /> : <PowerOff className="w-6 h-6 text-red-400" />}
                                    </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-gray-900 truncate group-hover:text-[var(--color-primary)] transition-colors">{item.name}</h3>
                                        <span className={`w-2 h-2 rounded-full ${item.is_available ? 'bg-green-500' : 'bg-red-500'}`} />
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">{item.category || 'Standard'}</p>
                                    <p className="text-lg font-bold text-[var(--color-primary)]">{formatCurrency(item.price)}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50/50 px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-400 italic">Added {new Date(item.created_at).toLocaleDateString()}</span>
                                <div className="flex items-center gap-2">
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
                                        className="p-1.5 text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
                    <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                        <div className="p-8 border-b border-gray-100">
                            <h2 className="text-2xl font-bold text-gray-900">{editingItem ? 'Update Item' : 'Create New Item'}</h2>
                            <p className="text-sm text-gray-500 mt-1">Fill in the details for your menu selection</p>
                        </div>

                        <form onSubmit={handleSaveItem} className="p-8 space-y-5">
                            <div className="space-y-4">
                                <div>
                                    <label className="label">Item Name</label>
                                    <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input h-12" placeholder="Supreme Cheeseburger" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Price (KSH)</label>
                                        <input required type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="input h-12" placeholder="850" />
                                    </div>
                                    <div>
                                        <label className="label">Category</label>
                                        <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input h-12" placeholder="Burgers" />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Image URL (Optional)</label>
                                    <input type="text" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="input h-12" placeholder="https://images.unsplash.com/..." />
                                </div>
                                <div>
                                    <label className="label">Description</label>
                                    <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input min-h-[100px] py-3" placeholder="Describe the flavors..." />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline flex-1 h-12">Cancel</button>
                                <button type="submit" disabled={saving} className="btn btn-primary flex-[2] h-12">
                                    {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : editingItem ? 'Update Product' : 'Save Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
