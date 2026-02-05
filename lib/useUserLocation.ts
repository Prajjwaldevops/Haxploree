import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { findNearestBin, MapBin } from "./mapbox";

interface UserLocation {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
}

interface UseUserLocationReturn {
    location: UserLocation | null;
    nearestBin: MapBin | null;
    nearestDistance: number | null;
    isLoading: boolean;
    error: string | null;
    refreshLocation: () => void;
}

/**
 * Hook to get user's GPS location and find nearest bin
 */
export function useUserLocation(bins: MapBin[]): UseUserLocationReturn {
    const [location, setLocation] = useState<UserLocation | null>(null);
    const [nearestBin, setNearestBin] = useState<MapBin | null>(null);
    const [nearestDistance, setNearestDistance] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const updateNearestBin = useCallback((userLat: number, userLon: number, binList: MapBin[]) => {
        const result = findNearestBin(userLat, userLon, binList);
        if (result) {
            setNearestBin(result.bin);
            setNearestDistance(result.distance);
        }
    }, []);

    const getLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const newLocation: UserLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp,
                };

                setLocation(newLocation);
                setIsLoading(false);

                // Update nearest bin
                if (bins.length > 0) {
                    updateNearestBin(newLocation.latitude, newLocation.longitude, bins);
                }

                // Save to Supabase (optional - for analytics)
                try {
                    await saveLocationToSupabase(newLocation.latitude, newLocation.longitude);
                } catch (err) {
                    console.warn("Failed to save location to Supabase:", err);
                }
            },
            (err) => {
                setError(getGeolocationError(err));
                setIsLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000,
            }
        );
    }, [bins, updateNearestBin]);

    // Initial location fetch
    useEffect(() => {
        getLocation();
    }, []);

    // Update nearest bin when bins change
    useEffect(() => {
        if (location && bins.length > 0) {
            updateNearestBin(location.latitude, location.longitude, bins);
        }
    }, [bins, location, updateNearestBin]);

    return {
        location,
        nearestBin,
        nearestDistance,
        isLoading,
        error,
        refreshLocation: getLocation,
    };
}

/**
 * Save user location to Supabase for analytics
 */
async function saveLocationToSupabase(latitude: number, longitude: number) {
    // Only save if we have a session (optional)
    const { data, error } = await supabase
        .from("user_locations")
        .insert({
            latitude,
            longitude,
            recorded_at: new Date().toISOString(),
        });

    if (error) {
        console.warn("Location save error:", error.message);
    }
}

/**
 * Get human-readable geolocation error
 */
function getGeolocationError(error: GeolocationPositionError): string {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            return "Location permission denied. Please enable location access.";
        case error.POSITION_UNAVAILABLE:
            return "Location information unavailable.";
        case error.TIMEOUT:
            return "Location request timed out.";
        default:
            return "Unknown location error.";
    }
}
