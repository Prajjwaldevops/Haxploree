import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Supabase admin client
function getSupabaseAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
}

/**
 * GET /api/admin/settings
 * Fetch all system settings or a specific setting by key
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdminClient();
        const searchParams = request.nextUrl.searchParams;
        const key = searchParams.get("key");

        let query = supabase.from("system_settings").select("*");

        if (key) {
            query = query.eq("key", key);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching settings:", error);
            // If table doesn't exist, return defaults
            if (error.code === '42P01') { // undefined_table
                return NextResponse.json({
                    success: true,
                    settings: [
                        { key: "radius_check_enabled", value: false, description: "Default (Table missing)" }
                    ]
                });
            }
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // If specific key requested and not found, return default for known keys
        if (key && (!data || data.length === 0)) {
            if (key === "radius_check_enabled") {
                return NextResponse.json({
                    success: true,
                    settings: [{ key: "radius_check_enabled", value: false }]
                });
            }
        }

        return NextResponse.json({ success: true, settings: data });
    } catch (error) {
        console.error("Settings API Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/admin/settings
 * Update or create a system setting
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { key, value, description } = body;

        if (!key || value === undefined) {
            return NextResponse.json({ success: false, error: "Missing key or value" }, { status: 400 });
        }

        const supabase = getSupabaseAdminClient();

        const { data, error } = await supabase
            .from("system_settings")
            .upsert({
                key,
                value,
                description,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error("Error updating setting:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, setting: data });
    } catch (error) {
        console.error("Settings API Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
