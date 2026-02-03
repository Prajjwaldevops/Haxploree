import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Points calculation based on item type and weight
export function calculatePoints(itemType: string, weight: number): number {
    const basePoints: Record<string, number> = {
        smartphone: 50,
        laptop: 150,
        tablet: 80,
        battery: 30,
        charger: 20,
        cable: 10,
        monitor: 100,
        keyboard: 25,
        mouse: 15,
        printer: 120,
        other: 15,
    };

    const base = basePoints[itemType.toLowerCase()] || basePoints.other;
    const weightMultiplier = Math.max(1, weight / 100);
    return Math.round(base * weightMultiplier);
}

// CO2 savings estimation (kg)
export function calculateCO2Saved(itemType: string): number {
    const co2Savings: Record<string, number> = {
        smartphone: 70,
        laptop: 350,
        tablet: 100,
        battery: 15,
        charger: 5,
        cable: 2,
        monitor: 200,
        keyboard: 10,
        mouse: 5,
        printer: 150,
        other: 10,
    };

    return co2Savings[itemType.toLowerCase()] || co2Savings.other;
}

// Format number with commas
export function formatNumber(num: number): string {
    return num.toLocaleString();
}

// Mock AI detection for demo purposes
export interface DetectionResult {
    itemType: string;
    confidence: number;
    points: number;
    co2Saved: number;
}

export async function simulateDetection(weight: number): Promise<DetectionResult> {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    let itemType: string;
    let confidence: number;

    if (weight >= 100 && weight <= 250) {
        itemType = 'Smartphone';
        confidence = 0.92;
    } else if (weight > 1000 && weight <= 3000) {
        itemType = 'Laptop';
        confidence = 0.88;
    } else if (weight > 250 && weight <= 600) {
        itemType = 'Tablet';
        confidence = 0.85;
    } else if (weight > 3000) {
        itemType = 'Monitor';
        confidence = 0.82;
    } else if (weight < 100 && weight >= 20) {
        itemType = 'Battery';
        confidence = 0.90;
    } else {
        itemType = 'Electronic Device';
        confidence = 0.75;
    }

    const points = calculatePoints(itemType, weight);
    const co2Saved = calculateCO2Saved(itemType);

    return { itemType, confidence, points, co2Saved };
}
