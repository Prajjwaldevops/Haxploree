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
const ML_API_URL = "https://adii-2685-e-waste-api.hf.space/predict";

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
 * Call ML Model API
 */
async function analyzeImageWithML(imageUrl: string) {
    try {
        console.log(`[ML API] Calling ${ML_API_URL} with image: ${imageUrl}`);
        const response = await fetch(ML_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ image_url: imageUrl }),
        });

        if (!response.ok) {
            throw new Error(`ML API responded with status: ${response.status}`);
        }

        const data: any = await response.json();
        // console.log("[ML API] Response Data:", JSON.stringify(data).substring(0, 100)); // Debug log

        // Handle Array response (List of { label, score })
        if (Array.isArray(data) && data.length > 0) {
            // Find item with max score
            const maxScoreItem = data.reduce((prev, current) =>
                (prev.score > current.score) ? prev : current
            );

            return {
                result: maxScoreItem.label,
                accuracy: maxScoreItem.score
            };
        }

        // Handle Object response (if API changes format or is single object)
        if (data.label && data.score) {
            return {
                result: data.label,
                accuracy: data.score
            };
        }

        return data;
    } catch (error) {
        console.error("[ML API] Error:", error);
        return null;
    }
}

/**
 * Calculate random points and CO2 saved
 */
function calculateRandomRewards() {
    // Generate random points between 10 and 100
    const points = Math.floor(Math.random() * (100 - 10 + 1)) + 10;

    // Estimate CO2 saved roughly based on points (just for display consistency)
    // Assuming 1 point ~= 2g CO2 saved on average for this random logic
    const co2Saved = points * 2;

    return { points, co2Saved };
}

/**
 * POST /api/deposits/upload
 * 
 * Upload image to R2, analyze with ML, create transaction, update user points
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
        const weight = parseFloat(formData.get("weight") as string || "100");
        const binId = formData.get("binId") as string || null;

        if (!image) {
            return NextResponse.json(
                { success: false, error: "No image file provided" },
                { status: 400 }
            );
        }

        console.log(`[UPLOAD] File: ${image.name}, size: ${image.size}, weight: ${weight}g, bin: ${binId || "none"}`);

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

        // Analyze with ML
        console.log("[UPLOAD] Analyzing with ML model...");
        const mlResult = await analyzeImageWithML(signedUrl);

        // Fallback if ML fails, or use result
        // Assuming Response format: { "result": "class_name", "accuracy": 0.99 }
        const itemType = mlResult?.result || "Electronic Device";
        const confidence = mlResult?.accuracy || 0.0;

        // Calculate random rewards
        const { points, co2Saved } = calculateRandomRewards();
        const transactionId = uuidv4();

        console.log(`[UPLOAD] ML Result - Item: ${itemType}, Confidence: ${confidence}`);
        console.log(`[UPLOAD] Rewards - Points: ${points}, CO2: ${co2Saved}g`);

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
                    // metadata: { confidence: confidence } // Store confidence if possible, or omit
                })
                .select()
                .single();

            if (txData) {
                savedTransaction = txData;
            } else if (txError) {
                console.warn("[UPLOAD] Failed to save transaction:", txError.message);
            }

        } catch (dbError) {
            console.warn("[UPLOAD] Supabase error (continuing):", dbError);
        }

        return NextResponse.json(
            {
                success: true,
                message: "Image uploaded and analyzed successfully",
                image_url: signedUrl,
                transaction_id: savedTransaction?.id || transactionId,
                item_type: itemType,
                item_confidence: confidence, // Return confidence to frontend
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
