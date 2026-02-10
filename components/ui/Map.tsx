'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Icon } from 'leaflet'
import Link from 'next/link'
import { Star } from 'lucide-react'

// Fix for default marker icons in Next.js
const customIcon = new Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [38, 38]
})

interface Vendor {
    id: string
    business_name: string
    latitude?: number
    longitude?: number
    rating?: number
    cuisine_type?: string
}

interface MapProps {
    vendors: Vendor[]
    center?: [number, number]
}

export default function Map({ vendors, center = [-1.2921, 36.8219] }: MapProps) {
    return (
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {vendors.map((vendor) => (
                vendor.latitude && vendor.longitude && (
                    <Marker
                        key={vendor.id}
                        position={[vendor.latitude, vendor.longitude]}
                        icon={customIcon}
                    >
                        <Popup>
                            <div className="min-w-[150px]">
                                <h3 className="font-bold text-sm">{vendor.business_name}</h3>
                                <div className="flex items-center gap-1 my-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    <span className="text-xs font-bold">{vendor.rating || 'New'}</span>
                                    <span className="text-xs text-gray-500">• {vendor.cuisine_type}</span>
                                </div>
                                <Link
                                    href={`/customer/vendor/${vendor.id}`}
                                    className="block mt-2 text-center bg-[var(--color-primary)] text-white text-xs font-bold py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    View Menu
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                )
            ))}
        </MapContainer>
    )
}
