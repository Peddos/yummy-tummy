'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/store/cart'
import { formatCurrency, validatePhoneNumber } from '@/lib/utils'
import {
    ArrowLeft, MapPin, Phone, CreditCard, ChevronRight,
    Loader2, AlertCircle, CheckCircle2, Package, NotepadText,
    ShieldCheck, Info, Wallet
} from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function CheckoutPage() {
    const router = useRouter()
    const { items, vendorId, getTotal, clearCart } = useCart()

    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1) // 1: Checkout, 2: Success
    const [formData, setFormData] = useState({
        address: '',
        notes: '',
        phone: ''
    })
    const [error, setError] = useState<string | null>(null)
    const [orderId, setOrderId] = useState<string | null>(null)
    const [isSimulated, setIsSimulated] = useState(false)

    const subtotal = getTotal()
    const deliveryFee = parseFloat(process.env.NEXT_PUBLIC_DELIVERY_FEE || '1')
    const total = subtotal + deliveryFee

    useEffect(() => {
        if (items.length === 0 && step !== 2) {
            router.push('/customer')
        }
        checkUserMeta()
    }, [items.length])

    const checkUserMeta = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.user_metadata?.phone) {
            setFormData(prev => ({ ...prev, phone: user.user_metadata.phone }))
        }
    }

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!formData.address) {
            setError('Please enter a delivery address')
            return
        }

        if (!validatePhoneNumber(formData.phone)) {
            setError('Please enter a valid Kenyan phone number (e.g., 07XXXXXXXX)')
            return
        }

        setLoading(true)

        try {
            const orderResponse = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vendorId,
                    items,
                    subtotal,
                    deliveryFee,
                    total,
                    deliveryAddress: formData.address,
                    deliveryNotes: formData.notes
                })
            })

            const orderData = await orderResponse.json()
            if (!orderResponse.ok) throw new Error(orderData.error || 'Failed to create order')

            setOrderId(orderData.id)

            const mpesaResponse = await fetch('/api/checkout/stk-push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: total,
                    phone: formData.phone,
                    orderId: orderData.id
                })
            })

            const mpesaData = await mpesaResponse.json()
            if (!mpesaResponse.ok) {
                await fetch(`/api/orders/${orderData.id}`, { method: 'DELETE' }).catch(() => { })
                throw new Error(mpesaData.error || 'M-Pesa payment failed to initiate. Please try again.')
            }

            if (mpesaData.ResponseDescription?.includes('Simulated')) {
                setIsSimulated(true)
            }

            setStep(2)
            clearCart()

        } catch (err: any) {
            setError(err.message)
            setOrderId(null)
        } finally {
            setLoading(false)
        }
    }

    if (step === 2) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full animate-in zoom-in-95 duration-500">
                    <div className="card p-10 text-center shadow-2xl border-none">
                        <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <CheckCircle2 className="w-14 h-14" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Order Secured!</h2>

                        <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                            {isSimulated ? (
                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        <Info className="w-3.5 h-3.5" />
                                        Sandbox Verification
                                    </div>
                                    <p className="text-gray-500 text-sm font-medium">
                                        Payment auto-confirmed for testing. Your delicious meal is being prepared!
                                    </p>
                                </div>
                            ) : (
                                <p className="text-gray-600 text-sm font-medium leading-relaxed">
                                    Final step: Check your phone for the M-Pesa STK prompt to authorize <span className="font-black text-gray-900 underline decoration-[var(--color-primary)] decoration-2">{formatCurrency(total)}</span>.
                                </p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <Link href="/customer/orders" className="btn btn-primary w-full py-4 text-lg shadow-xl shadow-[var(--color-primary)]/20 active:scale-95 transition-all">
                                Track My Order
                            </Link>
                            <Link href="/customer" className="btn btn-outline w-full py-4 text-gray-500 font-bold active:scale-95 transition-all border-gray-200">
                                Back to Discovery
                            </Link>
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
                            <ShieldCheck className="w-4 h-4" />
                            <span className="text-[10px] uppercase font-black tracking-widest">Encrypted Checkout</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col items-center">
                        <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest">Secure Checkout</h1>
                        <p className="text-[10px] font-bold text-gray-400">{items.length} Items • Finalize Order</p>
                    </div>
                    <div className="w-10" />
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Delivery & Payment Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Address */}
                        <div className="card p-8 border-none shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-none mb-1">Delivery Destination</h2>
                                    <p className="text-gray-400 text-xs font-medium">Where should we drop off your order?</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Street Address / Apartment</label>
                                    <input
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="e.g., Central Park Towers, Apt 4B"
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all"
                                    />
                                </div>
                                <div className="group">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Delivery Instructions (Optional)</label>
                                    <div className="relative">
                                        <NotepadText className="absolute left-4 top-4 w-5 h-5 text-gray-300 group-focus-within:text-[var(--color-primary)] transition-colors" />
                                        <textarea
                                            rows={2}
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Gate code, allergies, or specific drop-off spots..."
                                            className="w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all min-h-[100px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment */}
                        <div className="card p-8 border-none shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
                                    <Wallet className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 leading-none mb-1">M-Pesa Express</h2>
                                    <p className="text-gray-400 text-xs font-medium">Direct and secure mobile payment</p>
                                </div>
                            </div>

                            <div className="bg-green-50/50 border border-green-100 rounded-2xl p-5 flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm p-2">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" alt="M-Pesa" className="w-full" />
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900">Mobile Money</p>
                                        <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Active • Instant Push</p>
                                    </div>
                                </div>
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirmation Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[var(--color-primary)] transition-colors" />
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="07XXXXXXXX"
                                        className="w-full pl-11 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:bg-white focus:border-[var(--color-primary)] outline-none transition-all"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium mt-3 flex items-center gap-1.5 ml-1">
                                    <Info className="w-3 h-3" />
                                    We'll trigger a secure STK push to this number.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="card p-0 border-none shadow-xl sticky top-24 overflow-hidden">
                            <div className="p-8">
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-50 pb-4">Invoice Summary</h3>

                                <div className="space-y-5 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center text-[10px] font-black text-[var(--color-primary)] border border-gray-100">
                                                        {item.quantity}
                                                    </span>
                                                    <p className="font-bold text-gray-800 text-sm leading-tight">
                                                        {item.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-gray-900 font-black text-sm whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3 pt-6 border-t border-gray-50">
                                    <div className="flex justify-between text-xs font-bold text-gray-400">
                                        <span>SUBTOTAL</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-gray-400">
                                        <span>LOGISTICS FEE</span>
                                        <span>{formatCurrency(deliveryFee)}</span>
                                    </div>
                                    <div className="flex justify-between items-end pt-4">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Payable</p>
                                            <p className="text-3xl font-black text-gray-900 tracking-tighter leading-none">
                                                {formatCurrency(total)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="mt-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-[10px] font-black uppercase tracking-wider flex gap-3 items-center animate-in shake-in-1">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 opacity-50" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={loading || items.length === 0}
                                    className="w-full btn btn-primary py-5 mt-8 text-lg font-black flex items-center justify-center gap-3 shadow-xl shadow-[var(--color-primary)]/30 active:scale-95 transition-all"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Pay {formatCurrency(total)}</span>
                                            <ChevronRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="bg-gray-50 p-4 flex items-center justify-center gap-2 border-t border-gray-100">
                                <ShieldCheck className="w-4 h-4 text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Secure Checkout Service</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
