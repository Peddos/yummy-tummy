const withPWA = require('next-pwa')({
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
                port: '',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
    typescript: {
        ignoreBuildErrors: true,
    },
}

module.exports = withPWA(nextConfig)
