"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
    QrCode,
    Check,
    AlertTriangle,
    Recycle,
    Leaf,
    Loader2,
    Wrench,
    Coins,
    Camera,
    ArrowLeft,
    Star,
    Zap,
    Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import { MapBin, getFillLevelColor } from "@/lib/mapbox";

// Types
type ScreenState = "scan" | "scanning" | "deposit" | "complete" | "report";

interface DepositResult {
    itemType: string;
    weight: number;
    points: number;
    co2Saved: number;
}

// Mock e-waste items for simulation
const mockItems = [
    { type: "Smartphone", weight: 0.18, points: 50, co2: 2.5 },
    { type: "Tablet", weight: 0.45, points: 75, co2: 4.2 },
    { type: "Laptop Battery", weight: 0.35, points: 60, co2: 3.8 },
    { type: "Charger", weight: 0.12, points: 25, co2: 1.2 },
    { type: "Earphones", weight: 0.05, points: 15, co2: 0.6 },
    { type: "Power Bank", weight: 0.25, points: 40, co2: 2.1 },
];

export default function SmartBinPage() {
    const router = useRouter();
    const { user, isLoaded } = useUser();

    // State
    const [screen, setScreen] = useState<ScreenState>("scan");
    const [currentBin, setCurrentBin] = useState<MapBin | null>(null);
    const [isLoadingBin, setIsLoadingBin] = useState(false);
    const [depositResult, setDepositResult] = useState<DepositResult | null>(null);
    const [depositProgress, setDepositProgress] = useState(0);
    const [userPoints, setUserPoints] = useState(0);
    const [isUpdatingPoints, setIsUpdatingPoints] = useState(false);

    // Report form state
    const [reportFillLevel, setReportFillLevel] = useState(50);
    const [reportStatus, setReportStatus] = useState<"operational" | "maintenance">("operational");
    const [isSubmittingReport, setIsSubmittingReport] = useState(false);
    const [reportSuccess, setReportSuccess] = useState(false);

    // Redirect if not authenticated
    useEffect(() => {
        if (isLoaded && !user) {
            router.push("/sign-in");
        }
    }, [isLoaded, user, router]);

    // Fetch user points
    useEffect(() => {
        if (user) {
            fetchUserPoints();
        }
    }, [user]);

    const fetchUserPoints = async () => {
        try {
            const res = await fetch("/api/user/stats");
            const data = await res.json();
            if (data.success) {
                setUserPoints(data.stats.total_points || 0);
            }
        } catch (error) {
            console.error("Failed to fetch points:", error);
        }
    };

    // Simulate QR scan - in real app this would use camera
    const simulateScan = async () => {
        setScreen("scanning");
        setIsLoadingBin(true);

        // Simulate scanning delay
        await new Promise((r) => setTimeout(r, 2000));

        // Fetch a random bin or create mock
        try {
            const res = await fetch("/api/admin/bins");
            const data = await res.json();
            if (data.success && data.bins.length > 0) {
                // Pick a random bin
                const randomBin = data.bins[Math.floor(Math.random() * data.bins.length)];
                setCurrentBin(randomBin);
            } else {
                // Mock bin if no bins in DB
                setCurrentBin({
                    id: "mock-bin-1",
                    bin_code: "BIT-001",
                    name: "Smart Bin #1",
                    address: "BIT Sindri Campus",
                    latitude: 23.6693,
                    longitude: 86.4142,
                    fill_level: 45,
                    status: "active",
                    is_operational: true,
                    accepted_items: ["phones", "batteries", "chargers"],
                });
            }
        } catch {
            // Mock bin on error
            setCurrentBin({
                id: "mock-bin-1",
                bin_code: "BIT-001",
                name: "Smart Bin #1",
                address: "BIT Sindri Campus",
                latitude: 23.6693,
                longitude: 86.4142,
                fill_level: 45,
                status: "active",
                is_operational: true,
                accepted_items: ["phones", "batteries", "chargers"],
            });
        } finally {
            setIsLoadingBin(false);
            setScreen("deposit");
        }
    };

    // Simulate deposit process
    const simulateDeposit = async () => {
        setDepositProgress(0);

        // Animate progress
        for (let i = 0; i <= 100; i += 10) {
            await new Promise((r) => setTimeout(r, 200));
            setDepositProgress(i);
        }

        // Generate random result
        const item = mockItems[Math.floor(Math.random() * mockItems.length)];
        const result: DepositResult = {
            itemType: item.type,
            weight: item.weight,
            points: item.points,
            co2Saved: item.co2,
        };

        setDepositResult(result);

        // Update points in Supabase
        await updateUserPoints(result.points);

        setScreen("complete");
    };

    // Update user points in Supabase
    const updateUserPoints = async (earnedPoints: number) => {
        if (!user) return;
        setIsUpdatingPoints(true);

        try {
            const res = await fetch("/api/user/points", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ points: earnedPoints }),
            });
            const data = await res.json();
            if (data.success) {
                setUserPoints((prev) => prev + earnedPoints);
            }
        } catch (error) {
            console.error("Failed to update points:", error);
        } finally {
            setIsUpdatingPoints(false);
        }
    };

    // Submit bin report
    const submitReport = async () => {
        if (!currentBin) return;
        setIsSubmittingReport(true);

        try {
            const res = await fetch("/api/admin/bins", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: currentBin.id,
                    fill_level: reportFillLevel,
                    status: reportStatus === "operational" ? "active" : "maintenance",
                }),
            });
            const data = await res.json();
            if (data.success) {
                // Award bonus points for reporting
                await updateUserPoints(10);
                setReportSuccess(true);
                setTimeout(() => {
                    setScreen("scan");
                    setReportSuccess(false);
                    setCurrentBin(null);
                }, 2000);
            }
        } catch (error) {
            console.error("Failed to submit report:", error);
        } finally {
            setIsSubmittingReport(false);
        }
    };

    if (!isLoaded) {
        return (
            <main className="min-h-screen">
                <Navbar />
                <div className="min-h-[80vh] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 text-slate-400" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Smart Bin</h1>
                            <p className="text-sm text-slate-400">Scan, deposit, earn points</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20">
                        <Coins className="h-5 w-5 text-amber-400" />
                        <span className="font-bold text-amber-400">{userPoints}</span>
                        <span className="text-amber-400/70 text-sm">pts</span>
                    </div>
                </div>

                {/* Scan Screen */}
                {screen === "scan" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md mx-auto"
                    >
                        <div className="glass-card p-8 text-center">
                            <div className="w-24 h-24 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                                <QrCode className="h-12 w-12 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Scan Bin QR Code</h2>
                            <p className="text-slate-400 mb-8">
                                Point your camera at the QR code on the smart bin to start depositing e-waste
                            </p>
                            <button
                                onClick={simulateScan}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                            >
                                <Camera className="h-5 w-5" />
                                Scan QR Code
                            </button>
                        </div>

                        <div className="mt-6 glass-card p-4">
                            <h3 className="text-sm font-medium text-white mb-3">How it works</h3>
                            <div className="space-y-3">
                                {[
                                    { icon: QrCode, text: "Scan the QR code on the smart bin" },
                                    { icon: Recycle, text: "Deposit your e-waste item" },
                                    { icon: Coins, text: "Earn points automatically" },
                                ].map((step, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                            <step.icon className="h-4 w-4 text-emerald-400" />
                                        </div>
                                        <span className="text-sm text-slate-300">{step.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Scanning Screen */}
                {screen === "scanning" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="max-w-md mx-auto"
                    >
                        <div className="glass-card p-8 text-center">
                            <div className="relative w-48 h-48 mx-auto mb-6">
                                <div className="absolute inset-0 border-2 border-emerald-400 rounded-xl" />
                                <motion.div
                                    animate={{ y: [0, 180, 0] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-lg shadow-emerald-500/50"
                                />
                            </div>
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-400 mx-auto mb-4" />
                            <p className="text-slate-300">Scanning QR code...</p>
                        </div>
                    </motion.div>
                )}

                {/* Deposit Screen */}
                {screen === "deposit" && currentBin && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md mx-auto space-y-6"
                    >
                        {/* Bin Info */}
                        <div className="glass-card p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-white">{currentBin.name}</h3>
                                    <p className="text-xs text-slate-400">{currentBin.bin_code}</p>
                                </div>
                                <span
                                    className={cn(
                                        "px-2 py-1 text-xs rounded-full font-medium",
                                        currentBin.is_operational
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : "bg-amber-500/20 text-amber-400"
                                    )}
                                >
                                    {currentBin.is_operational ? "Operational" : "Maintenance"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm text-slate-400">Fill Level:</span>
                                <span className="text-white font-medium">{currentBin.fill_level}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${currentBin.fill_level}%`,
                                        backgroundColor: getFillLevelColor(currentBin.fill_level),
                                    }}
                                />
                            </div>
                        </div>

                        {/* Deposit Button */}
                        {depositProgress === 0 ? (
                            <button
                                onClick={simulateDeposit}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold text-lg hover:opacity-90 transition-opacity"
                            >
                                Start Deposit
                            </button>
                        ) : (
                            <div className="glass-card p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-slate-400">Processing...</span>
                                    <span className="text-white font-medium">{depositProgress}%</span>
                                </div>
                                <div className="h-3 rounded-full bg-slate-700 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${depositProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Report Issue Button */}
                        <button
                            onClick={() => setScreen("report")}
                            className="w-full py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Flag className="h-4 w-4" />
                            Report Bin Status (+10 pts)
                        </button>
                    </motion.div>
                )}

                {/* Complete Screen */}
                {screen === "complete" && depositResult && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md mx-auto"
                    >
                        <div className="glass-card p-8 text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", duration: 0.5 }}
                                className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6"
                            >
                                <Check className="h-10 w-10 text-emerald-400" />
                            </motion.div>
                            <h2 className="text-2xl font-bold text-white mb-2">Deposit Complete!</h2>
                            <p className="text-slate-400 mb-6">Thank you for recycling</p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="glass-card p-4">
                                    <p className="text-sm text-slate-400 mb-1">Item</p>
                                    <p className="font-semibold text-white">{depositResult.itemType}</p>
                                </div>
                                <div className="glass-card p-4">
                                    <p className="text-sm text-slate-400 mb-1">Weight</p>
                                    <p className="font-semibold text-white">{depositResult.weight} kg</p>
                                </div>
                            </div>

                            <div className="glass-card p-5 mb-6 bg-amber-500/10 border-amber-500/30">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <Star className="h-5 w-5 text-amber-400" />
                                    <span className="text-2xl font-bold text-amber-400">+{depositResult.points}</span>
                                    <span className="text-amber-400/70">points</span>
                                </div>
                                <p className="text-sm text-slate-400">
                                    CO₂ saved: <span className="text-emerald-400">{depositResult.co2Saved} kg</span>
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setScreen("scan");
                                        setDepositResult(null);
                                        setDepositProgress(0);
                                        setCurrentBin(null);
                                    }}
                                    className="flex-1 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                                >
                                    Scan Another
                                </button>
                                <button
                                    onClick={() => router.push("/rewards")}
                                    className="flex-1 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-semibold transition-colors"
                                >
                                    View Rewards
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Report Screen */}
                {screen === "report" && currentBin && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-md mx-auto"
                    >
                        <div className="glass-card p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Report Bin Status</h2>
                            <p className="text-sm text-slate-400 mb-6">
                                Help us maintain bins by reporting their current status. Earn <span className="text-amber-400">+10 points</span>!
                            </p>

                            {reportSuccess ? (
                                <div className="text-center py-8">
                                    <Check className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                                    <p className="text-white font-medium">Report submitted!</p>
                                    <p className="text-sm text-amber-400">+10 points earned</p>
                                </div>
                            ) : (
                                <>
                                    {/* Fill Level */}
                                    <div className="mb-6">
                                        <label className="block text-sm text-slate-400 mb-2">
                                            Estimated Fill Level: <span className="text-white font-medium">{reportFillLevel}%</span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={reportFillLevel}
                                            onChange={(e) => setReportFillLevel(parseInt(e.target.value))}
                                            className="w-full accent-emerald-500"
                                        />
                                        <div className="h-2 rounded-full bg-slate-700 overflow-hidden mt-2">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${reportFillLevel}%`,
                                                    backgroundColor: getFillLevelColor(reportFillLevel),
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div className="mb-6">
                                        <label className="block text-sm text-slate-400 mb-3">Bin Status</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setReportStatus("operational")}
                                                className={cn(
                                                    "p-4 rounded-lg border-2 transition-colors flex flex-col items-center gap-2",
                                                    reportStatus === "operational"
                                                        ? "border-emerald-500 bg-emerald-500/20"
                                                        : "border-white/10 hover:border-white/20"
                                                )}
                                            >
                                                <Check className="h-5 w-5 text-emerald-400" />
                                                <span className="text-sm text-white">Operational</span>
                                            </button>
                                            <button
                                                onClick={() => setReportStatus("maintenance")}
                                                className={cn(
                                                    "p-4 rounded-lg border-2 transition-colors flex flex-col items-center gap-2",
                                                    reportStatus === "maintenance"
                                                        ? "border-amber-500 bg-amber-500/20"
                                                        : "border-white/10 hover:border-white/20"
                                                )}
                                            >
                                                <Wrench className="h-5 w-5 text-amber-400" />
                                                <span className="text-sm text-white">Needs Repair</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setScreen("deposit")}
                                            className="flex-1 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={submitReport}
                                            disabled={isSubmittingReport}
                                            className="flex-1 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isSubmittingReport ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Zap className="h-4 w-4" />
                                                    Submit Report
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
