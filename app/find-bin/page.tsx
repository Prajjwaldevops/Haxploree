"use client";

import { useState, useEffect, useCallback } from "react";
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from "react-map-gl";
import type { ViewStateChangeEvent, MarkerEvent } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
    MapPin,
    Navigation,
    Battery,
    CheckCircle,
    AlertTriangle,
    Loader2,
    RefreshCw,
    Compass,
    Trash2,
    Clock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { BIT_SINDRI_CENTER, getFillLevelColor, MapBin, calculateDistance } from "@/lib/mapbox";
import { useUserLocation } from "@/lib/useUserLocation";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function FindBinPage() {
    const [bins, setBins] = useState<MapBin[]>([]);
    const [selectedBin, setSelectedBin] = useState<MapBin | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewState, setViewState] = useState({
        latitude: BIT_SINDRI_CENTER.latitude,
        longitude: BIT_SINDRI_CENTER.longitude,
        zoom: 13,
    });

    const { location, nearestBin, nearestDistance, isLoading: locationLoading, refreshLocation } = useUserLocation(bins);

    // Fetch bins from Supabase
    const fetchBins = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/admin/bins?operational=true");
            const data = await response.json();

            if (data.success) {
                setBins(data.bins);
            } else {
                setError(data.error || "Failed to fetch bins");
            }
        } catch (err) {
            setError("Failed to load bins. Please try again.");
            console.error("Error fetching bins:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBins();
    }, [fetchBins]);

    // Center map on user location when available
    useEffect(() => {
        if (location && !locationLoading) {
            setViewState(prev => ({
                ...prev,
                latitude: location.latitude,
                longitude: location.longitude,
                zoom: 14,
            }));
        }
    }, [location, locationLoading]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "active":
                return <CheckCircle className="h-4 w-4 text-emerald-400" />;
            case "maintenance":
                return <AlertTriangle className="h-4 w-4 text-amber-400" />;
            default:
                return <AlertTriangle className="h-4 w-4 text-red-400" />;
        }
    };

    const getMarkerColor = (bin: MapBin) => {
        if (!bin.is_operational) return "#6b7280"; // gray
        if (bin.fill_level >= 90) return "#ef4444"; // red
        if (bin.fill_level >= 70) return "#f59e0b"; // amber
        return "#10b981"; // emerald
    };

    const openDirections = (bin: MapBin) => {
        if (location) {
            const url = `https://www.google.com/maps/dir/${location.latitude},${location.longitude}/${bin.latitude},${bin.longitude}`;
            window.open(url, "_blank");
        } else {
            const url = `https://www.google.com/maps/search/?api=1&query=${bin.latitude},${bin.longitude}`;
            window.open(url, "_blank");
        }
    };

    if (!MAPBOX_TOKEN) {
        return (
            <main className="min-h-screen">
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="glass-card p-8 text-center">
                        <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Mapbox Not Configured</h2>
                        <p className="text-slate-400">
                            Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local file
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen">
            <Navbar />

            <div className="container mx-auto px-4 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                            Find Smart Bin
                        </h1>
                        <p className="text-slate-400">
                            Locate the nearest e-waste collection point near BIT Sindri
                        </p>
                    </div>
                    <button
                        onClick={fetchBins}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                        Refresh
                    </button>
                </div>

                {/* Nearest Bin Banner */}
                {nearestBin && location && (
                    <div className="glass-card p-4 mb-6 border-l-4 border-emerald-500">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-emerald-500/20">
                                    <Compass className="h-6 w-6 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-400">Nearest Smart Bin</p>
                                    <p className="text-lg font-semibold text-white">{nearestBin.name}</p>
                                    <p className="text-sm text-slate-400">
                                        {nearestDistance?.toFixed(2)} km away • {nearestBin.fill_level}% full
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => openDirections(nearestBin)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-medium transition-colors"
                            >
                                <Navigation className="h-4 w-4" />
                                Get Directions
                            </button>
                        </div>
                    </div>
                )}

                {/* Location Status */}
                {locationLoading && (
                    <div className="glass-card p-4 mb-6 flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                        <span className="text-slate-300">Detecting your location...</span>
                    </div>
                )}

                {/* Map and Bin List */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Map */}
                    <div className="lg:col-span-2 glass-card overflow-hidden" style={{ height: "500px" }}>
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                            </div>
                        ) : (
                            <Map
                                {...viewState}
                                onMove={(evt) => setViewState(evt.viewState)}
                                style={{ width: "100%", height: "100%" }}
                                mapStyle="mapbox://styles/mapbox/dark-v11"
                                mapboxAccessToken={MAPBOX_TOKEN}
                            >
                                <NavigationControl position="top-right" />
                                <GeolocateControl
                                    position="top-right"
                                    trackUserLocation
                                    showUserHeading
                                />

                                {/* User Location Marker */}
                                {location && (
                                    <Marker
                                        latitude={location.latitude}
                                        longitude={location.longitude}
                                        anchor="center"
                                    >
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-blue-500/30 rounded-full animate-ping" />
                                            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
                                        </div>
                                    </Marker>
                                )}

                                {/* Bin Markers */}
                                {bins.map((bin) => (
                                    <Marker
                                        key={bin.id}
                                        latitude={bin.latitude}
                                        longitude={bin.longitude}
                                        anchor="bottom"
                                        onClick={(e) => {
                                            e.originalEvent.stopPropagation();
                                            setSelectedBin(bin);
                                        }}
                                    >
                                        <div
                                            className="cursor-pointer transform hover:scale-110 transition-transform"
                                            style={{ color: getMarkerColor(bin) }}
                                        >
                                            <Trash2 className="h-8 w-8 drop-shadow-lg" fill="currentColor" />
                                        </div>
                                    </Marker>
                                ))}

                                {/* Popup */}
                                {selectedBin && (
                                    <Popup
                                        latitude={selectedBin.latitude}
                                        longitude={selectedBin.longitude}
                                        anchor="top"
                                        onClose={() => setSelectedBin(null)}
                                        closeButton={true}
                                        closeOnClick={false}
                                        className="mapbox-popup"
                                    >
                                        <div className="p-2 min-w-[200px]">
                                            <h3 className="font-semibold text-gray-900 mb-1">
                                                {selectedBin.name}
                                            </h3>
                                            <p className="text-xs text-gray-600 mb-2">
                                                {selectedBin.address}
                                            </p>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div
                                                    className="h-2 flex-1 rounded-full bg-gray-200 overflow-hidden"
                                                >
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${selectedBin.fill_level}%`,
                                                            backgroundColor: getFillLevelColor(selectedBin.fill_level),
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-gray-700">
                                                    {selectedBin.fill_level}%
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                                                {getStatusIcon(selectedBin.status)}
                                                <span className="capitalize">{selectedBin.status}</span>
                                            </div>
                                            <button
                                                onClick={() => openDirections(selectedBin)}
                                                className="w-full py-1.5 px-3 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
                                            >
                                                Get Directions
                                            </button>
                                        </div>
                                    </Popup>
                                )}
                            </Map>
                        )}
                    </div>

                    {/* Bin List */}
                    <div className="glass-card p-4 max-h-[500px] overflow-y-auto">
                        <h2 className="text-lg font-semibold text-white mb-4 sticky top-0 bg-slate-900/90 py-2">
                            Available Bins ({bins.length})
                        </h2>

                        {error && (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3">
                            {bins.map((bin) => {
                                const distance = location
                                    ? calculateDistance(location.latitude, location.longitude, bin.latitude, bin.longitude)
                                    : null;

                                return (
                                    <div
                                        key={bin.id}
                                        onClick={() => {
                                            setSelectedBin(bin);
                                            setViewState(prev => ({
                                                ...prev,
                                                latitude: bin.latitude,
                                                longitude: bin.longitude,
                                                zoom: 15,
                                            }));
                                        }}
                                        className={cn(
                                            "p-3 rounded-lg cursor-pointer transition-all hover:bg-white/10",
                                            selectedBin?.id === bin.id ? "bg-white/10 ring-1 ring-emerald-500/50" : "bg-white/5"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium text-white truncate">
                                                        {bin.name}
                                                    </h3>
                                                    {nearestBin?.id === bin.id && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-400 rounded">
                                                            NEAREST
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 truncate mt-0.5">
                                                    {bin.address}
                                                </p>
                                            </div>
                                            {getStatusIcon(bin.status)}
                                        </div>

                                        <div className="mt-2 flex items-center gap-3">
                                            {/* Fill Level */}
                                            <div className="flex-1">
                                                <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all"
                                                        style={{
                                                            width: `${bin.fill_level}%`,
                                                            backgroundColor: getFillLevelColor(bin.fill_level),
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="text-xs text-slate-400">{bin.fill_level}%</span>

                                            {/* Distance */}
                                            {distance !== null && (
                                                <span className="text-xs text-slate-400">
                                                    {distance.toFixed(1)} km
                                                </span>
                                            )}
                                        </div>

                                        {/* Accepted Items */}
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {bin.accepted_items?.slice(0, 3).map((item, i) => (
                                                <span
                                                    key={i}
                                                    className="px-1.5 py-0.5 text-[10px] bg-slate-700 text-slate-300 rounded"
                                                >
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
