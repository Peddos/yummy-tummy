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

                if (profile && (profile as any).role) {
                    const role = (profile as any).role;
                    const redirectMap: Record<string, string> = {
                        customer: '/customer',
                        vendor: '/vendor/dashboard',
                        rider: '/rider/dashboard',
                        admin: '/admin/dashboard',
                    };
                    router.push(redirectMap[role] || '/customer');
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center">
                            <Utensils className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">
                            Yummy Tummy
                        </span>
                    </div>
                    <Link href="/auth/login?role=customer">
                        <button className="btn btn-primary">
                            Sign In
                        </button>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <main className="pt-24 pb-16">
                <div className="container mx-auto px-4">
                    {/* Hero Content */}
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--color-primary-light)] rounded-3xl mb-6">
                            <span className="text-5xl">🍽️</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
                            Food delivery made{' '}
                            <span className="text-[var(--color-primary)]">
                                simple
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                            Discover delicious meals from the best restaurants in town. Fast delivery, secure M-Pesa payments. 🚀
                        </p>

                        {/* Enhanced Search Bar */}
                        <div className="relative max-w-2xl mx-auto mb-12 group">
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                <Search className="w-6 h-6 text-gray-400 group-focus-within:text-tomato-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="What are you craving today? 🍕🍔🍜"
                                className="w-full pl-14 pr-4 py-5 bg-white border-2 border-orange-200 rounded-3xl focus:bg-white focus:border-tomato-400 focus:ring-4 focus:ring-tomato-100 outline-none transition-all shadow-lg hover:shadow-xl text-lg"
                            />
                            <Link href="/auth/login?role=customer" className="absolute top-2 right-2 bottom-2">
                                <button className="h-full px-8 bg-gradient-to-r from-tomato-500 to-warmOrange-600 text-white rounded-2xl font-bold hover:from-tomato-600 hover:to-warmOrange-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl">
                                    Find Food <ArrowRight className="w-5 h-5" />
                                </button>
                            </Link>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/auth/signup?role=customer">
                                <button className="btn btn-primary px-8 py-4 text-lg flex items-center gap-2">
                                    <ShoppingBag className="w-5 h-5" />
                                    Start Ordering
                                </button>
                            </Link>
                        </div>
                    </div>

                    {/* App Features - Enhanced */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto mb-20">
                        {[
                            { icon: <Zap className="text-tomato-600" />, label: "Lightning Fast", sub: "Under 30 mins", color: "from-tomato-50 to-orange-50" },
                            { icon: <Clock className="text-freshGreen-600" />, label: "Real-time Track", sub: "Live updates", color: "from-freshGreen-50 to-teal-50" },
                            { icon: <Star className="text-goldenYellow-600" />, label: "Top Rated", sub: "5-star vendors", color: "from-goldenYellow-50 to-amber-50" },
                            { icon: <Shield className="text-blue-600" />, label: "Secure Pay", sub: "M-Pesa safe", color: "from-blue-50 to-indigo-50" }
                        ].map((f, i) => (
                            <div key={i} className={`bg-gradient-to-br ${f.color} p-6 rounded-3xl border-2 border-white shadow-lg hover:shadow-2xl transition-all hover:scale-105 cursor-pointer`}>
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto mb-4">
                                    {f.icon}
                                </div>
                                <h4 className="font-black text-gray-900 text-base mb-1">{f.label}</h4>
                                <p className="text-sm text-gray-600 font-medium">{f.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Visual Divider */}
                    <div className="max-w-4xl mx-auto mb-16">
                        <div className="h-px bg-gradient-to-r from-transparent via-orange-300 to-transparent"></div>
                    </div>

                    {/* Partners Section */}
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-black text-gray-900 mb-3">Become a Partner</h2>
                            <p className="text-lg text-gray-600 font-medium">Earn money or grow your business with Yummy Tummy 💼</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <Link href="/auth/login?role=vendor" className="group">
                                <div className="bg-white border-2 border-orange-100 p-8 rounded-3xl hover:border-tomato-400 hover:shadow-2xl transition-all transform hover:-translate-y-2">
                                    <div className="w-16 h-16 bg-gradient-to-br from-tomato-500 to-warmOrange-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform">
                                        <ChefHat className="w-9 h-9 text-white" />
                                    </div>
                                    <h4 className="text-2xl font-black mb-3 text-gray-900">Vendors</h4>
                                    <p className="text-base text-gray-600 mb-6 leading-relaxed">List your menu and reach thousands of hungry customers daily.</p>
                                    <div className="text-tomato-600 font-bold text-base flex items-center gap-2 group-hover:gap-3 transition-all">
                                        Partner with us <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </Link>

                            <Link href="/auth/login?role=rider" className="group">
                                <div className="bg-white border-2 border-blue-100 p-8 rounded-3xl hover:border-blue-400 hover:shadow-2xl transition-all transform hover:-translate-y-2">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform">
                                        <Bike className="w-9 h-9 text-white" />
                                    </div>
                                    <h4 className="text-2xl font-black mb-3 text-gray-900">Riders</h4>
                                    <p className="text-base text-gray-600 mb-6 leading-relaxed">Be your own boss. Deliver food, earn money, keep 100% of your tips.</p>
                                    <div className="text-blue-600 font-bold text-base flex items-center gap-2 group-hover:gap-3 transition-all">
                                        Start Riding <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </Link>

                            <Link href="/auth/login?role=admin" className="group">
                                <div className="bg-white border-2 border-gray-200 p-8 rounded-3xl hover:border-gray-900 hover:shadow-2xl transition-all transform hover:-translate-y-2">
                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform">
                                        <Shield className="w-9 h-9 text-white" />
                                    </div>
                                    <h4 className="text-2xl font-black mb-3 text-gray-900">Admin</h4>
                                    <p className="text-base text-gray-600 mb-6 leading-relaxed">Platform management with comprehensive analytics and insights.</p>
                                    <div className="text-gray-900 font-bold text-base flex items-center gap-2 group-hover:gap-3 transition-all">
                                        Portal Access <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Enhanced Footer */}
            <footer className="bg-gradient-to-br from-gray-50 to-orange-50 py-12 border-t-2 border-orange-100">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-tomato-500 to-warmOrange-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Utensils className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-black bg-gradient-to-r from-tomato-600 via-warmOrange-600 to-tomato-500 bg-clip-text text-transparent">
                                Yummy Tummy
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm font-medium mb-2">Delicious food, delivered fast 🚀</p>
                        <p className="text-gray-400 text-xs">© 2026 Yummy Tummy. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
