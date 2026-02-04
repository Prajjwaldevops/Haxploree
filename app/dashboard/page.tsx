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
    ChevronRight,
    Loader2,
    RefreshCcw,
    Image as ImageIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useUserData, Transaction } from "@/lib/useUserData";

export default function DashboardPage() {
    const { user, isLoaded: isClerkLoaded } = useUser();
    const { userStats, transactions, isLoading, error, refetch } = useUserData();

    if (!isClerkLoaded || isLoading) {
        return (
            <main className="min-h-screen">
                <Navbar />
                <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                    <p className="text-slate-400">Loading your dashboard...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen">
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="glass-card p-8 text-center max-w-md mx-auto">
                        <div className="text-red-400 mb-4">Failed to load data</div>
                        <p className="text-slate-400 text-sm mb-4">{error}</p>
                        <button
                            onClick={refetch}
                            className="flex items-center gap-2 mx-auto px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                        >
                            <RefreshCcw className="h-4 w-4" />
                            Retry
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    // Use live data from Supabase, with fallbacks
    const stats = {
        totalPoints: userStats?.total_points || 0,
        co2Saved: userStats?.total_co2_saved || 0,
        itemsRecycled: userStats?.items_recycled || 0,
        rank: userStats?.rank || 0,
    };

    // Format recent transactions for display
    const recentActivity = transactions.slice(0, 5).map((tx: Transaction) => ({
        id: tx.id,
        item: tx.item_type,
        points: tx.points_earned,
        date: formatRelativeTime(tx.created_at),
        imageUrl: tx.image_url,
        status: tx.status,
    }));

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
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            Welcome back, {user?.firstName || "Eco-Warrior"}! 👋
                        </h1>
                        <p className="text-slate-400">
                            Track your impact and continue your recycling journey.
                        </p>
                        {userStats?.email && (
                            <p className="text-xs text-slate-500 mt-1">
                                {userStats.email}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={refetch}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-slate-400 hover:text-white"
                        title="Refresh data"
                    >
                        <RefreshCcw className="h-5 w-5" />
                    </button>
                </div>

                {/* Stats Cards - LIVE DATA */}
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
                            {stats.co2Saved.toFixed(1)} kg
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
                            #{stats.rank || "—"}
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

                {/* Recent Activity - LIVE FROM SUPABASE */}
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Recent Activity</h2>
                    {recentActivity.length > 0 ? (
                        <div className="glass-card divide-y divide-white/5">
                            {recentActivity.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        {activity.imageUrl ? (
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800">
                                                <img
                                                    src={activity.imageUrl}
                                                    alt={activity.item}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="p-2 rounded-lg bg-emerald-500/20">
                                                <Package className="h-5 w-5 text-emerald-400" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-medium text-white">{activity.item}</div>
                                            <div className="text-sm text-slate-400 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {activity.date}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-emerald-400 font-semibold">
                                            +{activity.points} pts
                                        </div>
                                        <div className={cn(
                                            "text-xs capitalize",
                                            activity.status === "completed" ? "text-emerald-400" :
                                                activity.status === "pending" ? "text-yellow-400" : "text-red-400"
                                        )}>
                                            {activity.status}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-card p-8 text-center">
                            <ImageIcon className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 mb-4">No deposits yet</p>
                            <Link
                                href="/deposit"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                            >
                                <Camera className="h-4 w-4" />
                                Make Your First Deposit
                            </Link>
                        </div>
                    )}
                    {recentActivity.length > 0 && (
                        <div className="mt-4 text-center">
                            <button className="text-sm text-slate-400 hover:text-white transition-colors">
                                View All Activity →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

/**
 * Format timestamp to relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? "" : "s"} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    return date.toLocaleDateString();
}
