"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
    Gift,
    Coins,
    Loader2,
    ArrowLeft,
    ShoppingBag,
    Ticket,
    CreditCard,
    Coffee,
    Zap,
    Crown,
    Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

// Mock Rewards Data
const rewards = [
    {
        id: 1,
        title: "Amazon Gift Card",
        cost: 500,
        type: "voucher",
        icon: ShoppingBag,
        color: "text-amber-500",
        bg: "bg-amber-500/20",
        description: "₹100 Amazon Pay gift card for shopping.",
    },
    {
        id: 2,
        title: "Movie Ticket",
        cost: 300,
        type: "entertainment",
        icon: Ticket,
        color: "text-purple-500",
        bg: "bg-purple-500/20",
        description: "Get 15% off on your next movie ticket.",
    },
    {
        id: 3,
        title: "Free Coffee",
        cost: 150,
        type: "food",
        icon: Coffee,
        color: "text-amber-700",
        bg: "bg-amber-700/20",
        description: "One free cappuccino at valid cafes.",
    },
    {
        id: 4,
        title: "Bill Payment",
        cost: 1000,
        type: "utility",
        icon: CreditCard,
        color: "text-emerald-500",
        bg: "bg-emerald-500/20",
        description: "₹200 off on electricity bill payment.",
    },
    {
        id: 5,
        title: "Premium Badge",
        cost: 2000,
        type: "status",
        icon: Crown,
        color: "text-yellow-400",
        bg: "bg-yellow-400/20",
        description: "Unlock exclusive premium status + 2x points.",
    },
];

export default function RewardsPage() {
    const router = useRouter();
    const { user, isLoaded } = useUser();

    const [userPoints, setUserPoints] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [redeemStatus, setRedeemStatus] = useState<{ id: number; message: string } | null>(null);

    // Fetch User Points
    useEffect(() => {
        if (isLoaded && !user) {
            router.push("/sign-in");
            return;
        }

        if (user) {
            fetchPoints();
        }
    }, [isLoaded, user]);

    const fetchPoints = async () => {
        try {
            const res = await fetch("/api/user/stats");
            const data = await res.json();
            if (data.success) {
                setUserPoints(data.stats.total_points || 0);
            }
        } catch (error) {
            console.error("Failed to fetch points:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRedeem = (rewardId: number, cost: number) => {
        if (userPoints < cost) {
            setRedeemStatus({ id: rewardId, message: "Insufficient points!" });
            setTimeout(() => setRedeemStatus(null), 2000);
            return;
        }

        if (confirm("Are you sure you want to redeem this reward?")) {
            setRedeemStatus({ id: rewardId, message: "Not available right now" });
            setTimeout(() => setRedeemStatus(null), 3000);
        }
    };

    if (!isLoaded || isLoading) {
        return (
            <main className="min-h-screen bg-[#01030c]">
                <Navbar />
                <div className="min-h-[80vh] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#01030c]">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-slate-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Rewards Store</h1>
                            <p className="text-sm text-slate-400">Redeem points for exclusive perks</p>
                        </div>
                    </div>
                </div>

                {/* Points Card */}
                <div className="glass-card p-6 mb-8 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400 mb-1">Your Balance</p>
                            <div className="flex items-center gap-2">
                                <Coins className="h-8 w-8 text-amber-400" />
                                <span className="text-4xl font-bold text-white">{userPoints.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <button className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white font-medium transition-colors">
                                History
                            </button>
                        </div>
                    </div>
                </div>

                {/* Rewards Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rewards.map((reward) => (
                        <div key={reward.id} className="glass-card p-6 flex flex-col relative overflow-hidden group">
                            {/* Hover Status */}
                            <AnimatePresence>
                                {redeemStatus?.id === reward.id && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 text-center"
                                    >
                                        <p className="text-white font-bold">{redeemStatus.message}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex justify-between items-start mb-4">
                                <div className={cn("p-3 rounded-xl", reward.bg)}>
                                    <reward.icon className={cn("h-6 w-6", reward.color)} />
                                </div>
                                <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full">
                                    <Coins className="h-3 w-3 text-amber-400" />
                                    <span className="text-sm font-medium text-white">{reward.cost}</span>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2">{reward.title}</h3>
                            <p className="text-sm text-slate-400 mb-6 flex-grow">{reward.description}</p>

                            <button
                                onClick={() => handleRedeem(reward.id, reward.cost)}
                                disabled={userPoints < reward.cost}
                                className={cn(
                                    "w-full py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2",
                                    userPoints >= reward.cost
                                        ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:shadow-lg hover:shadow-emerald-500/20"
                                        : "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5"
                                )}
                            >
                                {userPoints >= reward.cost ? (
                                    <>
                                        Redeem
                                        <Zap className="h-4 w-4" />
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4" />
                                        Locked
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
