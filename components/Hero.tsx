"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Hero() {
    const { isSignedIn } = useUser();

    return (
        <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] -z-10" />
            <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] -z-10" />

            <div className="container mx-auto px-4 lg:px-8 text-center">
                {/* Marquee Credit Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-8 inline-flex overflow-hidden rounded-full border border-white/10 bg-white/5 backdrop-blur-sm py-2 px-2 max-w-sm mx-auto"
                >
                    <div className="flex animate-marquee whitespace-nowrap">
                        <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400 mx-4 flex items-center gap-2">
                            <Sparkles className="h-3 w-3" />
                            POWERED BY TEAM ANTIGRAVITY • HAXPLORE 2025 • TEAM ANTIGRAVITY
                            <Sparkles className="h-3 w-3" />
                        </span>
                        <span className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400 mx-4 flex items-center gap-2">
                            <Sparkles className="h-3 w-3" />
                            POWERED BY TEAM ANTIGRAVITY • HAXPLORE 2025 • TEAM ANTIGRAVITY
                            <Sparkles className="h-3 w-3" />
                        </span>
                    </div>
                </motion.div>

                {/* Main Heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight"
                >
                    Recycle Smart.
                    <br />
                    <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        Earn Rewards.
                    </span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed"
                >
                    BinSmart uses AI to identify your e-waste, find nearby smart bins, and reward
                    you instantly with points. Join the sustainable revolution today.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
                >
                    <Link
                        href={isSignedIn ? "/dashboard" : "/sign-in"}
                        className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold px-8 py-4 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.6)] transition-all duration-300 transform hover:-translate-y-1"
                    >
                        Get Started
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        href="#features"
                        className="glass-panel inline-flex items-center justify-center text-white px-8 py-4 rounded-full hover:bg-white/10 transition-colors font-medium"
                    >
                        Learn More
                    </Link>
                </motion.div>

                {/* Stats Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
                >
                    {[
                        { value: "10K+", label: "Users" },
                        { value: "50K+", label: "Items Recycled" },
                        { value: "200+", label: "Smart Bins" },
                        { value: "15T", label: "CO₂ Saved" },
                    ].map((stat, index) => (
                        <div
                            key={stat.label}
                            className="glass-card p-4 text-center"
                        >
                            <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                            <div className="text-xs md:text-sm text-slate-400 mt-1">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
