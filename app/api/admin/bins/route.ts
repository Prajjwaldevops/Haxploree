import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * GET /api/admin/bins
 * Fetch all bins with optional filters
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const operational = searchParams.get("operational");

        let query = supabase
            .from("bins")
            .select("*")
            .order("bin_code", { ascending: true });

        if (status) {
            query = query.eq("status", status);
        }

        if (operational !== null) {
            query = query.eq("is_operational", operational === "true");
        }

        const { data, error } = await query;

        if (error) {
            console.error("[BINS API] Error fetching bins:", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            bins: data || [],
            count: data?.length || 0,
        });
    } catch (error) {
        console.error("[BINS API] Unexpected error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch bins" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/admin/bins
 * Update bin properties (fill_level, status, is_operational)
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, fill_level, status, is_operational } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Bin ID is required" },
                { status: 400 }
            );
        }

        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (fill_level !== undefined) {
            updates.fill_level = Math.max(0, Math.min(100, fill_level));
        }
        if (status !== undefined) {
            updates.status = status;
        }
        if (is_operational !== undefined) {
            updates.is_operational = is_operational;
        }

        const { data, error } = await supabase
            .from("bins")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("[BINS API] Error updating bin:", error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            bin: data,
            message: "Bin updated successfully",
        });
    } catch (error) {
        console.error("[BINS API] Unexpected error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update bin" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/bins
 * Mark bin as emptied
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, action } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: "Bin ID is required" },
                { status: 400 }
            );
        }

        if (action === "empty") {
            const { data, error } = await supabase
                .from("bins")
                .update({
                    fill_level: 0,
                    last_emptied_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", id)
                .select()
                .single();

            if (error) {
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                bin: data,
                message: "Bin emptied successfully",
            });
        }

        return NextResponse.json(
            { success: false, error: "Unknown action" },
            { status: 400 }
        );
    } catch (error) {
        console.error("[BINS API] Unexpected error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to process action" },
            { status: 500 }
        );
    }
}
