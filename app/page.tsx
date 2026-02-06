import Link from "next/link";
import { ArrowRight, ShoppingBag, Store, Bike, Shield } from "lucide-react";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Food Delivery System
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Complete multi-role platform with seamless M-Pesa integration for customers, vendors, riders, and admins
                    </p>
                </div>

                {/* Role Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {/* Customer Card */}
                    <Link href="/auth/login?role=customer">
                        <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 cursor-pointer">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ShoppingBag className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-gray-800">Customer</h3>
                            <p className="text-gray-600 mb-4">
                                Browse vendors, order food, track deliveries, and pay with M-Pesa
                            </p>
                            <div className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                                Get Started <ArrowRight className="w-5 h-5 ml-1" />
                            </div>
                        </div>
                    </Link>

                    {/* Vendor Card */}
                    <Link href="/auth/login?role=vendor">
                        <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 cursor-pointer">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Store className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-gray-800">Vendor</h3>
                            <p className="text-gray-600 mb-4">
                                Manage your menu, receive orders, and track your earnings
                            </p>
                            <div className="flex items-center text-purple-600 font-semibold group-hover:gap-2 transition-all">
                                Get Started <ArrowRight className="w-5 h-5 ml-1" />
                            </div>
                        </div>
                    </Link>

                    {/* Rider Card */}
                    <Link href="/auth/login?role=rider">
                        <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 cursor-pointer">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Bike className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-gray-800">Rider</h3>
                            <p className="text-gray-600 mb-4">
                                Accept deliveries, track routes, and earn money on every delivery
                            </p>
                            <div className="flex items-center text-green-600 font-semibold group-hover:gap-2 transition-all">
                                Get Started <ArrowRight className="w-5 h-5 ml-1" />
                            </div>
                        </div>
                    </Link>

                    {/* Admin Card */}
                    <Link href="/auth/login?role=admin">
                        <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 cursor-pointer">
                            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Shield className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-gray-800">Admin</h3>
                            <p className="text-gray-600 mb-4">
                                Monitor platform, manage users, and view comprehensive analytics
                            </p>
                            <div className="flex items-center text-orange-600 font-semibold group-hover:gap-2 transition-all">
                                Get Started <ArrowRight className="w-5 h-5 ml-1" />
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Features Section */}
                <div className="mt-20 max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Platform Features</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">💳</span>
                            </div>
                            <h3 className="font-semibold mb-2">M-Pesa Integration</h3>
                            <p className="text-gray-600 text-sm">Seamless payments with STK Push and automated payouts</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <h3 className="font-semibold mb-2">Real-time Updates</h3>
                            <p className="text-gray-600 text-sm">Live order tracking and instant notifications</p>
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🔒</span>
                            </div>
                            <h3 className="font-semibold mb-2">Secure & Scalable</h3>
                            <p className="text-gray-600 text-sm">Built with Supabase RLS and hosted on Vercel</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
