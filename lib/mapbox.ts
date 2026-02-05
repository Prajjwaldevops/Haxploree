/**
 * Mapbox Configuration and Utilities
 */

// BIT Sindri coordinates (center point)
export const BIT_SINDRI_CENTER = {
    latitude: 23.653689,
    longitude: 86.471895,
};

// Map configuration
export const MAP_CONFIG = {
    style: "mapbox://styles/mapbox/dark-v11",
    defaultZoom: 13,
    maxZoom: 18,
    minZoom: 10,
};

// Bin status colors
export const BIN_STATUS_COLORS = {
    active: "#10b981", // emerald
    maintenance: "#f59e0b", // amber
    offline: "#ef4444", // red
    full: "#ef4444", // red
};

// Fill level colors
export function getFillLevelColor(level: number): string {
    if (level >= 90) return "#ef4444"; // red - critical
    if (level >= 70) return "#f59e0b"; // amber - high
    if (level >= 40) return "#22c55e"; // green - moderate
    return "#10b981"; // emerald - low
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Find the nearest bin to a given location
 */
export function findNearestBin<T extends { latitude: number; longitude: number }>(
    userLat: number,
    userLon: number,
    bins: T[]
): { bin: T; distance: number } | null {
    if (bins.length === 0) return null;

    let nearest = bins[0];
    let minDistance = calculateDistance(userLat, userLon, nearest.latitude, nearest.longitude);

    for (const bin of bins) {
        const distance = calculateDistance(userLat, userLon, bin.latitude, bin.longitude);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = bin;
        }
    }

    return { bin: nearest, distance: minDistance };
}

/**
 * Generate random coordinates within a radius of a center point
 */
export function generateRandomCoordinate(
    centerLat: number,
    centerLon: number,
    radiusKm: number
): { latitude: number; longitude: number } {
    // Convert radius from km to degrees (approximate)
    const radiusLat = radiusKm / 111; // 1 degree lat ≈ 111 km
    const radiusLon = radiusKm / (111 * Math.cos(toRad(centerLat)));

    // Random angle and distance
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.sqrt(Math.random()) * radiusKm;

    const latitude = centerLat + (distance / 111) * Math.cos(angle);
    const longitude = centerLon + (distance / (111 * Math.cos(toRad(centerLat)))) * Math.sin(angle);

    return { latitude, longitude };
}

// Bin type definition for the app
export interface MapBin {
    id: string;
    bin_code: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    fill_level: number;
    status: "active" | "maintenance" | "offline";
    is_operational: boolean;
    accepted_items: string[];
    last_emptied_at?: string;
    created_at: string;
}
