import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Fetch User and Transactions
        const [userRes, transactionsRes] = await Promise.all([
            supabase.from("users").select("*").eq("id", id).single(),
            supabase.from("transactions").select("*").eq("user_id", id).order("created_at", { ascending: false })
        ]);

        if (userRes.error) throw userRes.error;

        const transactions = transactionsRes.data || [];

        // Calculate aggregating stats
        const totalDeposits = transactions.length;
        const co2Saved = transactions.reduce((sum, t) => sum + (t.co2_saved || 0), 0);

        return NextResponse.json({
            success: true,
            user: userRes.data,
            stats: {
                totalDeposits,
                co2Saved,
                transactions
            }
        });

    } catch (error) {
        console.error("Error fetching user details:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch user details" },
            { status: 500 }
        );
    }
}
