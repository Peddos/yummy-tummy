import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    display: 'swap',
    fallback: ['system-ui', 'arial']
});

export const metadata: Metadata = {
    title: "Food Delivery System",
    description: "Multi-role food delivery platform with M-Pesa integration",
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
