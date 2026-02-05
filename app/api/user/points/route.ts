import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Add points to user
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { points } = body;

        if (typeof points !== "number" || points < 0) {
            return NextResponse.json(
                { success: false, error: "Invalid points value" },
                { status: 400 }
            );
        }

        // Get current user from Supabase
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id, total_points")
            .eq("clerk_id", userId)
            .single();

        if (userError || !userData) {
            // Create user if not exists
            const { data: newUser, error: createError } = await supabase
                .from("users")
                .insert({
                    clerk_id: userId,
                    total_points: points,
                })
                .select()
                .single();

            if (createError) {
                console.error("Error creating user:", createError);
                return NextResponse.json(
                    { success: false, error: "Failed to create user" },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                total_points: newUser.total_points,
            });
        }

        // Update existing user points
        const newTotal = (userData.total_points || 0) + points;
        const { error: updateError } = await supabase
            .from("users")
            .update({ total_points: newTotal })
            .eq("id", userData.id);

        if (updateError) {
            console.error("Error updating points:", updateError);
            return NextResponse.json(
                { success: false, error: "Failed to update points" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            points_added: points,
            total_points: newTotal,
        });

    } catch (error) {
        console.error("Points API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
