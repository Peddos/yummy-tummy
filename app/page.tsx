'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    ShoppingBag,
    Store,
    Bike,
    Shield,
    Search,
    Zap,
    Clock,
    Star,
    ChefHat,
    Utensils
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function HomePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    const redirectMap: Record<string, string> = {
                        customer: '/customer',
                        vendor: '/vendor/dashboard',
                        rider: '/rider/dashboard',
                        admin: '/admin/dashboard',
                    };
                    router.push(redirectMap[profile.role] || '/customer');
                    return;
                }
            }
            setLoading(false);
        };
        checkUser();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Mobile-Optimized Header */}
            <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                            <Utensils className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                            Yummy Tummy
                        </span>
                    </div>
                    <Link href="/auth/login?role=customer">
                        <button className="text-sm font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200 transition">
                            Sign In
                        </button>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <main className="pt-24 pb-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center mb-12">
                        <h1 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 leading-tight">
                            Hungry? Your Favorite <span className="text-orange-600">Food</span> is a Tap Away.
                        </h1>
                        <p className="text-lg text-gray-600 mb-10">
                            The best restaurants in town, delivered fast with M-Pesa.
                        </p>

                        {/* Search Bar (Mobile Style) */}
                        <div className="relative max-w-xl mx-auto mb-10 group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-gray-400 group-focus-within:text-orange-600 transition" />
                            </div>
                            <input
                                type="text"
                                placeholder="What are you craving today?"
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-orange-600 outline-none transition-all shadow-sm group-hover:shadow-md"
                            />
                            <Link href="/auth/login?role=customer" className="absolute top-2 right-2 bottom-2">
                                <button className="h-full px-6 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition flex items-center text-sm">
                                    Find Food
                                </button>
                            </Link>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/auth/signup?role=customer">
                                <button className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all hover:scale-105 flex items-center gap-2">
                                    Create Account <ArrowRight className="w-5 h-5" />
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* App Features */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto py-12">
                        {[
                            { icon: <Zap className="text-orange-600" />, label: "Fast Delivery", sub: "Under 30 mins" },
                            { icon: <Clock className="text-blue-600" />, label: "Real-time", sub: "Track your order" },
                            { icon: <Star className="text-yellow-600" />, label: "Top Rated", sub: "Verified vendors" },
                            { icon: <Shield className="text-green-600" />, label: "Safe Pay", sub: "Via M-Pesa" }
                        ].map((f, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3">
                                    {f.icon}
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">{f.label}</h4>
                                <p className="text-xs text-gray-500">{f.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Visual Divider */}
                    <hr className="my-16 border-gray-100" />

                    {/* Partners Section (Hidden for normal customers) */}
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold text-gray-800">Become a Partner</h2>
                            <p className="text-gray-500">Earn money or grow your business with Yummy Tummy</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <Link href="/auth/login?role=vendor" className="group">
                                <div className="bg-white border border-gray-200 p-6 rounded-2xl hover:border-orange-600 transition">
                                    <ChefHat className="w-10 h-10 text-orange-600 mb-4" />
                                    <h4 className="text-lg font-bold mb-2">Vendors</h4>
                                    <p className="text-sm text-gray-600 mb-4">List your menu and reach thousands of customers.</p>
                                    <div className="text-orange-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Partner with us <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>

                            <Link href="/auth/login?role=rider" className="group">
                                <div className="bg-white border border-gray-200 p-6 rounded-2xl hover:border-blue-600 transition">
                                    <Bike className="w-10 h-10 text-blue-600 mb-4" />
                                    <h4 className="text-lg font-bold mb-2">Riders</h4>
                                    <p className="text-sm text-gray-600 mb-4">Be your own boss. Deliver food and keep 100% tips.</p>
                                    <div className="text-blue-600 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Start Riding <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>

                            <Link href="/auth/login?role=admin" className="group">
                                <div className="bg-white border border-gray-200 p-6 rounded-2xl hover:border-gray-900 transition">
                                    <Shield className="w-10 h-10 text-gray-900 mb-4" />
                                    <h4 className="text-lg font-bold mb-2">Admin</h4>
                                    <p className="text-sm text-gray-600 mb-4">Platform management and comprehensive analytics.</p>
                                    <div className="text-gray-900 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                        Portal Access <ArrowRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="bg-gray-50 py-12 border-t border-gray-100">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-gray-400 text-sm">© 2026 Yummy Tummy. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
