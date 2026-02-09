import React from 'react'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
    icon: LucideIcon
    label: string
    value: string | number
    trend?: {
        value: number
        isPositive: boolean
    }
    iconColor?: string
    className?: string
}

export default function MetricCard({
    icon: Icon,
    label,
    value,
    trend,
    iconColor = 'text-blue-600',
    className = ''
}: MetricCardProps) {
    return (
        <div className={`card card-hover p-6 ${className}`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center ${iconColor}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.isPositive ? '+' : ''}{trend.value}%
                    </span>
                )}
            </div>
            <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
            </div>
        </div>
    )
}
