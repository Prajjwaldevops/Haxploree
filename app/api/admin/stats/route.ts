import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * GET /api/admin/stats
 * Fetch real-time dashboard statistics including analytics
 */
export async function GET(request: NextRequest) {
    try {
        // Fetch all stats in parallel
        const [usersResult, binsResult, transactionsResult, alertsResult] = await Promise.all([
            // Total users count
            supabase.from("users").select("id", { count: "exact", head: true }),

            // Bins count and status breakdown
            supabase.from("bins").select("id, name, status, fill_level, is_operational, last_emptied_at, created_at"),

            // Transactions count and totals
            supabase.from("transactions").select("id, points_earned, co2_saved, created_at"),

            // Recent high-fill bins (alerts)
            supabase.from("bins").select("id, name, fill_level").gte("fill_level", 80),
        ]);

        // Calculate stats
        const totalUsers = usersResult.count || 0;
        const bins = binsResult.data || [];
        const transactions = transactionsResult.data || [];
        const highFillBins = alertsResult.data || [];

        // Bin stats
        const totalBins = bins.length;
        const activeBins = bins.filter(b => b.status === "active" && b.is_operational).length;
        const maintenanceBins = bins.filter(b => b.status === "maintenance").length;
        const fullBins = bins.filter(b => b.fill_level >= 90).length;
        const avgFillLevel = bins.length > 0
            ? Math.round(bins.reduce((sum, b) => sum + (b.fill_level || 0), 0) / bins.length)
            : 0;

        // Transaction stats
        const totalPointsDistributed = transactions.reduce((sum, t) => sum + (t.points_earned || 0), 0);
        const totalCo2Saved = transactions.reduce((sum, t) => sum + (t.co2_saved || 0), 0);
        const totalTransactions = transactions.length;

        // Weekly stats (last 7 days)
        const now = new Date();
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const weeklyTransactions = transactions.filter(t => new Date(t.created_at) > oneWeekAgo);
        const weeklyPoints = weeklyTransactions.reduce((sum, t) => sum + (t.points_earned || 0), 0);
        const weeklyDeposits = weeklyTransactions.length;

        // --- NEW: Daily Activity (Last 14 days) ---
        const dailyActivityMap = new Map<string, { count: number, points: number, co2: number }>();
        // Initialize last 14 days with 0
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            dailyActivityMap.set(dateStr, { count: 0, points: 0, co2: 0 });
        }

        // Fill with actual data
        transactions.forEach(t => {
            const dateStr = new Date(t.created_at).toISOString().split('T')[0];
            if (dailyActivityMap.has(dateStr)) {
                const current = dailyActivityMap.get(dateStr)!;
                dailyActivityMap.set(dateStr, {
                    count: current.count + 1,
                    points: current.points + (t.points_earned || 0),
                    co2: current.co2 + (t.co2_saved || 0)
                });
            }
        });

        const dailyActivity = Array.from(dailyActivityMap.entries()).map(([date, data]) => ({
            date,
            count: data.count,
            points: data.points,
            co2: data.co2
        }));

        // --- NEW: Predictive Analytics (Bin Fill Time) ---
        // Heuristic:
        // Rate = fill_level / hours_since_last_empty
        // Hours remaining = (100 - current_level) / Rate
        const binPredictions = bins
            .filter(b => b.status === 'active' && b.fill_level < 100)
            .map(bin => {
                const lastResetDate = bin.last_emptied_at ? new Date(bin.last_emptied_at) : new Date(bin.created_at);
                const hoursSinceReset = Math.max(1, (now.getTime() - lastResetDate.getTime()) / (1000 * 60 * 60));

                // If fill level is 0, assume a very slow rate (avoid division by zero issues essentially)
                // Use a minimum fill rate to avoid infinite predictions
                const effectiveFill = Math.max(bin.fill_level, 1);
                const fillRatePerHour = effectiveFill / hoursSinceReset;

                const remainingCapacity = 100 - bin.fill_level;
                const hoursRemaining = remainingCapacity / (fillRatePerHour || 0.1); // Avoid div by zero
                const daysRemaining = Math.round(hoursRemaining / 24);

                const predictedDate = new Date(now.getTime() + hoursRemaining * 60 * 60 * 1000);

                return {
                    id: bin.id,
                    name: bin.name,
                    current_level: bin.fill_level,
                    fill_rate_per_hour: fillRatePerHour.toFixed(2),
                    predicted_full_date: predictedDate.toISOString(),
                    days_remaining: daysRemaining
                };
            })
            // Sort by urgency (least days remaining first)
            .sort((a, b) => a.days_remaining - b.days_remaining)
            .slice(0, 5); // Top 5 urgent bins

        // Calculate percentage changes (mock for now - would need historical data)
        const userGrowth = 12.5;
        const transactionGrowth = 8.3;

        return NextResponse.json({
            success: true,
            stats: {
                users: {
                    total: totalUsers,
                    growth: userGrowth,
                },
                bins: {
                    total: totalBins,
                    active: activeBins,
                    maintenance: maintenanceBins,
                    full: fullBins,
                    avgFillLevel,
                },
                transactions: {
                    total: totalTransactions,
                    growth: transactionGrowth,
                    weekly: weeklyDeposits,
                },
                points: {
                    total: totalPointsDistributed,
                    weekly: weeklyPoints,
                },
                environment: {
                    co2Saved: totalCo2Saved,
                    treesEquivalent: Math.round(totalCo2Saved / 21), // ~21kg CO2 per tree/year
                },
                alerts: {
                    critical: highFillBins.filter(b => b.fill_level >= 90).length,
                    warning: highFillBins.filter(b => b.fill_level >= 80 && b.fill_level < 90).length,
                    bins: highFillBins,
                },
                analytics: {
                    dailyActivity,
                    binPredictions
                }
            },
        });
    } catch (error) {
        console.error("[STATS API] Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
