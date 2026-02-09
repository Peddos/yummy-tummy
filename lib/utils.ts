import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Format currency in KSH
export function formatCurrency(amount: number): string {
    return `KSH ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

// Format date/time
export function formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return formatDate(d)
}

// Order status helpers
export const ORDER_STATUS_LABELS: Record<string, string> = {
    pending_payment: 'Pending Payment',
    payment_failed: 'Payment Failed',
    paid: 'Paid',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready_for_pickup: 'Ready for Pickup',
    assigned_to_rider: 'Assigned to Rider',
    picked_up: 'Picked Up',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled'
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    payment_failed: 'bg-red-100 text-red-800',
    paid: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-green-100 text-green-800',
    preparing: 'bg-orange-100 text-orange-800',
    ready_for_pickup: 'bg-purple-100 text-purple-800',
    assigned_to_rider: 'bg-indigo-100 text-indigo-800',
    picked_up: 'bg-cyan-100 text-cyan-800',
    in_transit: 'bg-teal-100 text-teal-800',
    delivered: 'bg-emerald-100 text-emerald-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
}

export function getOrderStatusLabel(status: string): string {
    return ORDER_STATUS_LABELS[status] || status
}

export function getOrderStatusColor(status: string): string {
    return ORDER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'
}



// Validate phone number (Kenyan format)
export function validatePhoneNumber(phone: string): boolean {
    // Kenyan phone numbers: 07XX XXX XXX or 01XX XXX XXX or +2547XX XXX XXX
    const regex = /^(\+254|254|0)?[17]\d{8}$/
    return regex.test(phone.replace(/\s/g, ''))
}

// Format phone number for M-Pesa (254XXXXXXXXX)
export function formatPhoneForMpesa(phone: string): string {
    let cleaned = phone.replace(/\s/g, '')

    if (cleaned.startsWith('+254')) {
        cleaned = cleaned.substring(1)
    } else if (cleaned.startsWith('0')) {
        cleaned = '254' + cleaned.substring(1)
    } else if (!cleaned.startsWith('254')) {
        cleaned = '254' + cleaned
    }

    return cleaned
}
