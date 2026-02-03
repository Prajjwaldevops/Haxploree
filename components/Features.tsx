"use client";

import { motion } from "framer-motion";
import {
    Camera,
    MapPin,
    Gift,
    Cpu,
    Shield,
    Zap,
    Leaf,
    TrendingUp
} from "lucide-react";

const features = [
    {
        icon: Camera,
        title: "AI-Powered Detection",
        description: "Simply snap a photo of your e-waste. Our AI instantly identifies the item type and calculates your rewards.",
        color: "emerald",
    },
    {
        icon: MapPin,
        title: "Smart Bin Locator",
        description: "Find the nearest smart e-waste bin with real-time availability and fill-level status on an interactive map.",
        color: "cyan",
    },
    {
        icon: Gift,
        title: "Instant Rewards",
        description: "Earn points for every item you recycle. Redeem them for gift cards, discounts, and exclusive perks.",
        color: "purple",
    },
    {
        icon: Cpu,
        title: "IoT Connected",
        description: "Our bins are equipped with sensors that track fill levels and notify collection teams automatically.",
        color: "blue",
    },
    {
        icon: Shield,
        title: "Secure & Verified",
        description: "Every transaction is logged and verified. Your environmental impact is tracked and certified.",
        color: "orange",
    },
    {
        icon: Leaf,
        title: "Carbon Tracking",
        description: "See exactly how much CO₂ you've saved with each recycled item. Track your environmental footprint.",
        color: "green",
    },
];

const colorClasses: Record<string, { bg: string; text: string; glow: string }> = {
    emerald: { bg: "bg-emerald-500/20", text: "text-emerald-400", glow: "shadow-emerald-500/20" },
    cyan: { bg: "bg-cyan-500/20", text: "text-cyan-400", glow: "shadow-cyan-500/20" },
    purple: { bg: "bg-purple-500/20", text: "text-purple-400", glow: "shadow-purple-500/20" },
    blue: { bg: "bg-blue-500/20", text: "text-blue-400", glow: "shadow-blue-500/20" },
    orange: { bg: "bg-orange-500/20", text: "text-orange-400", glow: "shadow-orange-500/20" },
    green: { bg: "bg-green-500/20", text: "text-green-400", glow: "shadow-green-500/20" },
};

export default function Features() {
    return (
        <section id="features" className="py-20 md:py-28 relative">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-transparent -z-10" />

            <div className="container mx-auto px-4 lg:px-8">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="inline-block text-sm font-semibold text-emerald-400 mb-4 tracking-wider uppercase">
                        How It Works
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                        Recycling Made{" "}
                        <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                            Effortless
                        </span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg">
                        Our smart platform combines AI, IoT, and gamification to make e-waste
                        recycling fun, rewarding, and impactful.
                    </p>
                </motion.div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, index) => {
                        const colors = colorClasses[feature.color];
                        return (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="group glass-card p-6 hover:bg-white/5 transition-all duration-300 hover:shadow-xl"
                            >
                                <div
                                    className={`inline-flex p-3 rounded-xl ${colors.bg} ${colors.glow} shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}
                                >
                                    <feature.icon className={`h-6 w-6 ${colors.text}`} />
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Process Steps */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-20"
                >
                    <h3 className="text-2xl font-bold text-white text-center mb-12">
                        Three Simple Steps
                    </h3>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4">
                        {[
                            { step: 1, title: "Scan", desc: "Take a photo of your e-waste", icon: Camera },
                            { step: 2, title: "Drop", desc: "Find and use a smart bin", icon: MapPin },
                            { step: 3, title: "Earn", desc: "Get instant reward points", icon: TrendingUp },
                        ].map((item, index) => (
                            <div key={item.step} className="flex items-center">
                                <div className="flex flex-col items-center text-center">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                            <item.icon className="h-7 w-7 text-black" />
                                        </div>
                                        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center">
                                            {item.step}
                                        </span>
                                    </div>
                                    <h4 className="text-lg font-semibold text-white mt-4">{item.title}</h4>
                                    <p className="text-sm text-slate-400 mt-1">{item.desc}</p>
                                </div>
                                {index < 2 && (
                                    <div className="hidden md:block w-24 h-0.5 bg-gradient-to-r from-emerald-500/50 to-cyan-500/50 mx-4" />
                                )}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
