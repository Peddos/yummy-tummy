import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    display: 'swap',
    fallback: ['system-ui', 'arial']
});

export const metadata: Metadata = {
    title: "Yummy Tummy | Premium Food Delivery",
    description: "Multi-role food delivery platform with M-Pesa integration",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Yummy Tummy",
    },
};

export const viewport = {
    themeColor: "#ea580c",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
