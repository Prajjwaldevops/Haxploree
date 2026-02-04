import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

/**
 * Cloudflare R2 Configuration
 * R2 is S3-compatible, so we use the AWS SDK
 */
const r2Client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT_URL,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "haxploree-deposits";
const SIGNED_URL_EXPIRATION = parseInt(process.env.R2_SIGNED_URL_EXPIRATION || "3600");

/**
 * Supabase client for storing transaction records
 */
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/**
 * Generate a unique object key for the uploaded image
 */
function generateObjectKey(userId: string, filename: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const extension = filename.split(".").pop() || "jpg";
    return `deposits/${userId}/${timestamp}-${uuid}.${extension}`;
}

/**
 * Upload image to Cloudflare R2 and return signed URL
 */
async function uploadToR2(
    fileData: Buffer,
    objectKey: string,
    contentType: string
): Promise<string> {
    // Upload the file
    await r2Client.send(
        new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: objectKey,
            Body: fileData,
            ContentType: contentType,
        })
    );

    // Generate a signed URL for accessing the file
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
 * POST /api/deposits/upload
 * 
 * Upload an e-waste image to Cloudflare R2 and create a transaction record.
 */
export async function POST(request: NextRequest) {
    console.log("[UPLOAD] Starting upload request...");

    try {
        // Check R2 configuration
        if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
            console.error("[UPLOAD] R2 credentials not configured");
            return NextResponse.json(
                {
                    success: false,
                    error: "Storage not configured",
                    detail: "R2 credentials are missing. Please configure R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.",
                },
                { status: 500 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const image = formData.get("image") as File | null;

        if (!image) {
            return NextResponse.json(
                {
                    success: false,
                    error: "No image file provided",
                },
                { status: 400 }
            );
        }

        // Get user ID from auth header (simplified - in production use proper auth)
        const authHeader = request.headers.get("Authorization");
        let userId = "anonymous";
        if (authHeader && authHeader.startsWith("Bearer ")) {
            // Extract user ID from token (simplified)
            userId = "user_" + uuidv4().slice(0, 8);
        }

        console.log(`[UPLOAD] Processing file: ${image.name}, size: ${image.size} bytes`);

        // Convert File to Buffer
        const arrayBuffer = await image.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate unique object key
        const objectKey = generateObjectKey(userId, image.name);
        console.log(`[UPLOAD] Object key: ${objectKey}`);

        // Upload to R2
        console.log("[UPLOAD] Uploading to Cloudflare R2...");
        const signedUrl = await uploadToR2(buffer, objectKey, image.type || "image/jpeg");
        console.log("[UPLOAD] Upload successful!");

        // Generate transaction ID
        const transactionId = uuidv4();

        // Try to save to Supabase (optional - won't fail if Supabase is down)
        let supabaseRecord = null;
        try {
            // First, ensure user exists or create them
            const { data: existingUser } = await supabase
                .from("users")
                .select("id")
                .eq("clerk_id", userId)
                .single();

            let supabaseUserId: string;
            if (existingUser) {
                supabaseUserId = existingUser.id;
            } else {
                // Create new user
                const { data: newUser, error: userError } = await supabase
                    .from("users")
                    .insert({
                        clerk_id: userId,
                        email: `${userId}@placeholder.com`,
                        total_points: 0,
                    })
                    .select("id")
                    .single();

                if (userError) {
                    console.warn("[UPLOAD] Could not create user:", userError.message);
                    supabaseUserId = userId;
                } else {
                    supabaseUserId = newUser.id;
                }
            }

            // Create transaction record
            const { data, error } = await supabase
                .from("transactions")
                .insert({
                    id: transactionId,
                    user_id: supabaseUserId,
                    image_url: signedUrl,
                    r2_object_key: objectKey,
                    status: "pending",
                    points_earned: 0,
                })
                .select()
                .single();

            if (error) {
                console.warn("[UPLOAD] Could not save to Supabase:", error.message);
            } else {
                supabaseRecord = data;
                console.log("[UPLOAD] Transaction saved to Supabase");
            }
        } catch (dbError) {
            console.warn("[UPLOAD] Supabase operation failed:", dbError);
            // Continue anyway - R2 upload was successful
        }

        // Return success response
        return NextResponse.json(
            {
                success: true,
                message: "Image uploaded successfully to Cloudflare R2",
                image_url: signedUrl,
                transaction_id: supabaseRecord?.id || transactionId,
                r2_object_key: objectKey,
                status: "pending",
            },
            { status: 201 }
        );

    } catch (error) {
        console.error("[UPLOAD] Error:", error);

        // Check for specific R2 errors
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const isR2Error = errorMessage.includes("S3") || errorMessage.includes("R2") ||
            errorMessage.includes("SignatureDoesNotMatch") ||
            errorMessage.includes("AccessDenied");

        return NextResponse.json(
            {
                success: false,
                error: isR2Error ? "Cloud storage error" : "Upload failed",
                detail: errorMessage,
            },
            { status: 500 }
        );
    }
}
