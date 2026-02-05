import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Fetch user stats from Supabase
        const { data: userData, error } = await supabase
            .from("users")
            .select("total_points, total_co2_saved, items_recycled, rank")
            .eq("clerk_id", userId)
            .single();

        if (error || !userData) {
            // Return defaults if user not found (or handle creation)
            return NextResponse.json({
                success: true,
                stats: {
                    total_points: 0,
                    total_co2_saved: 0,
                    items_recycled: 0,
                    rank: 0,
                },
            });
        }

        return NextResponse.json({
            success: true,
            stats: userData,
        });

    } catch (error) {
        console.error("Stats API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
