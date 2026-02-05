import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(request: NextRequest) {
    try {
        const { data: users, error } = await supabase
            .from("users")
            .select("id, email, total_points")
            .order("total_points", { ascending: false });

        if (error) throw error;

        return NextResponse.json({
            success: true,
            users
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}
