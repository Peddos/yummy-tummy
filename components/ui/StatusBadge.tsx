import React from 'react'

interface StatusBadgeProps {
    status: string
    className?: string
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
    const getStatusStyle = (status: string) => {
        const statusLower = status.toLowerCase()

        if (statusLower.includes('pending') || statusLower.includes('waiting')) {
            return 'badge badge-warning'
        }
        if (statusLower.includes('paid') || statusLower.includes('preparing') || statusLower.includes('ready')) {
            return 'badge badge-info'
        }
        if (statusLower.includes('completed') || statusLower.includes('delivered')) {
            return 'badge badge-success'
        }
        if (statusLower.includes('cancelled') || statusLower.includes('failed')) {
            return 'badge badge-error'
        }

        return 'badge badge-info'
    }

    return (
        <span className={`${getStatusStyle(status)} ${className}`}>
            {status.replace(/_/g, ' ').toUpperCase()}
        </span>
    )
}
