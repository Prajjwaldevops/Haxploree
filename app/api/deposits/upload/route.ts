import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Cloudflare R2 Configuration
 */
function getR2Client() {
    return new S3Client({
        region: "auto",
        endpoint: process.env.R2_ENDPOINT_URL,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
        },
    });
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "haxploree-deposits";
const SIGNED_URL_EXPIRATION = parseInt(process.env.R2_SIGNED_URL_EXPIRATION || "3600");

/**
 * Supabase admin client
 */
function getSupabaseClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
}

/**
 * Generate object key for R2
 */
function generateObjectKey(userId: string, filename: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const extension = filename.split(".").pop() || "jpg";
    return `deposits/${userId}/${timestamp}-${uuid}.${extension}`;
}

/**
 * Upload to Cloudflare R2
 */
async function uploadToR2(
    fileData: Buffer,
    objectKey: string,
    contentType: string
): Promise<string> {
    const r2Client = getR2Client();

    await r2Client.send(
        new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: objectKey,
            Body: fileData,
            ContentType: contentType,
        })
    );

    const signedUrl = await getSignedUrl(
        r2Client,
        new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: objectKey,
        }),
        { expiresIn: SIGNED_URL_EXPIRATION }
    );

    return signedUrl;
}

/**
 * Calculate points and CO2 saved based on item type and weight
 */
function calculateRewards(itemType: string, weight: number) {
    const basePoints: Record<string, number> = {
        smartphone: 50,
        laptop: 150,
        tablet: 80,
        battery: 30,
        charger: 20,
        monitor: 100,
        earphones: 15,
        "power bank": 40,
        "electronic device": 15,
    };

    const co2Savings: Record<string, number> = {
        smartphone: 70,
        laptop: 350,
        tablet: 100,
        battery: 15,
        charger: 10,
        monitor: 200,
        earphones: 5,
        "power bank": 25,
        "electronic device": 10,
    };

    const itemLower = itemType.toLowerCase();
    const base = basePoints[itemLower] || 15;
    const points = Math.round(base * Math.max(1, weight / 100));
    const co2Saved = co2Savings[itemLower] || 10;

    return { points, co2Saved };
}

/**
 * POST /api/deposits/upload
 * 
 * Upload image to R2, create transaction, update user points
 */
export async function POST(request: NextRequest) {
    console.log("[UPLOAD] Starting upload request...");

    try {
        // Get Clerk user from server-side auth
        let clerkUserId: string | null = null;
        let email = "";
        let username = "";

        try {
            const authResult = await auth();
            clerkUserId = authResult.userId;

            if (clerkUserId) {
                const clerkUser = await currentUser();
                if (clerkUser) {
                    email = clerkUser.emailAddresses[0]?.emailAddress || "";
                    username = clerkUser.username || clerkUser.firstName || clerkUser.id;
                }
            }
        } catch (authError) {
            console.warn("[UPLOAD] Auth error (continuing as anonymous):", authError);
        }

        // Allow anonymous uploads for testing (remove in production)
        if (!clerkUserId) {
            clerkUserId = `anon_${uuidv4().slice(0, 8)}`;
            email = `${clerkUserId}@anonymous.local`;
            username = "Anonymous User";
            console.log(`[UPLOAD] Anonymous upload: ${clerkUserId}`);
        }

        console.log(`[UPLOAD] User: ${clerkUserId}, email: ${email}`);

        // Check R2 configuration
        if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
            console.error("[UPLOAD] Missing R2 credentials");
            return NextResponse.json(
                {
                    success: false,
                    error: "Storage not configured",
                    detail: "R2 credentials are missing"
                },
                { status: 500 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const image = formData.get("image") as File | null;
        const itemType = formData.get("itemType") as string || "Electronic Device";
        const weight = parseFloat(formData.get("weight") as string || "100");
        const binId = formData.get("binId") as string || null;

        if (!image) {
            return NextResponse.json(
                { success: false, error: "No image file provided" },
                { status: 400 }
            );
        }

        console.log(`[UPLOAD] File: ${image.name}, size: ${image.size}, type: ${itemType}, weight: ${weight}g, bin: ${binId || "none"}`);

        // Upload to R2 first
        const arrayBuffer = await image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const objectKey = generateObjectKey(clerkUserId, image.name);

        console.log("[UPLOAD] Uploading to Cloudflare R2...");
        let signedUrl: string;
        try {
            signedUrl = await uploadToR2(buffer, objectKey, image.type || "image/jpeg");
            console.log("[UPLOAD] R2 upload successful!");
        } catch (r2Error) {
            console.error("[UPLOAD] R2 upload failed:", r2Error);
            return NextResponse.json(
                {
                    success: false,
                    error: "Image upload failed",
                    detail: r2Error instanceof Error ? r2Error.message : "R2 error",
                },
                { status: 500 }
            );
        }

        // Calculate rewards
        const { points, co2Saved } = calculateRewards(itemType, weight);
        const transactionId = uuidv4();

        // Try to save to Supabase (optional - don't fail if Supabase is down)
        let supabaseUserId = clerkUserId;
        let savedTransaction = null;

        try {
            const supabase = getSupabaseClient();

            // Find or create user
            console.log("[UPLOAD] Checking Supabase user...");
            const { data: existingUser } = await supabase
                .from("users")
                .select("id, total_points, total_co2_saved, items_recycled")
                .eq("clerk_id", clerkUserId)
                .single();

            if (existingUser) {
                supabaseUserId = existingUser.id;
                console.log(`[UPLOAD] Found existing user: ${supabaseUserId}`);

                // Update user totals
                await supabase
                    .from("users")
                    .update({
                        total_points: (existingUser.total_points || 0) + points,
                        total_co2_saved: (existingUser.total_co2_saved || 0) + co2Saved,
                        items_recycled: (existingUser.items_recycled || 0) + 1,
                    })
                    .eq("id", supabaseUserId);
            } else {
                // Create new user
                console.log("[UPLOAD] Creating new user...");
                const { data: newUser, error: createError } = await supabase
                    .from("users")
                    .insert({
                        clerk_id: clerkUserId,
                        email: email,
                        username: username,
                        role: "user",
                        total_points: points,
                        total_co2_saved: co2Saved,
                        items_recycled: 1,
                    })
                    .select("id")
                    .single();

                if (newUser) {
                    supabaseUserId = newUser.id;
                    console.log(`[UPLOAD] Created new user: ${supabaseUserId}`);
                } else if (createError) {
                    console.warn("[UPLOAD] Failed to create user:", createError.message);
                }
            }

            // Create transaction
            console.log("[UPLOAD] Creating transaction...");
            const { data: txData, error: txError } = await supabase
                .from("transactions")
                .insert({
                    id: transactionId,
                    user_id: supabaseUserId,
                    bin_id: binId || null,
                    item_type: itemType,
                    weight: weight,
                    points_earned: points,
                    co2_saved: co2Saved,
                    image_url: signedUrl,
                    r2_object_key: objectKey,
                    status: "completed",
                })
                .select()
                .single();

            if (txData) {
                savedTransaction = txData;
                console.log(`[UPLOAD] Transaction saved: ${transactionId}`);
            } else if (txError) {
                console.warn("[UPLOAD] Failed to save transaction:", txError.message);
            }

        } catch (dbError) {
            console.warn("[UPLOAD] Supabase error (continuing):", dbError);
            // Continue - R2 upload was successful
        }

        console.log(`[UPLOAD] Success! Points: ${points}, CO2: ${co2Saved}g`);

        return NextResponse.json(
            {
                success: true,
                message: "Image uploaded successfully",
                image_url: signedUrl,
                transaction_id: savedTransaction?.id || transactionId,
                item_type: itemType,
                weight: weight,
                points_earned: points,
                co2_saved: co2Saved,
                user: {
                    id: supabaseUserId,
                    clerk_id: clerkUserId,
                    email: email,
                },
                status: "completed",
                r2_object_key: objectKey,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("[UPLOAD] Unexpected error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Upload failed",
                detail: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
