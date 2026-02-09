'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import type { UserRole } from '@/types/database'
import {
    User, Mail, Lock, Phone, MapPin, Utensils,
    Bike, Landmark, ArrowRight, Loader2, CheckCircle2,
    ShieldCheck, ChevronLeft
} from 'lucide-react'

function SignupContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const roleParam = (searchParams.get('role') || 'customer') as UserRole

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        role: roleParam,
        // Vendor specific
        businessName: '',
        address: '',
        cuisineType: '',
        // Rider specific
        vehicleType: '',
        vehicleNumber: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            // Create auth user with metadata
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        phone: formData.phone,
                        role: formData.role,
                    }
                }
            })

            if (signUpError) throw signUpError
            if (!authData.user) throw new Error('Failed to create user')

            // Wait a moment for the trigger to create the profile
            await new Promise(resolve => setTimeout(resolve, 500))

            // Update profile with complete information
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    role: formData.role,
                    full_name: formData.fullName,
                    phone: formData.phone,
                })
                .eq('id', authData.user.id)

            if (profileError) {
                console.error('Profile update error:', profileError)
            }

            // Create role-specific record
            if (formData.role === 'vendor') {
                const { error: vendorError } = await supabase.from('vendors').insert({
                    id: authData.user.id,
                    business_name: formData.businessName,
                    address: formData.address,
                    cuisine_type: formData.cuisineType,
                })
                if (vendorError) throw vendorError
            } else if (formData.role === 'rider') {
                const { error: riderError } = await supabase.from('riders').insert({
                    id: authData.user.id,
                    vehicle_type: formData.vehicleType,
                    vehicle_number: formData.vehicleNumber,
                })
                if (riderError) throw riderError
            }

            // Redirect based on role
            const redirectMap: Record<string, string> = {
                customer: '/customer',
                vendor: '/vendor/dashboard',
                rider: '/rider/dashboard',
                admin: '/admin/dashboard',
            }

            router.push(redirectMap[formData.role] || '/customer')
        } catch (err: any) {
            setError(err.message || 'Failed to sign up')
        } finally {
            setLoading(false)
        }
    }

    const roleInfo = {
        customer: { title: 'Join as Customer', subtitle: 'Order from the best local restaurants', icon: User, color: 'text-blue-500' },
        vendor: { title: 'Register Business', subtitle: 'Grow your restaurant revenue today', icon: Utensils, color: 'text-orange-500' },
        rider: { title: 'Become a Rider', subtitle: 'Earn on your own schedule', icon: Bike, color: 'text-green-500' },
        admin: { title: 'System Access', subtitle: 'Internal platform administration', icon: ShieldCheck, color: 'text-red-500' },
    }[roleParam] || { title: 'Create Account', subtitle: 'Join our delivery network', icon: User, color: 'text-[var(--color-primary)]' }

    const Icon = roleInfo.icon

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
            <div className="w-full max-w-xl">
                {/* Branding & Back */}
                <div className="flex items-center justify-between mb-8 px-2">
                    <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-bold text-sm">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Home
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-white">
                            <Landmark className="w-5 h-5" />
                        </div>
                        <span className="font-black text-gray-900 uppercase tracking-tighter">Series V3</span>
                    </div>
                </div>

                <div className="card p-0 overflow-hidden border-none shadow-2xl">
                    {/* Header */}
                    <div className="bg-white p-8 pb-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center ${roleInfo.color}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 leading-none mb-1">{roleInfo.title}</h1>
                                <p className="text-gray-400 text-sm font-medium">{roleInfo.subtitle}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 pt-4 bg-white">
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <CheckCircle2 className="w-5 h-5 opacity-50" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSignup} className="space-y-6">
                            {/* Personal Info Section */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Personal Details</p>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all"
                                            placeholder="Full Name"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all"
                                            placeholder="Phone Number"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Account Section */}
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Security Access</p>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all"
                                            placeholder="Email Address"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            minLength={6}
                                            className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all"
                                            placeholder="Password"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Role Specific Section */}
                            {(formData.role === 'vendor' || formData.role === 'rider') && (
                                <div className="space-y-4 pt-4 border-t border-gray-50">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                                        {formData.role === 'vendor' ? 'Business Profile' : 'Fleet Information'}
                                    </p>

                                    {formData.role === 'vendor' && (
                                        <>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div className="relative group">
                                                    <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                                                    <input
                                                        type="text"
                                                        value={formData.businessName}
                                                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                                        required
                                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all"
                                                        placeholder="Business Name"
                                                    />
                                                </div>
                                                <div className="relative group">
                                                    <Utensils className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                                                    <input
                                                        type="text"
                                                        value={formData.cuisineType}
                                                        onChange={(e) => setFormData({ ...formData, cuisineType: e.target.value })}
                                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all"
                                                        placeholder="Cuisine (e.g. Italian)"
                                                    />
                                                </div>
                                            </div>
                                            <div className="relative group">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                                                <input
                                                    type="text"
                                                    value={formData.address}
                                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    required
                                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all"
                                                    placeholder="Business Address"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {formData.role === 'rider' && (
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="relative group">
                                                <Bike className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                                                <select
                                                    value={formData.vehicleType}
                                                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                                    required
                                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:bg-white focus:border-[var(--color-primary)] outline-none appearance-none transition-all"
                                                >
                                                    <option value="">Vehicle Type</option>
                                                    <option value="motorcycle">Motorcycle</option>
                                                    <option value="bicycle">Bicycle</option>
                                                    <option value="car">Car</option>
                                                </select>
                                            </div>
                                            <div className="relative group">
                                                <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
                                                <input
                                                    type="text"
                                                    value={formData.vehicleNumber}
                                                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                                                    required
                                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all"
                                                    placeholder="Plate Number"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn btn-primary py-5 text-lg flex items-center justify-center gap-3 shadow-xl shadow-[var(--color-primary)]/20 active:scale-95 transition-all"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span>Allocating Resources...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Create Account</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-8 border-t border-gray-50 text-center">
                            <p className="text-gray-400 font-medium">
                                Already have an account?{' '}
                                <Link
                                    href={`/auth/login?role=${roleParam}`}
                                    className="text-[var(--color-primary)] hover:underline font-black"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <p className="mt-8 text-center text-xs text-gray-400 font-medium">
                    By joining, you agree to Series V3 Platform Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    )
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-12 h-12 animate-spin text-[var(--color-primary)]" />
            </div>
        }>
            <SignupContent />
        </Suspense>
    )
}
