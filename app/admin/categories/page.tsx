'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Plus, Trash2, Edit2, Check, X, Loader2, Save } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

interface Category {
    id: string
    name: string
    slug: string
    icon_name: string
    is_active: boolean
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [newCategory, setNewCategory] = useState({ name: '', slug: '', icon_name: 'Circle' })

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('business_categories')
            .select('*')
            .order('name', { ascending: true })

        if (!error && data) setCategories(data)
        setLoading(false)
    }

    const handleCreate = async () => {
        if (!newCategory.name || !newCategory.slug) return

        const { data, error } = await supabase
            .from('business_categories')
            .insert([newCategory])
            .select()

        if (!error && data) {
            setCategories([...categories, data[0]])
            setIsCreating(false)
            setNewCategory({ name: '', slug: '', icon_name: 'Circle' })
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This might affect vendors using this category.')) return

        const { error } = await supabase
            .from('business_categories')
            .delete()
            .eq('id', id)

        if (!error) {
            setCategories(categories.filter(c => c.id !== id))
        }
    }

    const IconComponent = ({ name, className }: { name: string, className?: string }) => {
        const Icon = (LucideIcons as any)[name] || LucideIcons.Circle
        return <Icon className={className} />
    }

    if (loading) return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Business Categories</h1>
                    <p className="text-gray-500 text-sm">Manage the types of businesses on the platform.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-black transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Category
                </button>
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 mb-8 animate-in slide-in-from-top-4">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">New Category</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Name</label>
                            <input
                                type="text"
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                className="w-full p-2 bg-gray-50 rounded-lg text-sm font-medium border-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                placeholder="e.g. Healthy Herbs"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Slug (URL)</label>
                            <input
                                type="text"
                                value={newCategory.slug}
                                onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                                className="w-full p-2 bg-gray-50 rounded-lg text-sm font-medium border-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                placeholder="e.g. healthy-herbs"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Icon (Lucide Name)</label>
                            <input
                                type="text"
                                value={newCategory.icon_name}
                                onChange={(e) => setNewCategory({ ...newCategory, icon_name: e.target.value })}
                                className="w-full p-2 bg-gray-50 rounded-lg text-sm font-medium border-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                placeholder="e.g. Leaf"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            className="px-4 py-2 text-sm font-bold bg-[var(--color-primary)] text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Save Category
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Icon</th>
                            <th className="text-left py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Name</th>
                            <th className="text-left py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Slug</th>
                            <th className="text-right py-4 px-6 text-xs font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {categories.map((category) => (
                            <tr key={category.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="py-4 px-6 text-gray-400">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                                        <IconComponent name={category.icon_name} className="w-5 h-5 text-gray-600" />
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <span className="font-bold text-gray-900">{category.name}</span>
                                </td>
                                <td className="py-4 px-6">
                                    <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-500 font-mono">{category.slug}</code>
                                </td>
                                <td className="py-4 px-6 text-right">
                                    <button
                                        onClick={() => handleDelete(category.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
