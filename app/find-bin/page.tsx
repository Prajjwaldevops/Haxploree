"use client";

import { useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import {
    MapPin,
    Navigation,
    Battery,
    CheckCircle,
    AlertTriangle,
    Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

interface Bin {
    id: number;
    name: string;
    address: string;
    lat: number;
    lng: number;
    fillLevel: number;
    status: "active" | "full" | "maintenance";
    acceptedItems: string[];
}

// Mock bins data
const mockBins: Bin[] = [
    {
        id: 1,
        name: "Central Plaza Smart Bin",
        address: "123 Main Street, Downtown",
        lat: 28.6139,
        lng: 77.209,
        fillLevel: 45,
        status: "active",
        acceptedItems: ["Smartphones", "Tablets", "Batteries", "Chargers"],
    },
    {
        id: 2,
        name: "Tech Park E-Waste Station",
        address: "456 IT Hub Road, Sector 5",
        lat: 28.6229,
        lng: 77.219,
        fillLevel: 78,
        status: "active",
        acceptedItems: ["Laptops", "Monitors", "Keyboards", "Printers"],
    },
    {
        id: 3,
        name: "University Campus Bin",
        address: "University Main Gate",
        lat: 28.6039,
        lng: 77.199,
        fillLevel: 92,
        status: "full",
        acceptedItems: ["All E-Waste Types"],
    },
    {
        id: 4,
        name: "City Mall Collection Point",
        address: "City Mall, Ground Floor",
        lat: 28.6189,
        lng: 77.229,
        fillLevel: 23,
        status: "active",
        acceptedItems: ["Small Electronics", "Cables", "Batteries"],
    },
    {
        id: 5,
        name: "Railway Station Bin",
        address: "Central Railway Station",
        lat: 28.6089,
        lng: 77.219,
        fillLevel: 67,
        status: "maintenance",
        acceptedItems: ["Restricted - Under Maintenance"],
    },
];

const mapContainerStyle = {
    width: "100%",
    height: "100%",
};

const defaultCenter = {
    lat: 28.6139,
    lng: 77.209,
};

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

export default function FindBinPage() {
    const [selectedBin, setSelectedBin] = useState<Bin | null>(null);
    const [mapCenter, setMapCenter] = useState(defaultCenter);

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    });

    const getMarkerIcon = (bin: Bin) => {
        let color = "#10b981"; // emerald
        if (bin.status === "full") color = "#ef4444"; // red
        else if (bin.status === "maintenance") color = "#f59e0b"; // yellow
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

    const getFillLevelColor = (level: number) => {
        if (level >= 80) return "bg-red-500";
        if (level >= 60) return "bg-yellow-500";
        return "bg-emerald-500";
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
                        <CheckCircle className="h-3 w-3" /> Active
                    </span>
                );
            case "full":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                        <AlertTriangle className="h-3 w-3" /> Full
                    </span>
                );
            case "maintenance":
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                        <AlertTriangle className="h-3 w-3" /> Maintenance
                    </span>
                );
        }
    };

    const handleBinSelect = (bin: Bin) => {
        setSelectedBin(bin);
        setMapCenter({ lat: bin.lat, lng: bin.lng });
    };

    if (loadError) {
        return (
            <main className="min-h-screen">
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="glass-card p-8 text-center">
                        <AlertTriangle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-white mb-2">Map Loading Error</h2>
                        <p className="text-slate-400">
                            Unable to load Google Maps. Please check your API key configuration.
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
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Find Nearby Bins
                    </h1>
                    <p className="text-slate-400">
                        Locate the nearest smart e-waste collection bin
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Map */}
                    <div className="lg:col-span-2 glass-card overflow-hidden" style={{ height: "500px" }}>
                        {!isLoaded ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
                            </div>
                        ) : (
                            <GoogleMap
                                mapContainerStyle={mapContainerStyle}
                                center={mapCenter}
                                zoom={13}
                                options={mapOptions}
                            >
                                {mockBins.map((bin) => (
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
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-500">Fill Level:</span>
                                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full",
                                                            getFillLevelColor(selectedBin.fillLevel)
                                                        )}
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

                    {/* Bin List */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-emerald-400" />
                            Nearby Bins ({mockBins.length})
                        </h2>
                        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2">
                            {mockBins.map((bin) => (
                                <button
                                    key={bin.id}
                                    onClick={() => handleBinSelect(bin)}
                                    className={cn(
                                        "w-full glass-card p-4 text-left hover:bg-white/10 transition-all",
                                        selectedBin?.id === bin.id && "ring-2 ring-emerald-500 bg-white/5"
                                    )}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-medium text-white text-sm">{bin.name}</h3>
                                        {getStatusBadge(bin.status)}
                                    </div>
                                    <p className="text-xs text-slate-400 mb-3">{bin.address}</p>
                                    <div className="flex items-center gap-2">
                                        <Battery className="h-4 w-4 text-slate-500" />
                                        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all",
                                                    getFillLevelColor(bin.fillLevel)
                                                )}
                                                style={{ width: `${bin.fillLevel}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-slate-400">{bin.fillLevel}%</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Selected Bin Details */}
                {selectedBin && (
                    <div className="mt-6 glass-card p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold text-white mb-1">
                                    {selectedBin.name}
                                </h2>
                                <p className="text-slate-400 text-sm">{selectedBin.address}</p>
                            </div>
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedBin.lat},${selectedBin.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold px-6 py-3 rounded-full hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
                            >
                                <Navigation className="h-4 w-4" />
                                Get Directions
                            </a>
                        </div>
                        <div className="mt-4">
                            <span className="text-sm text-slate-400">Accepted Items:</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedBin.acceptedItems.map((item) => (
                                    <span
                                        key={item}
                                        className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
