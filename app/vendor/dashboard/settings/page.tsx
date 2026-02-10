'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2, Save, Store, MapPin, Phone, Info } from 'lucide-react'

export default function VendorSettings() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [categories, setCategories] = useState<any[]>([])
    const [formData, setFormData] = useState({
        business_name: '',
        phone_number: '',
        address: '',
        business_category_id: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/auth/login?role=vendor')
            return
        }

        // Fetch vendor profile
        const { data: vendor, error } = await supabase
            .from('vendors')
            .select('*')
            .eq('id', user.id)
            .single()

        if (error) {
            console.error('Error fetching vendor:', error)
            return
        }

        const v = vendor as any

        // Fetch categories
        const { data: cats } = await supabase
            .from('business_categories')
            .select('*')
            .order('name')

        setCategories(cats || [])
        setFormData({
            business_name: v.business_name || '',
            phone_number: v.phone_number || '',
            address: v.address || '',
            business_category_id: v.business_category_id || ''
        })
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const { data: { user } } = await supabase.auth.getUser()

        try {
            const { error } = await (supabase
                .from('vendors') as any)
                .update({
                    business_name: formData.business_name,
                    phone_number: formData.phone_number,
                    address: formData.address,
                    business_category_id: formData.business_category_id || null
                })
                .eq('id', user?.id)

            if (error) throw error
            alert('Settings updated successfully!')
        } catch (error) {
            console.error('Error updating profile:', error)
            alert('Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)]" />
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto p-6 lg:p-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
                <p className="text-gray-500 mt-1">Manage your business profile and preferences</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="card p-8 space-y-6">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Store className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
                            <p className="text-sm text-gray-500">Your store's public profile</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Business Name</label>
                            <input
                                type="text"
                                required
                                value={formData.business_name}
                                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all"
                                placeholder="E.g. Tasty Bites"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Business Category</label>
                            <div className="relative">
                                <select
                                    value={formData.business_category_id}
                                    onChange={(e) => setFormData({ ...formData, business_category_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Select a category...</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <Info className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium">Determines where your store appears in the customer app.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Phone Number</label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    className="w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all"
                                    placeholder="+254 7..."
                                />
                                <Phone className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Address / Location</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all"
                                    placeholder="Building, Street, Area"
                                />
                                <MapPin className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn btn-primary h-12 px-8 flex items-center gap-2 shadow-lg shadow-[var(--color-primary)]/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    )
}
