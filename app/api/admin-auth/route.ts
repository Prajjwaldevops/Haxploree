import { NextRequest, NextResponse } from "next/server";

// Admin credentials - in production, use environment variables and proper hashing
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "root@2309";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: "Username and password are required" },
                { status: 400 }
            );
        }

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            return NextResponse.json({
                success: true,
                message: "Authentication successful",
                user: { username, role: "admin" },
            });
        }

        return NextResponse.json(
            { success: false, message: "Invalid username or password" },
            { status: 401 }
        );
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "An error occurred during authentication" },
            { status: 500 }
        );
    }
}
