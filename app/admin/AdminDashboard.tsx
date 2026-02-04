"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import {
    Users,
    Trash2,
    Activity,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    XCircle,
    RefreshCw,
    MapPin,
    Coins,
    Bell,
    LogOut,
    Wrench,
    DollarSign,
    Recycle,
    Clock,
    X,
    Loader2,
    Monitor,
    Route,
    Search,
    Filter,
    Shield,
    Wifi,
    WifiOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Types
interface Bin {
    id: number;
    name: string;
    location: string;
    address: string;
    lat: number;
    lng: number;
    fillLevel: number;
    status: "active" | "full" | "maintenance";
    lastUpdated: string;
    acceptedItems: string[];
}

interface Alert {
    id: number;
    type: "critical" | "warning" | "info";
    title: string;
    message: string;
    binId?: number;
    timestamp: Date;
    dismissed: boolean;
}

// Mock data
const mockBins: Bin[] = [
    {
        id: 1,
        name: "Central Plaza Bin",
        location: "Downtown",
        address: "123 Main Street, Downtown",
        lat: 28.6139,
        lng: 77.209,
        fillLevel: 78,
        status: "active",
        lastUpdated: "2 mins ago",
        acceptedItems: ["Smartphones", "Tablets", "Batteries"],
    },
    {
        id: 2,
        name: "Tech Park Bin",
        location: "IT Hub",
        address: "456 IT Hub Road, Sector 5",
        lat: 28.6229,
        lng: 77.219,
        fillLevel: 45,
        status: "active",
        lastUpdated: "5 mins ago",
        acceptedItems: ["Laptops", "Monitors", "Keyboards"],
    },
    {
        id: 3,
        name: "University Bin",
        location: "Campus",
        address: "University Main Gate",
        lat: 28.6039,
        lng: 77.199,
        fillLevel: 92,
        status: "full",
        lastUpdated: "1 min ago",
        acceptedItems: ["All E-Waste Types"],
    },
    {
        id: 4,
        name: "Mall Entrance Bin",
        location: "City Mall",
        address: "City Mall, Ground Floor",
        lat: 28.6189,
        lng: 77.229,
        fillLevel: 23,
        status: "active",
        lastUpdated: "10 mins ago",
        acceptedItems: ["Small Electronics", "Cables"],
    },
    {
        id: 5,
        name: "Station Bin",
        location: "Railway Station",
        address: "Central Railway Station",
        lat: 28.6089,
        lng: 77.219,
        fillLevel: 67,
        status: "maintenance",
        lastUpdated: "30 mins ago",
        acceptedItems: ["Under Maintenance"],
    },
    {
        id: 6,
        name: "Hospital Complex Bin",
        location: "Medical District",
        address: "City Hospital Road",
        lat: 28.6159,
        lng: 77.239,
        fillLevel: 55,
        status: "active",
        lastUpdated: "7 mins ago",
        acceptedItems: ["Medical Devices", "Electronics"],
    },
];

const mockAlerts: Alert[] = [
    {
        id: 1,
        type: "critical",
        title: "Bin Full - Immediate Pickup Required",
        message: "University Bin at Campus has reached 92% capacity",
        binId: 3,
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        dismissed: false,
    },
    {
        id: 2,
        type: "warning",
        title: "Bin Under Maintenance",
        message: "Station Bin at Railway Station is offline for scheduled maintenance",
        binId: 5,
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        dismissed: false,
    },
    {
        id: 3,
        type: "warning",
        title: "High Fill Level Warning",
        message: "Central Plaza Bin approaching capacity (78%)",
        binId: 1,
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        dismissed: false,
    },
    {
        id: 4,
        type: "info",
        title: "Scheduled Pickup Complete",
        message: "Tech Park Bin pickup completed successfully",
        binId: 2,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        dismissed: false,
    },
];

const mockStats = {
    totalUsers: 10432,
    totalBins: 247,
    totalTransactions: 52891,
    totalWasteCollected: 15420,
    estimatedValue: 245800,
    activeToday: 342,
    depositsToday: 156,
    pointsDistributed: 1250000,
    weeklyGrowth: 12.5,
    userEngagement: 78.3,
};

// Map configuration
const mapContainerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 28.6139, lng: 77.209 };
const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    styles: [
        { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
        { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
    ],
};

export default function AdminDashboard() {
    const [bins, setBins] = useState(mockBins);
    const [alerts, setAlerts] = useState(mockAlerts);
    const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "bins" | "alerts" | "analytics" | "routes">("overview");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "full" | "maintenance">("all");
    const [isOnline, setIsOnline] = useState(true);
    const router = useRouter();

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    });

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsRefreshing(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("adminSession");
        router.push("/admin-login");
    };

    const dismissAlert = (alertId: number) => {
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, dismissed: true } : a)));
    };

    const getMarkerIcon = (bin: Bin) => {
        let color = "#10b981";
        if (bin.status === "full") color = "#ef4444";
        else if (bin.status === "maintenance") color = "#f59e0b";
        else if (bin.fillLevel > 70) color = "#f59e0b";

        return {
            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
            fillColor: color,
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
            scale: 2,
            anchor: { x: 12, y: 24 } as google.maps.Point,
        };
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "text-emerald-400 bg-emerald-500/20";
            case "full": return "text-red-400 bg-red-500/20";
            case "maintenance": return "text-yellow-400 bg-yellow-500/20";
            default: return "text-slate-400 bg-slate-500/20";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "active": return CheckCircle;
            case "full": return XCircle;
            case "maintenance": return Wrench;
            default: return Activity;
        }
    };

    const getFillLevelColor = (level: number) => {
        if (level >= 80) return "bg-red-500";
        if (level >= 60) return "bg-yellow-500";
        return "bg-emerald-500";
    };

    const getAlertColor = (type: string) => {
        switch (type) {
            case "critical": return "border-red-500 bg-red-500/10";
            case "warning": return "border-yellow-500 bg-yellow-500/10";
            case "info": return "border-blue-500 bg-blue-500/10";
            default: return "border-slate-500 bg-slate-500/10";
        }
    };

    const getAlertIcon = (type: string) => {
        switch (type) {
            case "critical": return <XCircle className="h-5 w-5 text-red-400" />;
            case "warning": return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
            case "info": return <CheckCircle className="h-5 w-5 text-blue-400" />;
            default: return <Bell className="h-5 w-5 text-slate-400" />;
        }
    };

    const activeAlerts = alerts.filter((a) => !a.dismissed);
    const criticalCount = activeAlerts.filter((a) => a.type === "critical").length;

    return (
        <main className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-50 glass-panel border-b border-white/10">
                <div className="container mx-auto px-4 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
                                    <Recycle className="h-6 w-6 text-emerald-400" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Admin Command Center</h1>
                                    <p className="text-xs text-slate-400">BinSmart Network Dashboard</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Alert Badge */}
                            {criticalCount > 0 && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                    </span>
                                    <span className="text-red-400 text-sm font-medium">{criticalCount} Critical</span>
                                </div>
                            )}

                            {/* Smart Bin Interface */}
                            <Link
                                href="/smart-bin"
                                target="_blank"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/30 text-emerald-400 transition-all"
                            >
                                <Monitor className="h-4 w-4" />
                                <span className="hidden sm:inline">Smart Bin</span>
                            </Link>

                            {/* Refresh */}
                            <button
                                onClick={handleRefresh}
                                className={cn(
                                    "p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors",
                                    isRefreshing && "opacity-50 pointer-events-none"
                                )}
                            >
                                <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
                            </button>

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {[
                            { id: "overview", label: "Overview", icon: Activity },
                            { id: "bins", label: "Bin Monitoring", icon: Trash2 },
                            { id: "alerts", label: "Alerts", icon: Bell, badge: activeAlerts.length },
                            { id: "analytics", label: "Analytics", icon: TrendingUp },
                            { id: "routes", label: "Route Optimization", icon: Route },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : "text-slate-400 hover:text-white hover:bg-white/10"
                                )}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                                {tab.badge !== undefined && tab.badge > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-medium">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 lg:px-8 py-6">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard
                                icon={Trash2}
                                label="Active Bins"
                                value={mockStats.totalBins}
                                color="emerald"
                            />
                            <StatCard
                                icon={Users}
                                label="Active Users Today"
                                value={mockStats.activeToday}
                                trend={mockStats.weeklyGrowth}
                                color="cyan"
                            />
                            <StatCard
                                icon={Recycle}
                                label="Waste Collected"
                                value={`${(mockStats.totalWasteCollected / 1000).toFixed(1)}T`}
                                suffix="kg"
                                color="purple"
                            />
                            <StatCard
                                icon={DollarSign}
                                label="Estimated Value"
                                value={`$${(mockStats.estimatedValue / 1000).toFixed(1)}K`}
                                color="yellow"
                            />
                        </div>

                        {/* Map & Recent Alerts */}
                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Map */}
                            <div className="lg:col-span-2 glass-card overflow-hidden" style={{ height: "450px" }}>
                                <div className="p-4 border-b border-white/10">
                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-emerald-400" />
                                        Geographic Overview
                                    </h2>
                                </div>
                                <div className="h-[calc(100%-60px)]">
                                    {loadError ? (
                                        <div className="h-full flex items-center justify-center">
                                            <p className="text-slate-400">Failed to load map</p>
                                        </div>
                                    ) : !isLoaded ? (
                                        <div className="h-full flex items-center justify-center">
                                            <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                                        </div>
                                    ) : (
                                        <GoogleMap
                                            mapContainerStyle={mapContainerStyle}
                                            center={defaultCenter}
                                            zoom={12}
                                            options={mapOptions}
                                        >
                                            {bins.map((bin) => (
                                                <Marker
                                                    key={bin.id}
                                                    position={{ lat: bin.lat, lng: bin.lng }}
                                                    icon={getMarkerIcon(bin)}
                                                    onClick={() => setSelectedBin(bin)}
                                                />
                                            ))}

                                            {selectedBin && (
                                                <InfoWindow
                                                    position={{ lat: selectedBin.lat, lng: selectedBin.lng }}
                                                    onCloseClick={() => setSelectedBin(null)}
                                                >
                                                    <div className="p-2 min-w-[200px]">
                                                        <h3 className="font-semibold text-slate-900 mb-1">
                                                            {selectedBin.name}
                                                        </h3>
                                                        <p className="text-sm text-slate-600 mb-2">
                                                            {selectedBin.address}
                                                        </p>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-xs text-slate-500">Status:</span>
                                                            <span className={cn(
                                                                "px-2 py-0.5 rounded-full text-xs capitalize",
                                                                selectedBin.status === "active" ? "bg-emerald-100 text-emerald-700" :
                                                                    selectedBin.status === "full" ? "bg-red-100 text-red-700" :
                                                                        "bg-yellow-100 text-yellow-700"
                                                            )}>
                                                                {selectedBin.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-slate-500">Fill:</span>
                                                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                <div
                                                                    className={cn("h-full rounded-full", getFillLevelColor(selectedBin.fillLevel))}
                                                                    style={{ width: `${selectedBin.fillLevel}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-medium text-slate-700">
                                                                {selectedBin.fillLevel}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </InfoWindow>
                                            )}
                                        </GoogleMap>
                                    )}
                                </div>
                            </div>

                            {/* Recent Alerts */}
                            <div className="glass-card overflow-hidden">
                                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <Bell className="h-5 w-5 text-red-400" />
                                        Active Alerts
                                    </h2>
                                    <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">
                                        {activeAlerts.length}
                                    </span>
                                </div>
                                <div className="p-4 space-y-3 max-h-[370px] overflow-y-auto">
                                    <AnimatePresence>
                                        {activeAlerts.length === 0 ? (
                                            <div className="text-center py-8 text-slate-400">
                                                <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                <p>No active alerts</p>
                                            </div>
                                        ) : (
                                            activeAlerts.map((alert) => (
                                                <motion.div
                                                    key={alert.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 20 }}
                                                    className={cn(
                                                        "p-3 rounded-lg border-l-4",
                                                        getAlertColor(alert.type)
                                                    )}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {getAlertIcon(alert.type)}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-white text-sm truncate">
                                                                {alert.title}
                                                            </p>
                                                            <p className="text-xs text-slate-400 mt-0.5">
                                                                {alert.message}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => dismissAlert(alert.id)}
                                                            className="p-1 hover:bg-white/10 rounded"
                                                        >
                                                            <X className="h-4 w-4 text-slate-400" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Map Legend */}
                        <div className="glass-card p-4">
                            <h3 className="text-sm font-medium text-slate-400 mb-3">Map Legend</h3>
                            <div className="flex flex-wrap gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-emerald-500" />
                                    <span className="text-sm text-slate-300">Active (Low Fill)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-yellow-500" />
                                    <span className="text-sm text-slate-300">Warning (High Fill / Maintenance)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-red-500" />
                                    <span className="text-sm text-slate-300">Critical (Full)</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Bins Tab */}
                {activeTab === "bins" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="glass-card overflow-hidden">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                                    </span>
                                    Real-Time Bin Monitoring
                                </h2>
                                <span className="text-sm text-slate-400">
                                    {bins.length} bins total
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Bin Name</th>
                                            <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Location</th>
                                            <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Fill Level</th>
                                            <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Status</th>
                                            <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Last Updated</th>
                                            <th className="text-left text-sm font-medium text-slate-400 px-6 py-4">Actions</th>
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
                                                            <div className="flex-1 max-w-[120px] h-3 bg-slate-700 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${bin.fillLevel}%` }}
                                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                                    className={cn("h-full rounded-full", getFillLevelColor(bin.fillLevel))}
                                                                />
                                                            </div>
                                                            <span className="text-sm text-slate-300 font-medium">
                                                                {bin.fillLevel}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={cn(
                                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium capitalize",
                                                            getStatusColor(bin.status)
                                                        )}>
                                                            <StatusIcon className="h-3 w-3" />
                                                            {bin.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-400">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4" />
                                                            {bin.lastUpdated}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                                                                View
                                                            </button>
                                                            <span className="text-slate-600">|</span>
                                                            <button className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                                                                Schedule Pickup
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Alerts Tab */}
                {activeTab === "alerts" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="glass-card p-4 border-l-4 border-red-500">
                                <div className="flex items-center gap-3">
                                    <XCircle className="h-8 w-8 text-red-400" />
                                    <div>
                                        <p className="text-2xl font-bold text-white">{criticalCount}</p>
                                        <p className="text-sm text-slate-400">Critical Alerts</p>
                                    </div>
                                </div>
                            </div>
                            <div className="glass-card p-4 border-l-4 border-yellow-500">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="h-8 w-8 text-yellow-400" />
                                    <div>
                                        <p className="text-2xl font-bold text-white">
                                            {activeAlerts.filter((a) => a.type === "warning").length}
                                        </p>
                                        <p className="text-sm text-slate-400">Warnings</p>
                                    </div>
                                </div>
                            </div>
                            <div className="glass-card p-4 border-l-4 border-blue-500">
                                <div className="flex items-center gap-3">
                                    <Bell className="h-8 w-8 text-blue-400" />
                                    <div>
                                        <p className="text-2xl font-bold text-white">
                                            {activeAlerts.filter((a) => a.type === "info").length}
                                        </p>
                                        <p className="text-sm text-slate-400">Informational</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card overflow-hidden">
                            <div className="p-4 border-b border-white/10">
                                <h2 className="text-lg font-semibold text-white">All Alerts</h2>
                            </div>
                            <div className="p-4 space-y-4">
                                <AnimatePresence>
                                    {alerts.map((alert) => (
                                        <motion.div
                                            key={alert.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: alert.dismissed ? 0.5 : 1, y: 0 }}
                                            className={cn(
                                                "p-4 rounded-lg border-l-4 flex items-start gap-4",
                                                getAlertColor(alert.type),
                                                alert.dismissed && "opacity-50"
                                            )}
                                        >
                                            {getAlertIcon(alert.type)}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="font-medium text-white">{alert.title}</p>
                                                        <p className="text-sm text-slate-400 mt-1">{alert.message}</p>
                                                    </div>
                                                    {!alert.dismissed && (
                                                        <button
                                                            onClick={() => dismissAlert(alert.id)}
                                                            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-sm text-white transition-colors"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2">
                                                    {new Date(alert.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Analytics Tab */}
                {activeTab === "analytics" && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Main Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard
                                icon={Recycle}
                                label="Total Waste Collected"
                                value={`${(mockStats.totalWasteCollected).toLocaleString()} kg`}
                                trend={8.2}
                                color="emerald"
                            />
                            <StatCard
                                icon={DollarSign}
                                label="Estimated Recycling Value"
                                value={`$${mockStats.estimatedValue.toLocaleString()}`}
                                trend={12.5}
                                color="yellow"
                            />
                            <StatCard
                                icon={Users}
                                label="Total Registered Users"
                                value={mockStats.totalUsers.toLocaleString()}
                                trend={5.3}
                                color="cyan"
                            />
                            <StatCard
                                icon={Activity}
                                label="Total Transactions"
                                value={mockStats.totalTransactions.toLocaleString()}
                                trend={15.7}
                                color="purple"
                            />
                        </div>

                        {/* Engagement Stats */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">User Engagement</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-slate-400">Daily Active Users</span>
                                            <span className="text-white font-medium">{mockStats.activeToday}</span>
                                        </div>
                                        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${mockStats.userEngagement}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">{mockStats.userEngagement}% engagement rate</p>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-slate-400">Deposits Today</span>
                                            <span className="text-white font-medium">{mockStats.depositsToday}</span>
                                        </div>
                                        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: "62%" }}
                                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">62% of daily target</p>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-slate-400">Points Distributed</span>
                                            <span className="text-white font-medium">{(mockStats.pointsDistributed / 1000).toFixed(0)}K</span>
                                        </div>
                                        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: "85%" }}
                                                transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                                                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">85% of monthly budget</p>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-card p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Weekly Performance</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-white/5">
                                        <TrendingUp className="h-8 w-8 text-emerald-400 mb-2" />
                                        <p className="text-2xl font-bold text-white">+{mockStats.weeklyGrowth}%</p>
                                        <p className="text-sm text-slate-400">User Growth</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5">
                                        <Coins className="h-8 w-8 text-yellow-400 mb-2" />
                                        <p className="text-2xl font-bold text-white">2.4K</p>
                                        <p className="text-sm text-slate-400">New Deposits</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5">
                                        <Trash2 className="h-8 w-8 text-cyan-400 mb-2" />
                                        <p className="text-2xl font-bold text-white">847 kg</p>
                                        <p className="text-sm text-slate-400">Waste This Week</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-white/5">
                                        <Activity className="h-8 w-8 text-purple-400 mb-2" />
                                        <p className="text-2xl font-bold text-white">98.5%</p>
                                        <p className="text-sm text-slate-400">Bin Uptime</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ROUTE OPTIMIZATION TAB */}
                {activeTab === "routes" && (
                    <motion.div
                        key="routes"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Connection & Privacy Status */}
                        <div className="flex flex-wrap gap-4">
                            <div className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm",
                                isOnline ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"
                            )}>
                                {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                                {isOnline ? "Live Data Connected" : "Using Cached Data"}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 text-cyan-400 text-sm">
                                <Shield className="h-4 w-4" />
                                Data Encrypted & Secure
                            </div>
                        </div>

                        {/* Route Controls */}
                        <div className="glass-card p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Collection Route Optimizer</h3>
                                    <p className="text-sm text-slate-400">AI-optimized pickup routes based on fill levels and priority</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
                                        <Filter className="h-4 w-4" />
                                        Filters
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-medium transition-all hover:shadow-lg">
                                        <Route className="h-4 w-4" />
                                        Generate Route
                                    </button>
                                </div>
                            </div>

                            {/* Priority Queue */}
                            <div className="space-y-3 mb-6">
                                <h4 className="text-sm font-medium text-slate-400">Priority Pickup Queue</h4>
                                {bins
                                    .sort((a, b) => b.fillLevel - a.fillLevel)
                                    .slice(0, 5)
                                    .map((bin, index) => (
                                        <motion.div
                                            key={bin.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-lg border",
                                                bin.fillLevel >= 80 ? "bg-red-500/10 border-red-500/30" :
                                                    bin.fillLevel >= 60 ? "bg-yellow-500/10 border-yellow-500/30" :
                                                        "bg-white/5 border-white/10"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                                                index === 0 ? "bg-red-500 text-white" :
                                                    index === 1 ? "bg-orange-500 text-white" :
                                                        "bg-white/20 text-white"
                                            )}>
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-white">{bin.name}</p>
                                                <p className="text-sm text-slate-400">{bin.address}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn(
                                                    "text-xl font-bold",
                                                    bin.fillLevel >= 80 ? "text-red-400" :
                                                        bin.fillLevel >= 60 ? "text-yellow-400" :
                                                            "text-emerald-400"
                                                )}>
                                                    {bin.fillLevel}%
                                                </p>
                                                <p className="text-xs text-slate-400">Fill Level</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-white font-medium">{Math.round(5 + index * 8)} min</p>
                                                <p className="text-xs text-slate-400">ETA</p>
                                            </div>
                                        </motion.div>
                                    ))}
                            </div>

                            {/* Route Summary */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 rounded-lg bg-white/5 text-center">
                                    <p className="text-2xl font-bold text-white">5</p>
                                    <p className="text-sm text-slate-400">Stops</p>
                                </div>
                                <div className="p-4 rounded-lg bg-white/5 text-center">
                                    <p className="text-2xl font-bold text-cyan-400">12.4 km</p>
                                    <p className="text-sm text-slate-400">Total Distance</p>
                                </div>
                                <div className="p-4 rounded-lg bg-white/5 text-center">
                                    <p className="text-2xl font-bold text-emerald-400">45 min</p>
                                    <p className="text-sm text-slate-400">Est. Duration</p>
                                </div>
                                <div className="p-4 rounded-lg bg-white/5 text-center">
                                    <p className="text-2xl font-bold text-yellow-400">~180 kg</p>
                                    <p className="text-sm text-slate-400">Expected Waste</p>
                                </div>
                            </div>
                        </div>

                        {/* Data Privacy Section */}
                        <div className="glass-card p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-cyan-500/20">
                                    <Shield className="h-5 w-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Data Privacy & Handling</h3>
                                    <p className="text-sm text-slate-400">How we protect user data</p>
                                </div>
                            </div>
                            <div className="grid lg:grid-cols-3 gap-4">
                                <div className="p-4 rounded-lg bg-white/5">
                                    <CheckCircle className="h-5 w-5 text-emerald-400 mb-2" />
                                    <p className="font-medium text-white mb-1">End-to-End Encryption</p>
                                    <p className="text-sm text-slate-400">All data is encrypted in transit and at rest</p>
                                </div>
                                <div className="p-4 rounded-lg bg-white/5">
                                    <CheckCircle className="h-5 w-5 text-emerald-400 mb-2" />
                                    <p className="font-medium text-white mb-1">Minimal Data Collection</p>
                                    <p className="text-sm text-slate-400">We only collect what&apos;s necessary for service</p>
                                </div>
                                <div className="p-4 rounded-lg bg-white/5">
                                    <CheckCircle className="h-5 w-5 text-emerald-400 mb-2" />
                                    <p className="font-medium text-white mb-1">User Control</p>
                                    <p className="text-sm text-slate-400">Users can delete their data anytime</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </main>
    );
}

// Stat Card Component
function StatCard({
    icon: Icon,
    label,
    value,
    suffix,
    trend,
    color,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    suffix?: string;
    trend?: number;
    color: "emerald" | "cyan" | "purple" | "yellow";
}) {
    const colorClasses = {
        emerald: "text-emerald-400 bg-emerald-500/20",
        cyan: "text-cyan-400 bg-cyan-500/20",
        purple: "text-purple-400 bg-purple-500/20",
        yellow: "text-yellow-400 bg-yellow-500/20",
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-4"
        >
            <div className="flex items-start justify-between">
                <div className={cn("p-2 rounded-lg", colorClasses[color])}>
                    <Icon className="h-5 w-5" />
                </div>
                {trend !== undefined && (
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-medium",
                        trend >= 0 ? "text-emerald-400" : "text-red-400"
                    )}>
                        {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <p className="text-2xl font-bold text-white mt-3">{value}</p>
            <p className="text-sm text-slate-400">{label}</p>
        </motion.div>
    );
}
