'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'

interface NavItem {
    href: string
    icon: LucideIcon
    label: string
}

interface BottomNavProps {
    items: NavItem[]
}

export default function BottomNav({ items }: BottomNavProps) {
    const pathname = usePathname()

    return (
        <nav className="bottom-nav md:hidden">
            <div className="flex items-center justify-around">
                {items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`bottom-nav-item flex-1 ${isActive ? 'active' : ''}`}
                        >
                            <Icon className="w-6 h-6 mb-1" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
