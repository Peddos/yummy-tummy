import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
    id: string
    menuItemId: string
    name: string
    price: number
    quantity: number
    specialInstructions?: string
    vendorId: string
    vendorName: string
}

interface CartStore {
    items: CartItem[]
    vendorId: string | null
    addItem: (item: Omit<CartItem, 'id'>) => void
    removeItem: (id: string) => void
    updateQuantity: (id: string, quantity: number) => void
    updateInstructions: (id: string, instructions: string) => void
    clearCart: () => void
    getTotal: () => number
    getItemCount: () => number
}

export const useCart = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            vendorId: null,

            addItem: (item) => {
                const state = get()

                // Check if adding from different vendor
                if (state.vendorId && state.vendorId !== item.vendorId) {
                    if (!confirm('Adding items from a different vendor will clear your cart. Continue?')) {
                        return
                    }
                    set({ items: [], vendorId: item.vendorId })
                }

                // Check if item already exists
                const existingItem = state.items.find(i => i.menuItemId === item.menuItemId)

                if (existingItem) {
                    set({
                        items: state.items.map(i =>
                            i.menuItemId === item.menuItemId
                                ? { ...i, quantity: i.quantity + item.quantity }
                                : i
                        )
                    })
                } else {
                    const id = typeof crypto !== 'undefined' && crypto.randomUUID
                        ? crypto.randomUUID()
                        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

                    set({
                        items: [...state.items, { ...item, id }],
                        vendorId: item.vendorId
                    })
                }
            },

            removeItem: (id) => {
                const state = get()
                const newItems = state.items.filter(i => i.id !== id)
                set({
                    items: newItems,
                    vendorId: newItems.length === 0 ? null : state.vendorId
                })
            },

            updateQuantity: (id, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(id)
                    return
                }
                set({
                    items: get().items.map(i =>
                        i.id === id ? { ...i, quantity } : i
                    )
                })
            },

            updateInstructions: (id, instructions) => {
                set({
                    items: get().items.map(i =>
                        i.id === id ? { ...i, specialInstructions: instructions } : i
                    )
                })
            },

            clearCart: () => set({ items: [], vendorId: null }),

            getTotal: () => {
                return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
            },

            getItemCount: () => {
                return get().items.reduce((count, item) => count + item.quantity, 0)
            }
        }),
        {
            name: 'cart-storage',
        }
    )
)
