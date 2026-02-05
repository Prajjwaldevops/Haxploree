"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
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
    Bell,
    LogOut,
    Wrench,
    Recycle,
    Clock,
    X,
    Loader2,
    Monitor,
    Route,
    Search,
    Settings,
    Power,
    Truck,
    Navigation,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { BIT_SINDRI_CENTER, getFillLevelColor, MapBin } from "@/lib/mapbox";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

// Types
interface Stats {
    users: { total: number; growth: number };
    bins: { total: number; active: number; maintenance: number; full: number; avgFillLevel: number };
    transactions: { total: number; growth: number; weekly: number };
    points: { total: number; weekly: number };
    environment: { co2Saved: number; treesEquivalent: number };
    alerts: { critical: number; warning: number; bins: { id: string; name: string; fill_level: number }[] };
}

interface Alert {
    id: number;
    type: "critical" | "warning" | "info";
    title: string;
    message: string;
    binId?: string;
    timestamp: Date;
    dismissed: boolean;
}

type Tab = "overview" | "bins" | "routes" | "alerts";

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>("overview");
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<Stats | null>(null);
    const [bins, setBins] = useState<MapBin[]>([]);
    const [selectedBin, setSelectedBin] = useState<MapBin | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [viewState, setViewState] = useState({
        latitude: BIT_SINDRI_CENTER.latitude,
        longitude: BIT_SINDRI_CENTER.longitude,
        zoom: 12,
    });

    // Fetch dashboard data
    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [statsRes, binsRes] = await Promise.all([
                fetch("/api/admin/stats"),
                fetch("/api/admin/bins"),
            ]);

            const statsData = await statsRes.json();
            const binsData = await binsRes.json();

            if (statsData.success) {
                setStats(statsData.stats);
                // Generate alerts from high-fill bins
                const newAlerts: Alert[] = statsData.stats.alerts.bins.map((bin: { id: string; name: string; fill_level: number }, i: number) => ({
                    id: i + 1,
                    type: bin.fill_level >= 90 ? "critical" : "warning",
                    title: bin.fill_level >= 90 ? "Bin Full - Pickup Required" : "High Fill Level",
                    message: `${bin.name} at ${bin.fill_level}% capacity`,
                    binId: bin.id,
                    timestamp: new Date(),
                    dismissed: false,
                }));
                setAlerts(newAlerts);
            }

            if (binsData.success) {
                setBins(binsData.bins);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Update bin status/fill level
    const updateBin = async (binId: string, updates: Partial<MapBin>) => {
        setIsUpdating(binId);
        try {
            const response = await fetch("/api/admin/bins", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: binId, ...updates }),
            });

            if (response.ok) {
                setBins(prev => prev.map(b => b.id === binId ? { ...b, ...updates } : b));
            }
        } catch (error) {
            console.error("Error updating bin:", error);
        } finally {
            setIsUpdating(null);
        }
    };

    // Empty bin
    const emptyBin = async (binId: string) => {
        setIsUpdating(binId);
        try {
            await fetch("/api/admin/bins", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: binId, action: "empty" }),
            });
            await fetchData();
        } catch (error) {
            console.error("Error emptying bin:", error);
        } finally {
            setIsUpdating(null);
        }
    };

    const handleLogout = () => {
        document.cookie = "admin_session=; path=/; max-age=0";
        router.push("/admin-login");
    };

    const dismissAlert = (id: number) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
    };

    const filteredBins = bins.filter(bin =>
        bin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bin.bin_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getMarkerColor = (bin: MapBin) => {
        if (!bin.is_operational) return "#6b7280";
        if (bin.fill_level >= 90) return "#ef4444";
        if (bin.fill_level >= 70) return "#f59e0b";
        return "#10b981";
    };

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        { id: "overview", label: "Overview", icon: <Activity className="h-4 w-4" /> },
        { id: "bins", label: "Bin Management", icon: <Trash2 className="h-4 w-4" /> },
        { id: "routes", label: "Route Optimization", icon: <Route className="h-4 w-4" /> },
        { id: "alerts", label: "Alerts", icon: <Bell className="h-4 w-4" /> },
    ];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                    <p className="text-slate-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-50 glass-card border-b border-white/10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                            <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded">
                                BIT Sindri
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/smart-bin"
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 transition-colors"
                            >
                                <Monitor className="h-4 w-4" />
                                Smart Bin
                            </Link>
                            <button
                                onClick={fetchData}
                                className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                            >
                                <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-emerald-500 text-white"
                                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.id === "alerts" && alerts.filter(a => !a.dismissed).length > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                    {alerts.filter(a => !a.dismissed).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === "overview" && stats && (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                title="Total Users"
                                value={stats.users.total.toLocaleString()}
                                icon={<Users className="h-5 w-5" />}
                                trend={`+${stats.users.growth}%`}
                                color="emerald"
                            />
                            <StatCard
                                title="Active Bins"
                                value={`${stats.bins.active}/${stats.bins.total}`}
                                icon={<Trash2 className="h-5 w-5" />}
                                subtitle={`${stats.bins.maintenance} maintenance`}
                                color="blue"
                            />
                            <StatCard
                                title="Total Deposits"
                                value={stats.transactions.total.toLocaleString()}
                                icon={<Recycle className="h-5 w-5" />}
                                trend={`+${stats.transactions.growth}%`}
                                color="purple"
                            />
                            <StatCard
                                title="CO₂ Saved"
                                value={`${(stats.environment.co2Saved / 1000).toFixed(1)}kg`}
                                icon={<Activity className="h-5 w-5" />}
                                subtitle={`≈ ${stats.environment.treesEquivalent} trees`}
                                color="cyan"
                            />
                        </div>

                        {/* Map and Quick Stats */}
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Map */}
                            <div className="lg:col-span-2 glass-card overflow-hidden" style={{ height: "400px" }}>
                                {MAPBOX_TOKEN ? (
                                    <Map
                                        {...viewState}
                                        onMove={(evt) => setViewState(evt.viewState)}
                                        style={{ width: "100%", height: "100%" }}
                                        mapStyle="mapbox://styles/mapbox/dark-v11"
                                        mapboxAccessToken={MAPBOX_TOKEN}
                                    >
                                        <NavigationControl position="top-right" />
                                        {bins.map((bin) => (
                                            <Marker
                                                key={bin.id}
                                                latitude={bin.latitude}
                                                longitude={bin.longitude}
                                                anchor="bottom"
                                                onClick={() => setSelectedBin(bin)}
                                            >
                                                <div style={{ color: getMarkerColor(bin) }}>
                                                    <Trash2 className="h-6 w-6 cursor-pointer" fill="currentColor" />
                                                </div>
                                            </Marker>
                                        ))}
                                        {selectedBin && (
                                            <Popup
                                                latitude={selectedBin.latitude}
                                                longitude={selectedBin.longitude}
                                                anchor="top"
                                                onClose={() => setSelectedBin(null)}
                                            >
                                                <div className="p-2">
                                                    <h3 className="font-semibold text-gray-900">{selectedBin.name}</h3>
                                                    <p className="text-sm text-gray-600">{selectedBin.bin_code}</p>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${selectedBin.fill_level}%`,
                                                                    backgroundColor: getFillLevelColor(selectedBin.fill_level),
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-medium">{selectedBin.fill_level}%</span>
                                                    </div>
                                                </div>
                                            </Popup>
                                        )}
                                    </Map>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-slate-400">
                                        Mapbox token not configured
                                    </div>
                                )}
                            </div>

                            {/* Quick Stats */}
                            <div className="glass-card p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-white">Quick Stats</h3>
                                <div className="space-y-3">
                                    <QuickStat label="Avg Fill Level" value={`${stats.bins.avgFillLevel}%`} />
                                    <QuickStat label="Points Distributed" value={stats.points.total.toLocaleString()} />
                                    <QuickStat label="Weekly Deposits" value={stats.transactions.weekly.toString()} />
                                    <QuickStat label="Weekly Points" value={stats.points.weekly.toLocaleString()} />
                                    <QuickStat label="Critical Alerts" value={stats.alerts.critical.toString()} critical />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bin Management Tab */}
                {activeTab === "bins" && (
                    <div className="space-y-6">
                        {/* Search */}
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search bins..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>
                        </div>

                        {/* Bins Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredBins.map((bin) => (
                                <div key={bin.id} className="glass-card p-4 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-white">{bin.name}</h3>
                                            <p className="text-xs text-slate-400">{bin.bin_code}</p>
                                        </div>
                                        <span
                                            className={cn(
                                                "px-2 py-1 text-xs rounded capitalize",
                                                bin.status === "active" ? "bg-emerald-500/20 text-emerald-400" :
                                                    bin.status === "maintenance" ? "bg-amber-500/20 text-amber-400" :
                                                        "bg-red-500/20 text-red-400"
                                            )}
                                        >
                                            {bin.status}
                                        </span>
                                    </div>

                                    {/* Fill Level */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-400">Fill Level</span>
                                            <span className="text-white">{bin.fill_level}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${bin.fill_level}%`,
                                                    backgroundColor: getFillLevelColor(bin.fill_level),
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex gap-2 pt-2 border-t border-white/10">
                                        {/* Status Toggle */}
                                        <select
                                            value={bin.status}
                                            onChange={(e) => updateBin(bin.id, { status: e.target.value as MapBin["status"] })}
                                            disabled={isUpdating === bin.id}
                                            className="flex-1 px-2 py-1.5 text-xs rounded bg-white/10 text-white border-0 focus:ring-1 focus:ring-emerald-500"
                                        >
                                            <option value="active">Active</option>
                                            <option value="maintenance">Maintenance</option>
                                            <option value="offline">Offline</option>
                                        </select>

                                        {/* Operational Toggle */}
                                        <button
                                            onClick={() => updateBin(bin.id, { is_operational: !bin.is_operational })}
                                            disabled={isUpdating === bin.id}
                                            className={cn(
                                                "p-1.5 rounded",
                                                bin.is_operational ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                                            )}
                                            title={bin.is_operational ? "Operational" : "Not Operational"}
                                        >
                                            <Power className="h-4 w-4" />
                                        </button>

                                        {/* Empty Bin */}
                                        <button
                                            onClick={() => emptyBin(bin.id)}
                                            disabled={isUpdating === bin.id || bin.fill_level === 0}
                                            className="p-1.5 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50"
                                            title="Mark as Emptied"
                                        >
                                            {isUpdating === bin.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Route Optimization Tab */}
                {activeTab === "routes" && (
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Truck className="h-5 w-5 text-emerald-400" />
                                Optimized Pickup Route
                            </h3>

                            {/* Route Map */}
                            <div className="rounded-lg overflow-hidden mb-4" style={{ height: "400px" }}>
                                {MAPBOX_TOKEN ? (
                                    <Map
                                        {...viewState}
                                        onMove={evt => setViewState(evt.viewState)}
                                        style={{ width: "100%", height: "100%" }}
                                        mapStyle="mapbox://styles/mapbox/dark-v11"
                                        mapboxAccessToken={MAPBOX_TOKEN}
                                    >
                                        <NavigationControl position="top-right" />
                                        {/* Show bins that need pickup (>70% full) */}
                                        {bins
                                            .filter(b => b.fill_level >= 70)
                                            .sort((a, b) => b.fill_level - a.fill_level)
                                            .map((bin, index) => (
                                                <Marker
                                                    key={bin.id}
                                                    latitude={bin.latitude}
                                                    longitude={bin.longitude}
                                                    anchor="center"
                                                >
                                                    <div className="relative">
                                                        <div
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                                            style={{ backgroundColor: getFillLevelColor(bin.fill_level) }}
                                                        >
                                                            {index + 1}
                                                        </div>
                                                    </div>
                                                </Marker>
                                            ))
                                        }
                                    </Map>
                                ) : (
                                    <div className="h-full flex items-center justify-center bg-slate-800 text-slate-400">
                                        Mapbox token not configured
                                    </div>
                                )}
                            </div>

                            {/* Route Details */}
                            <div className="grid md:grid-cols-3 gap-4 mb-4">
                                <div className="p-4 rounded-lg bg-white/5">
                                    <p className="text-sm text-slate-400">Bins to Collect</p>
                                    <p className="text-2xl font-bold text-white">
                                        {bins.filter(b => b.fill_level >= 70).length}
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-white/5">
                                    <p className="text-sm text-slate-400">Estimated Distance</p>
                                    <p className="text-2xl font-bold text-white">
                                        {(bins.filter(b => b.fill_level >= 70).length * 1.5).toFixed(1)} km
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-white/5">
                                    <p className="text-sm text-slate-400">Estimated Time</p>
                                    <p className="text-2xl font-bold text-white">
                                        {Math.round(bins.filter(b => b.fill_level >= 70).length * 8)} min
                                    </p>
                                </div>
                            </div>

                            {/* Priority Queue */}
                            <h4 className="font-medium text-white mb-2">Priority Queue</h4>
                            <div className="space-y-2">
                                {bins
                                    .filter(b => b.fill_level >= 70)
                                    .sort((a, b) => b.fill_level - a.fill_level)
                                    .map((bin, index) => (
                                        <div
                                            key={bin.id}
                                            className="flex items-center gap-3 p-3 rounded-lg bg-white/5"
                                        >
                                            <span
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold"
                                                style={{ backgroundColor: getFillLevelColor(bin.fill_level), color: "white" }}
                                            >
                                                {index + 1}
                                            </span>
                                            <div className="flex-1">
                                                <p className="text-white font-medium">{bin.name}</p>
                                                <p className="text-xs text-slate-400">{bin.bin_code}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-medium">{bin.fill_level}%</p>
                                                <p className="text-xs text-slate-400">
                                                    {bin.fill_level >= 90 ? "Critical" : "High"}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                }
                                {bins.filter(b => b.fill_level >= 70).length === 0 && (
                                    <p className="text-center text-slate-400 py-4">
                                        No bins need immediate pickup
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Alerts Tab */}
                {activeTab === "alerts" && (
                    <div className="space-y-4">
                        {alerts.filter(a => !a.dismissed).length === 0 ? (
                            <div className="glass-card p-8 text-center">
                                <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
                                <p className="text-white font-medium">All Clear!</p>
                                <p className="text-slate-400">No active alerts at this time</p>
                            </div>
                        ) : (
                            alerts
                                .filter(a => !a.dismissed)
                                .map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={cn(
                                            "glass-card p-4 flex items-start gap-4 border-l-4",
                                            alert.type === "critical" ? "border-red-500" :
                                                alert.type === "warning" ? "border-amber-500" : "border-blue-500"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-full",
                                            alert.type === "critical" ? "bg-red-500/20 text-red-400" :
                                                alert.type === "warning" ? "bg-amber-500/20 text-amber-400" :
                                                    "bg-blue-500/20 text-blue-400"
                                        )}>
                                            <AlertTriangle className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-white">{alert.title}</h3>
                                            <p className="text-sm text-slate-400">{alert.message}</p>
                                        </div>
                                        <button
                                            onClick={() => dismissAlert(alert.id)}
                                            className="p-1 rounded hover:bg-white/10 text-slate-400"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({
    title,
    value,
    icon,
    trend,
    subtitle,
    color,
}: {
    title: string;
    value: string;
    icon: React.ReactNode;
    trend?: string;
    subtitle?: string;
    color: "emerald" | "blue" | "purple" | "cyan";
}) {
    const colorClasses = {
        emerald: "bg-emerald-500/20 text-emerald-400",
        blue: "bg-blue-500/20 text-blue-400",
        purple: "bg-purple-500/20 text-purple-400",
        cyan: "bg-cyan-500/20 text-cyan-400",
    };

    return (
        <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-3">
                <div className={cn("p-2 rounded-lg", colorClasses[color])}>
                    {icon}
                </div>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-slate-400">{title}</span>
                {trend && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {trend}
                    </span>
                )}
                {subtitle && (
                    <span className="text-xs text-slate-500">{subtitle}</span>
                )}
            </div>
        </div>
    );
}

// Quick Stat Component
function QuickStat({ label, value, critical }: { label: string; value: string; critical?: boolean }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm text-slate-400">{label}</span>
            <span className={cn("font-medium", critical && parseInt(value) > 0 ? "text-red-400" : "text-white")}>
                {value}
            </span>
        </div>
    );
}
