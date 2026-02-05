/**
 * Seed 30 Smart Bins around BIT Sindri
 * 
 * Center: BIT Sindri, Dhanbad, Jharkhand
 * Coordinates: 23.6693°N, 86.8947°E
 * Radius: 10 km
 * 
 * Run with: npx ts-node scripts/seed-bins.ts
 * Or copy the SQL output to Supabase SQL Editor
 */

import { v4 as uuidv4 } from "uuid";
import { generateRandomCoordinate, BIT_SINDRI_CENTER } from "../lib/mapbox";

const LOCATIONS = [
    { name: "BIT Main Gate", offset: { lat: 0, lon: 0 } },
    { name: "BIT Library", offset: { lat: 0.002, lon: 0.001 } },
    { name: "BIT Hostel 1", offset: { lat: -0.003, lon: 0.002 } },
    { name: "BIT Hostel 2", offset: { lat: -0.004, lon: 0.001 } },
    { name: "BIT Canteen", offset: { lat: 0.001, lon: -0.001 } },
    { name: "Sindri Market", offset: { lat: 0.01, lon: 0.005 } },
    { name: "Sindri Railway Station", offset: { lat: 0.015, lon: -0.01 } },
    { name: "Sindri Bus Stand", offset: { lat: 0.012, lon: 0.008 } },
    { name: "Fertilizer Township", offset: { lat: -0.02, lon: 0.015 } },
    { name: "Sindri Hospital", offset: { lat: 0.008, lon: -0.005 } },
    { name: "Sindri Post Office", offset: { lat: 0.005, lon: 0.012 } },
    { name: "BIT Admin Block", offset: { lat: 0.001, lon: 0.002 } },
    { name: "BIT Workshop", offset: { lat: -0.002, lon: -0.003 } },
    { name: "BIT Sports Complex", offset: { lat: 0.004, lon: -0.002 } },
    { name: "BIT Guest House", offset: { lat: 0.003, lon: 0.003 } },
];

const ITEM_TYPES = [
    ["Smartphones", "Tablets", "Batteries", "Chargers"],
    ["Laptops", "Monitors", "Keyboards", "Mice"],
    ["All E-Waste Types"],
    ["Small Electronics", "Cables", "Adapters"],
    ["Phones", "Earphones", "Power Banks"],
];

function generateBins(): string[] {
    const bins = [];
    const statuses = ["active", "active", "active", "active", "maintenance"];

    for (let i = 1; i <= 30; i++) {
        const id = uuidv4();
        const binCode = `BIT-BIN-${String(i).padStart(3, "0")}`;

        // Use predefined location or generate random
        let latitude, longitude, name;
        if (i <= LOCATIONS.length) {
            const loc = LOCATIONS[i - 1];
            latitude = (BIT_SINDRI_CENTER.latitude + loc.offset.lat).toFixed(7);
            longitude = (BIT_SINDRI_CENTER.longitude + loc.offset.lon).toFixed(7);
            name = `${loc.name} Smart Bin`;
        } else {
            const coords = generateRandomCoordinate(
                BIT_SINDRI_CENTER.latitude,
                BIT_SINDRI_CENTER.longitude,
                8 // 8km radius for remaining bins
            );
            latitude = coords.latitude.toFixed(7);
            longitude = coords.longitude.toFixed(7);
            name = `Smart Bin ${binCode}`;
        }

        const fillLevel = Math.floor(Math.random() * 85); // 0-85%
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const isOperational = status === "active" ? "true" : Math.random() > 0.3 ? "true" : "false";
        const acceptedItems = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];

        const address = i <= LOCATIONS.length
            ? `${LOCATIONS[i - 1].name}, Sindri, Dhanbad`
            : `Area ${i}, Sindri, Dhanbad`;

        bins.push(`
INSERT INTO bins (id, bin_code, name, address, latitude, longitude, fill_level, status, is_operational, accepted_items)
VALUES (
    '${id}',
    '${binCode}',
    '${name}',
    '${address}',
    ${latitude},
    ${longitude},
    ${fillLevel},
    '${status}',
    ${isOperational},
    ARRAY[${acceptedItems.map(item => `'${item}'`).join(", ")}]
);`);
    }

    return bins;
}

// Generate and output SQL
const createTableSQL = `
-- Create bins table if not exists
CREATE TABLE IF NOT EXISTS bins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bin_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    fill_level INTEGER DEFAULT 0 CHECK (fill_level >= 0 AND fill_level <= 100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'offline')),
    is_operational BOOLEAN DEFAULT true,
    accepted_items TEXT[],
    last_emptied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_locations table
CREATE TABLE IF NOT EXISTS user_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    nearest_bin_id UUID REFERENCES bins(id) ON DELETE SET NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add bin_id to transactions if not exists
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS bin_id UUID REFERENCES bins(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bins_status ON bins(status);
CREATE INDEX IF NOT EXISTS idx_bins_location ON bins(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_user_locations_user ON user_locations(user_id);

-- Clear existing bins (for re-seeding)
-- DELETE FROM bins;

`;

console.log("=== SUPABASE SQL SCHEMA ===");
console.log(createTableSQL);
console.log("\n=== SEED 30 BINS ===");
console.log(generateBins().join("\n"));
