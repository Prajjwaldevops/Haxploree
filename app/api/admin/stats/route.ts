import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * GET /api/admin/stats
 * Fetch real-time dashboard statistics
 */
export async function GET(request: NextRequest) {
    try {
        // Fetch all stats in parallel
        const [usersResult, binsResult, transactionsResult, alertsResult] = await Promise.all([
            // Total users count
            supabase.from("users").select("id", { count: "exact", head: true }),

            // Bins count and status breakdown
            supabase.from("bins").select("id, status, fill_level, is_operational"),

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
        const totalTransactions = transactions.length;
        const totalPointsDistributed = transactions.reduce((sum, t) => sum + (t.points_earned || 0), 0);
        const totalCo2Saved = transactions.reduce((sum, t) => sum + (t.co2_saved || 0), 0);

        // Weekly stats (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklyTransactions = transactions.filter(t => new Date(t.created_at) > oneWeekAgo);
        const weeklyPoints = weeklyTransactions.reduce((sum, t) => sum + (t.points_earned || 0), 0);
        const weeklyDeposits = weeklyTransactions.length;

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
