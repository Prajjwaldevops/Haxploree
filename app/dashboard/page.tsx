"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
    Coins,
    Leaf,
    Package,
    MapPin,
    Camera,
    Gift,
    TrendingUp,
    Clock,
    ChevronRight
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
    const { user, isLoaded } = useUser();

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-emerald-400">Loading...</div>
            </div>
        );
    }

    // Mock user stats - in production these would come from Supabase
    const stats = {
        totalPoints: 2450,
        co2Saved: 12.5,
        itemsRecycled: 24,
        rank: 156,
    };

    const recentActivity = [
        { id: 1, item: "Smartphone", points: 50, date: "2 hours ago" },
        { id: 2, item: "Laptop Charger", points: 20, date: "Yesterday" },
        { id: 3, item: "Tablet", points: 80, date: "3 days ago" },
    ];

    const quickActions = [
        {
            title: "Find Bin",
            description: "Locate nearest smart bin",
            icon: MapPin,
            href: "/find-bin",
            color: "emerald",
        },
        {
            title: "Deposit",
            description: "Scan and drop e-waste",
            icon: Camera,
            href: "/deposit",
            color: "cyan",
        },
        {
            title: "Rewards",
            description: "Redeem your points",
            icon: Gift,
            href: "/rewards",
            color: "purple",
        },
    ];

    const colorClasses: Record<string, string> = {
        emerald: "from-emerald-500 to-emerald-600 shadow-emerald-500/30",
        cyan: "from-cyan-500 to-cyan-600 shadow-cyan-500/30",
        purple: "from-purple-500 to-purple-600 shadow-purple-500/30",
    };

    return (
        <main className="min-h-screen">
            <Navbar />

            <div className="container mx-auto px-4 lg:px-8 py-8">
                {/* Welcome Header */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Welcome back, {user?.firstName || "Eco-Warrior"}! 👋
                    </h1>
                    <p className="text-slate-400">
                        Track your impact and continue your recycling journey.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="glass-card p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-emerald-500/20">
                                <Coins className="h-5 w-5 text-emerald-400" />
                            </div>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-white">
                            {stats.totalPoints.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-400">Total Points</div>
                    </div>

                    <div className="glass-card p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-blue-500/20">
                                <Leaf className="h-5 w-5 text-blue-400" />
                            </div>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-white">
                            {stats.co2Saved} kg
                        </div>
                        <div className="text-sm text-slate-400">CO₂ Saved</div>
                    </div>

                    <div className="glass-card p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors" />
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-purple-500/20">
                                <Package className="h-5 w-5 text-purple-400" />
                            </div>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-white">
                            {stats.itemsRecycled}
                        </div>
                        <div className="text-sm text-slate-400">Items Recycled</div>
                    </div>

                    <div className="glass-card p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-colors" />
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-lg bg-orange-500/20">
                                <TrendingUp className="h-5 w-5 text-orange-400" />
                            </div>
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-white">
                            #{stats.rank}
                        </div>
                        <div className="text-sm text-slate-400">Leaderboard Rank</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        {quickActions.map((action) => (
                            <Link
                                key={action.title}
                                href={action.href}
                                className="glass-card p-6 hover:bg-white/5 transition-all duration-300 group"
                            >
                                <div
                                    className={cn(
                                        "inline-flex p-3 rounded-xl bg-gradient-to-br shadow-lg mb-4",
                                        colorClasses[action.color]
                                    )}
                                >
                                    <action.icon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                                    {action.title}
                                </h3>
                                <p className="text-sm text-slate-400">{action.description}</p>
                                <div className="mt-4 flex items-center text-sm text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Go to {action.title}
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
                    <div className="glass-card divide-y divide-white/5">
                        {recentActivity.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-emerald-500/20">
                                        <Package className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">{activity.item}</div>
                                        <div className="text-sm text-slate-400 flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {activity.date}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-emerald-400 font-semibold">
                                    +{activity.points} pts
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-center">
                        <button className="text-sm text-slate-400 hover:text-white transition-colors">
                            View All Activity →
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
