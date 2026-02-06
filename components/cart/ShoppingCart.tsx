'use client'

import { useCart } from '@/lib/store/cart'
import { formatCurrency } from '@/lib/utils'
import { X, Plus, Minus, ShoppingCart as CartIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ShoppingCart() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const { items, removeItem, updateQuantity, getTotal, getItemCount, clearCart } = useCart()

    const itemCount = getItemCount()
    const total = getTotal()

    if (itemCount === 0) return null

    return (
        <>
            {/* Floating Cart Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all z-40 group"
            >
                <CartIcon className="w-6 h-6" />
                {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {itemCount}
                    </span>
                )}
            </button>

            {/* Cart Sidebar */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Sidebar */}
                    <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            <div>
                                <h2 className="text-2xl font-bold">Your Cart</h2>
                                <p className="text-sm text-blue-100">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/20 rounded-lg transition"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {items.map((item) => (
                                <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                            <p className="text-sm text-gray-600">{formatCurrency(item.price)}</p>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 bg-white rounded-lg p-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="p-2 hover:bg-gray-100 rounded transition"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="font-semibold w-8 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="p-2 hover:bg-gray-100 rounded transition"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <span className="font-bold text-gray-900">
                                            {formatCurrency(item.price * item.quantity)}
                                        </span>
                                    </div>

                                    {item.specialInstructions && (
                                        <p className="text-sm text-gray-600 mt-2 italic">
                                            Note: {item.specialInstructions}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="border-t p-6 bg-gray-50">
                            <div className="space-y-3 mb-4">
                                <div className="flex justify-between text-gray-700">
                                    <span>Subtotal</span>
                                    <span className="font-semibold">{formatCurrency(total)}</span>
                                </div>
                                <div className="flex justify-between text-gray-700">
                                    <span>Delivery Fee</span>
                                    <span className="font-semibold">{formatCurrency(1)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t">
                                    <span>Total</span>
                                    <span>{formatCurrency(total + 1)}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setIsOpen(false)
                                    router.push('/customer/checkout')
                                }}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition mb-2"
                            >
                                Proceed to Checkout
                            </button>

                            <button
                                onClick={() => {
                                    if (confirm('Clear all items from cart?')) {
                                        clearCart()
                                        setIsOpen(false)
                                    }
                                }}
                                className="w-full text-red-600 hover:text-red-700 py-2 text-sm font-medium"
                            >
                                Clear Cart
                            </button>
                        </div>
                    </div>
                </>
            )}
        </>
    )
}
