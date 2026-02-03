"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Users,
    Trash2,
    Activity,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    XCircle,
    RefreshCw,
    MapPin,
    Coins,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

// Mock data - in production would come from Supabase
const mockBins = [
    { id: 1, name: "Central Plaza Bin", location: "Downtown", fillLevel: 78, status: "active" },
    { id: 2, name: "Tech Park Bin", location: "IT Hub", fillLevel: 45, status: "active" },
    { id: 3, name: "University Bin", location: "Campus", fillLevel: 92, status: "full" },
    { id: 4, name: "Mall Entrance Bin", location: "City Mall", fillLevel: 23, status: "active" },
    { id: 5, name: "Station Bin", location: "Railway Station", fillLevel: 67, status: "maintenance" },
];

const mockStats = {
    totalUsers: 10432,
    totalBins: 247,
    totalTransactions: 52891,
    totalCO2Saved: 15420,
    activeToday: 342,
    pointsDistributed: 1250000,
};

export default function AdminDashboard() {
    const [bins, setBins] = useState(mockBins);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsRefreshing(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active":
                return "text-emerald-400 bg-emerald-500/20";
            case "full":
                return "text-red-400 bg-red-500/20";
            case "maintenance":
                return "text-yellow-400 bg-yellow-500/20";
            default:
                return "text-slate-400 bg-slate-500/20";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "active":
                return CheckCircle;
            case "full":
                return XCircle;
            case "maintenance":
                return AlertTriangle;
            default:
                return Activity;
        }
    };

    const getFillLevelColor = (level: number) => {
        if (level >= 80) return "bg-red-500";
        if (level >= 60) return "bg-yellow-500";
        return "bg-emerald-500";
    };

    return (
        <main className="min-h-screen">
            <Navbar />

            <div className="container mx-auto px-4 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                            <span className="text-red-400">⚡</span>
                            Admin Command Center
                        </h1>
                        <p className="text-slate-400">
                            Monitor and manage the BinSmart network
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className={cn(
                            "mt-4 md:mt-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors",
                            isRefreshing && "opacity-50 pointer-events-none"
                        )}
                    >
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                        Refresh Data
                    </button>
                </div>

                {/* System Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                            <Users className="h-4 w-4" />
                            Total Users
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {mockStats.totalUsers.toLocaleString()}
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                            <Trash2 className="h-4 w-4" />
                            Active Bins
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {mockStats.totalBins}
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                            <Activity className="h-4 w-4" />
                            Transactions
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {mockStats.totalTransactions.toLocaleString()}
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                            <TrendingUp className="h-4 w-4" />
                            CO₂ Saved (kg)
                        </div>
                        <div className="text-2xl font-bold text-emerald-400">
                            {mockStats.totalCO2Saved.toLocaleString()}
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                            <Users className="h-4 w-4" />
                            Active Today
                        </div>
                        <div className="text-2xl font-bold text-cyan-400">
                            {mockStats.activeToday}
                        </div>
                    </div>
                    <div className="glass-card p-4">
                        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                            <Coins className="h-4 w-4" />
                            Points Distributed
                        </div>
                        <div className="text-2xl font-bold text-purple-400">
                            {(mockStats.pointsDistributed / 1000).toFixed(0)}K
                        </div>
                    </div>
                </div>

                {/* Live Bin Status */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        Live Bin Status
                    </h2>
                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">
                                            Bin Name
                                        </th>
                                        <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">
                                            Location
                                        </th>
                                        <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">
                                            Fill Level
                                        </th>
                                        <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">
                                            Status
                                        </th>
                                        <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bins.map((bin) => {
                                        const StatusIcon = getStatusIcon(bin.status);
                                        return (
                                            <tr
                                                key={bin.id}
                                                className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-slate-800">
                                                            <Trash2 className="h-4 w-4 text-emerald-400" />
                                                        </div>
                                                        <span className="font-medium text-white">{bin.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-300">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-slate-500" />
                                                        {bin.location}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 max-w-[100px] h-2 bg-slate-700 rounded-full overflow-hidden">
                                                            <div
                                                                className={cn(
                                                                    "h-full rounded-full transition-all duration-500",
                                                                    getFillLevelColor(bin.fillLevel)
                                                                )}
                                                                style={{ width: `${bin.fillLevel}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-sm text-slate-300">
                                                            {bin.fillLevel}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium capitalize",
                                                            getStatusColor(bin.status)
                                                        )}
                                                    >
                                                        <StatusIcon className="h-3 w-3" />
                                                        {bin.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Alerts Section */}
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4">System Alerts</h2>
                    <div className="space-y-3">
                        <div className="glass-card p-4 border-l-4 border-red-500">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-medium text-white">University Bin is Full</div>
                                    <div className="text-sm text-slate-400">
                                        Bin at Campus location has reached 92% capacity. Schedule pickup.
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="glass-card p-4 border-l-4 border-yellow-500">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-medium text-white">Station Bin Under Maintenance</div>
                                    <div className="text-sm text-slate-400">
                                        Bin at Railway Station is currently offline for scheduled maintenance.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
