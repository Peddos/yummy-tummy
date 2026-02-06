export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type UserRole = 'customer' | 'vendor' | 'rider' | 'admin'

export type OrderStatus =
    | 'pending_payment'
    | 'payment_failed'
    | 'paid'
    | 'confirmed'
    | 'preparing'
    | 'ready_for_pickup'
    | 'assigned_to_rider'
    | 'picked_up'
    | 'in_transit'
    | 'delivered'
    | 'completed'
    | 'cancelled'

export type TransactionType =
    | 'customer_payment'
    | 'vendor_payout'
    | 'rider_payout'
    | 'refund'
    | 'platform_commission'

export type TransactionStatus =
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'refunded'

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    role: UserRole
                    full_name: string
                    phone: string
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    role?: UserRole
                    full_name: string
                    phone: string
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    role?: UserRole
                    full_name?: string
                    phone?: string
                    avatar_url?: string | null
                    updated_at?: string
                }
            }
            vendors: {
                Row: {
                    id: string
                    business_name: string
                    description: string | null
                    cuisine_type: string | null
                    address: string
                    latitude: number | null
                    longitude: number | null
                    image_url: string | null
                    rating: number
                    total_reviews: number
                    is_active: boolean
                    total_earnings: number
                    pending_earnings: number
                    created_at: string
                }
                Insert: {
                    id: string
                    business_name: string
                    description?: string | null
                    cuisine_type?: string | null
                    address: string
                    latitude?: number | null
                    longitude?: number | null
                    image_url?: string | null
                    rating?: number
                    total_reviews?: number
                    is_active?: boolean
                    total_earnings?: number
                    pending_earnings?: number
                    created_at?: string
                }
                Update: {
                    business_name?: string
                    description?: string | null
                    cuisine_type?: string | null
                    address?: string
                    latitude?: number | null
                    longitude?: number | null
                    image_url?: string | null
                    is_active?: boolean
                    total_earnings?: number
                    pending_earnings?: number
                }
            }
            riders: {
                Row: {
                    id: string
                    vehicle_type: string
                    vehicle_number: string | null
                    is_available: boolean
                    rating: number
                    total_reviews: number
                    total_earnings: number
                    pending_earnings: number
                    created_at: string
                }
                Insert: {
                    id: string
                    vehicle_type: string
                    vehicle_number?: string | null
                    is_available?: boolean
                    rating?: number
                    total_reviews?: number
                    total_earnings?: number
                    pending_earnings?: number
                    created_at?: string
                }
                Update: {
                    vehicle_type?: string
                    vehicle_number?: string | null
                    is_available?: boolean
                    total_earnings?: number
                    pending_earnings?: number
                }
            }
            menu_categories: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    created_at?: string
                }
                Update: {
                    name?: string
                    description?: string | null
                }
            }
            menu_items: {
                Row: {
                    id: string
                    vendor_id: string
                    category_id: string | null
                    name: string
                    description: string | null
                    price: number
                    image_url: string | null
                    is_available: boolean
                    preparation_time: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    vendor_id: string
                    category_id?: string | null
                    name: string
                    description?: string | null
                    price: number
                    image_url?: string | null
                    is_available?: boolean
                    preparation_time?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    category_id?: string | null
                    name?: string
                    description?: string | null
                    price?: number
                    image_url?: string | null
                    is_available?: boolean
                    preparation_time?: number
                    updated_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    order_number: string
                    customer_id: string
                    vendor_id: string
                    rider_id: string | null
                    status: OrderStatus
                    subtotal: number
                    delivery_fee: number
                    total: number
                    delivery_address: string
                    delivery_latitude: number | null
                    delivery_longitude: number | null
                    delivery_notes: string | null
                    created_at: string
                    confirmed_at: string | null
                    ready_at: string | null
                    picked_up_at: string | null
                    delivered_at: string | null
                    completed_at: string | null
                }
                Insert: {
                    id?: string
                    order_number?: string
                    customer_id: string
                    vendor_id: string
                    rider_id?: string | null
                    status?: OrderStatus
                    subtotal: number
                    delivery_fee: number
                    total: number
                    delivery_address: string
                    delivery_latitude?: number | null
                    delivery_longitude?: number | null
                    delivery_notes?: string | null
                    created_at?: string
                }
                Update: {
                    rider_id?: string | null
                    status?: OrderStatus
                    subtotal?: number
                    delivery_fee?: number
                    total?: number
                    delivery_address?: string
                    delivery_latitude?: number | null
                    delivery_longitude?: number | null
                    delivery_notes?: string | null
                    confirmed_at?: string | null
                    ready_at?: string | null
                    picked_up_at?: string | null
                    delivered_at?: string | null
                    completed_at?: string | null
                }
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    menu_item_id: string
                    quantity: number
                    unit_price: number
                    total_price: number
                    special_instructions: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    menu_item_id: string
                    quantity: number
                    unit_price: number
                    total_price: number
                    special_instructions?: string | null
                    created_at?: string
                }
                Update: {
                    quantity?: number
                    special_instructions?: string | null
                }
            }
            transactions: {
                Row: {
                    id: string
                    order_id: string | null
                    user_id: string | null
                    type: TransactionType
                    status: TransactionStatus
                    amount: number
                    mpesa_receipt_number: string | null
                    mpesa_transaction_id: string | null
                    phone_number: string | null
                    vendor_share: number | null
                    rider_share: number | null
                    platform_commission: number | null
                    metadata: Json | null
                    created_at: string
                    completed_at: string | null
                }
                Insert: {
                    id?: string
                    order_id?: string | null
                    user_id?: string | null
                    type: TransactionType
                    status?: TransactionStatus
                    amount: number
                    mpesa_receipt_number?: string | null
                    mpesa_transaction_id?: string | null
                    phone_number?: string | null
                    vendor_share?: number | null
                    rider_share?: number | null
                    platform_commission?: number | null
                    metadata?: Json | null
                    created_at?: string
                    completed_at?: string | null
                }
                Update: {
                    order_id?: string | null
                    user_id?: string | null
                    type?: TransactionType
                    status?: TransactionStatus
                    amount?: number
                    mpesa_receipt_number?: string | null
                    mpesa_transaction_id?: string | null
                    phone_number?: string | null
                    vendor_share?: number | null
                    rider_share?: number | null
                    platform_commission?: number | null
                    metadata?: Json | null
                    completed_at?: string | null
                }
            }
            reviews: {
                Row: {
                    id: string
                    order_id: string
                    customer_id: string
                    vendor_id: string | null
                    rider_id: string | null
                    vendor_rating: number | null
                    rider_rating: number | null
                    vendor_comment: string | null
                    rider_comment: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    customer_id: string
                    vendor_id?: string | null
                    rider_id?: string | null
                    vendor_rating?: number | null
                    rider_rating?: number | null
                    vendor_comment?: string | null
                    rider_comment?: string | null
                    created_at?: string
                }
                Update: {
                    vendor_rating?: number | null
                    rider_rating?: number | null
                    vendor_comment?: string | null
                    rider_comment?: string | null
                }
            }
            addresses: {
                Row: {
                    id: string
                    user_id: string
                    label: string
                    address: string
                    latitude: number | null
                    longitude: number | null
                    is_default: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    label: string
                    address: string
                    latitude?: number | null
                    longitude?: number | null
                    is_default?: boolean
                    created_at?: string
                }
                Update: {
                    label?: string
                    address?: string
                    latitude?: number | null
                    longitude?: number | null
                    is_default?: boolean
                }
            }
        }
    }
}
