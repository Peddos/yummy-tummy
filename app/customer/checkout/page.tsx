'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/store/cart'
import { formatCurrency, validatePhoneNumber } from '@/lib/utils'
import { ArrowLeft, MapPin, Phone, CreditCard, ChevronRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function CheckoutPage() {
    const router = useRouter()
    const { items, vendorId, getTotal, clearCart } = useCart()

    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1) // 1: Address, 2: Payment, 3: Success
    const [formData, setFormData] = useState({
        address: '',
        notes: '',
        phone: ''
    })
    const [error, setError] = useState<string | null>(null)
    const [orderId, setOrderId] = useState<string | null>(null)
    const [isSimulated, setIsSimulated] = useState(false)

    const subtotal = getTotal()
    const deliveryFee = 100
    const total = subtotal + deliveryFee

    useEffect(() => {
        if (items.length === 0 && step !== 3) {
            router.push('/customer')
        }
        // Prefill phone from metadata if available
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
            // 1. Create the order in the database
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

            // 2. Initiate M-Pesa STK Push
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
            if (!mpesaResponse.ok) throw new Error(mpesaData.error || 'M-Pesa payment failed to initiate')

            // Detect if this was a simulation
            if (mpesaData.ResponseDescription?.includes('Simulated')) {
                setIsSimulated(true)
            }

            // 3. Move to success/waiting state
            setStep(3)
            clearCart()

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Simple Header */}
            <header className="bg-white border-b px-4 py-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline font-medium">Back</span>
                    </button>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Checkout
                    </h1>
                    <div className="w-10" />
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Forms */}
                    <div className="lg:col-span-2 space-y-6">
                        {step === 3 ? (
                            /* Success View */
                            <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-green-100 animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-12 h-12" />
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 mb-4">Order Placed!</h2>
                                {isSimulated ? (
                                    <div className="mb-8">
                                        <div className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                                            Development Mode
                                        </div>
                                        <p className="text-gray-600 max-w-md mx-auto">
                                            M-Pesa is not configured, so your payment has been <span className="text-green-600 font-bold">Auto-Verified</span> for testing.
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                        Please check your phone for the M-Pesa prompt to complete the payment of <span className="font-bold text-gray-900">{formatCurrency(total)}</span>.
                                    </p>
                                )}
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <Link
                                        href="/customer/orders"
                                        className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                                    >
                                        Track Order
                                    </Link>
                                    <Link
                                        href="/customer"
                                        className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                                    >
                                        Back to Home
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            /* Checkout Forms */
                            <>
                                {/* Delivery Address */}
                                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Delivery Details</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Street Address / Apartment</label>
                                            <input
                                                type="text"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                placeholder="e.g., Central Park Towers, Apt 4B"
                                                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Delivery Notes (Optional)</label>
                                            <textarea
                                                rows={2}
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                placeholder="e.g., Ring the doorbell, leave at the gate..."
                                                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                                            <Phone className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Payment Method</h3>
                                    </div>

                                    <div className="p-4 bg-green-50/50 border-2 border-green-500/20 rounded-2xl flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" alt="M-Pesa" className="w-10" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">M-Pesa STK Push</p>
                                                <p className="text-xs text-gray-500">Fast & Secure Mobile Payment</p>
                                            </div>
                                        </div>
                                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">M-Pesa Phone Number</label>
                                        <div className="relative">
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="07XXXXXXXX"
                                                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 transition"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            A payment prompt will be sent to this number.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right Column: Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 sticky top-24">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>

                            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-gray-900">
                                                <span className="text-blue-600">{item.quantity}x</span> {item.name}
                                            </p>
                                            {item.specialInstructions && (
                                                <p className="text-xs text-gray-500 truncate">{item.specialInstructions}</p>
                                            )}
                                        </div>
                                        <p className="text-sm font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3 pt-6 border-t border-dashed">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery Fee</span>
                                    <span>{formatCurrency(deliveryFee)}</span>
                                </div>
                                <div className="flex justify-between text-xl font-black text-gray-900 pt-3">
                                    <span>Total</span>
                                    <span className="text-blue-600">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex gap-3 animate-shake">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <p className="font-medium">{error}</p>
                                </div>
                            )}

                            {step !== 3 && (
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={loading || items.length === 0}
                                    className={`
                                        w-full mt-8 py-4 rounded-2xl font-black text-white text-lg
                                        transition-all duration-300 shadow-lg
                                        ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] active:scale-95 shadow-blue-200'}
                                    `}
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        `Pay ${formatCurrency(total)}`
                                    )}
                                </button>
                            )}

                            <p className="mt-4 text-center text-xs text-gray-400">
                                Secure payment powered by M-Pesa Daraja
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
