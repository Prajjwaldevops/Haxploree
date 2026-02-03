"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Gift,
    Coins,
    ShoppingBag,
    Coffee,
    Ticket,
    Zap,
    CheckCircle,
    Star,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

interface Reward {
    id: number;
    name: string;
    description: string;
    points: number;
    category: string;
    icon: typeof Gift;
    popular?: boolean;
}

const rewards: Reward[] = [
    {
        id: 1,
        name: "Amazon Gift Card",
        description: "₹100 Amazon shopping voucher",
        points: 500,
        category: "gift-cards",
        icon: ShoppingBag,
        popular: true,
    },
    {
        id: 2,
        name: "Starbucks Voucher",
        description: "Free coffee at any Starbucks outlet",
        points: 300,
        category: "food",
        icon: Coffee,
    },
    {
        id: 3,
        name: "Movie Ticket",
        description: "Single movie ticket at PVR/INOX",
        points: 400,
        category: "entertainment",
        icon: Ticket,
        popular: true,
    },
    {
        id: 4,
        name: "Flipkart Voucher",
        description: "₹200 Flipkart shopping credit",
        points: 1000,
        category: "gift-cards",
        icon: ShoppingBag,
    },
    {
        id: 5,
        name: "Uber Ride Credit",
        description: "₹150 Uber ride voucher",
        points: 750,
        category: "transport",
        icon: Zap,
    },
    {
        id: 6,
        name: "Swiggy Voucher",
        description: "₹100 food delivery credit",
        points: 500,
        category: "food",
        icon: Coffee,
        popular: true,
    },
    {
        id: 7,
        name: "Premium Membership",
        description: "1 month BinSmart premium access",
        points: 2000,
        category: "premium",
        icon: Star,
    },
    {
        id: 8,
        name: "Plant a Tree",
        description: "We plant a tree in your name",
        points: 250,
        category: "eco",
        icon: Gift,
    },
];

const categories = [
    { id: "all", name: "All Rewards" },
    { id: "gift-cards", name: "Gift Cards" },
    { id: "food", name: "Food & Drinks" },
    { id: "entertainment", name: "Entertainment" },
    { id: "eco", name: "Eco-Friendly" },
];

export default function RewardsPage() {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [redeeming, setRedeeming] = useState<number | null>(null);
    const [redeemed, setRedeemed] = useState<number[]>([]);

    // Mock user points
    const userPoints = 2450;

    const filteredRewards =
        selectedCategory === "all"
            ? rewards
            : rewards.filter((r) => r.category === selectedCategory);

    const handleRedeem = async (reward: Reward) => {
        if (userPoints < reward.points) return;

        setRedeeming(reward.id);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setRedeemed([...redeemed, reward.id]);
        setRedeeming(null);
    };

    return (
        <main className="min-h-screen">
            <Navbar />

            <div className="container mx-auto px-4 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            Rewards Store
                        </h1>
                        <p className="text-slate-400">
                            Redeem your points for exciting rewards
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 glass-card px-6 py-3 inline-flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20">
                            <Coins className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <div className="text-xs text-slate-400">Your Balance</div>
                            <div className="text-xl font-bold text-white">
                                {userPoints.toLocaleString()} pts
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Filters */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-4 px-4 md:mx-0 md:px-0">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategory(category.id)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                                selectedCategory === category.id
                                    ? "bg-emerald-500 text-black"
                                    : "glass-panel text-slate-300 hover:text-white hover:bg-white/10"
                            )}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Rewards Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredRewards.map((reward, index) => (
                        <motion.div
                            key={reward.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-card p-5 relative overflow-hidden group"
                        >
                            {reward.popular && (
                                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-xs font-semibold text-black">
                                    Popular
                                </div>
                            )}

                            {redeemed.includes(reward.id) && (
                                <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center z-10">
                                    <div className="text-center">
                                        <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-2" />
                                        <span className="text-white font-medium">Redeemed!</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
                                    <reward.icon className="h-6 w-6 text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white mb-1">{reward.name}</h3>
                                    <p className="text-sm text-slate-400">{reward.description}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                <div className="flex items-center gap-1.5">
                                    <Coins className="h-4 w-4 text-amber-400" />
                                    <span className="font-semibold text-white">
                                        {reward.points.toLocaleString()}
                                    </span>
                                    <span className="text-slate-400 text-sm">pts</span>
                                </div>

                                <button
                                    onClick={() => handleRedeem(reward)}
                                    disabled={
                                        userPoints < reward.points ||
                                        redeeming === reward.id ||
                                        redeemed.includes(reward.id)
                                    }
                                    className={cn(
                                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                        userPoints >= reward.points && !redeemed.includes(reward.id)
                                            ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                                            : "bg-slate-700 text-slate-500 cursor-not-allowed"
                                    )}
                                >
                                    {redeeming === reward.id ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            Redeeming
                                        </span>
                                    ) : userPoints < reward.points ? (
                                        "Insufficient"
                                    ) : (
                                        "Redeem"
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Empty State */}
                {filteredRewards.length === 0 && (
                    <div className="text-center py-12">
                        <Gift className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No rewards found in this category</p>
                    </div>
                )}

                {/* How to Earn Section */}
                <div className="mt-12 glass-card p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">
                        How to Earn More Points
                    </h2>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/20 flex-shrink-0">
                                <span className="text-emerald-400 text-lg">1</span>
                            </div>
                            <div>
                                <h3 className="font-medium text-white mb-1">Deposit E-Waste</h3>
                                <p className="text-sm text-slate-400">
                                    Earn 15-150 points per item based on type and weight
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-cyan-500/20 flex-shrink-0">
                                <span className="text-cyan-400 text-lg">2</span>
                            </div>
                            <div>
                                <h3 className="font-medium text-white mb-1">Daily Check-in</h3>
                                <p className="text-sm text-slate-400">
                                    Get 10 bonus points for daily app engagement
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20 flex-shrink-0">
                                <span className="text-purple-400 text-lg">3</span>
                            </div>
                            <div>
                                <h3 className="font-medium text-white mb-1">Refer Friends</h3>
                                <p className="text-sm text-slate-400">
                                    Earn 100 points for each successful referral
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
