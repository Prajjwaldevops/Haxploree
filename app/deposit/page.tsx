"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import {
    Upload,
    Camera,
    Scale,
    Loader2,
    CheckCircle,
    Sparkles,
    ArrowRight,
    RotateCcw,
    AlertCircle,
    CloudUpload,
    X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useUserLocation } from "@/lib/useUserLocation";
import { MapBin } from "@/lib/mapbox";

type Stage = "upload" | "uploading" | "processing" | "result" | "error";

// Response type from the API
interface UploadResponse {
    success: boolean;
    message?: string;
    image_url?: string;
    transaction_id?: string;
    item_type?: string;
    weight?: number;
    points_earned?: number;
    co2_saved?: number;
    status?: string;
    error?: string;
    detail?: string;
    user?: {
        id: string;
        clerk_id: string;
        email: string;
        total_points: number;
    };
}

// Detection result
interface DetectionResult {
    itemType: string;
    confidence: number;
    points: number;
    co2Saved: number;
    transactionId: string;
    imageUrl: string;
}

// Toast notification type
interface Toast {
    id: string;
    type: "success" | "error";
    message: string;
}

// Estimate item type based on weight (will be replaced with ML model)
function getItemTypeFromWeight(weight: number): string {
    if (weight >= 100 && weight <= 250) return 'Smartphone';
    if (weight > 1000 && weight <= 3000) return 'Laptop';
    if (weight > 250 && weight <= 600) return 'Tablet';
    if (weight > 3000) return 'Monitor';
    if (weight < 100 && weight >= 20) return 'Battery';
    if (weight >= 600 && weight <= 1000) return 'Power Bank';
    return 'Electronic Device';
}

// Toast Component
function ToastNotification({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={cn(
                "fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl border",
                toast.type === "success"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-red-500/20 border-red-500/40 text-red-300"
            )}
        >
            {toast.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-emerald-400" />
            ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
            )}
            <span className="font-medium">{toast.message}</span>
            <button
                onClick={onClose}
                className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </motion.div>
    );
}

export default function DepositPage() {
    const [stage, setStage] = useState<Stage>("upload");
    const [image, setImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [weight, setWeight] = useState<string>("");
    const [result, setResult] = useState<DetectionResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<string>("");
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [bins, setBins] = useState<MapBin[]>([]);

    const { isSignedIn } = useUser();
    const { nearestDistance, isLoading: isLocationLoading, error: locationError } = useUserLocation(bins);

    // Fetch bins for location check
    useEffect(() => {
        fetch("/api/admin/bins")
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.bins)) {
                    setBins(data.bins.filter((b: MapBin) => b.is_operational));
                }
            })
            .catch(err => console.error("Error fetching bins:", err));
    }, []);

    // Add toast notification
    const addToast = (type: "success" | "error", message: string) => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setToasts(prev => [...prev, { id, type, message }]);
    };

    // Remove toast notification
    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
        maxFiles: 1,
    });

    const handleAnalyze = async () => {
        if (!image || !imageFile || !weight) {
            setError("Please upload an image and enter the weight");
            return;
        }

        if (!isSignedIn) {
            setError("Please sign in to deposit e-waste");
            return;
        }

        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum <= 0) {
            setError("Please enter a valid weight");
            return;
        }

        // Location Check
        if (isLocationLoading) {
            setError("Checking your location... Please wait.");
            return;
        }

        if (locationError) {
            setError("Location error: " + locationError);
            return;
        }

        // 200m radius = 0.2 km
        if (nearestDistance === null || nearestDistance > 0.2) {
            setError("You are not in the location area. Please go within 200m of a dustbin.");
            return;
        }

        setError(null);
        setStage("uploading");
        setUploadProgress("Connecting to server...");

        try {
            setUploadProgress("Uploading image to cloud storage...");


            // Prepare form data with image, weight, and item type
            const formData = new FormData();
            formData.append("image", imageFile);
            formData.append("weight", weight);
            // Simple item type detection based on weight (will be replaced with ML)
            const estimatedItemType = getItemTypeFromWeight(weightNum);
            formData.append("itemType", estimatedItemType);

            // Send to API route
            const response = await fetch(`/api/deposits/upload`, {
                method: "POST",
                body: formData,
            });

            const data: UploadResponse = await response.json();

            if (!response.ok || !data.success) {
                addToast("error", "❌ Image upload failed! Please try again.");
                throw new Error(data.error || data.detail || "Upload failed");
            }

            // Show success toast
            addToast("success", `✅ Deposit recorded! You earned ${data.points_earned} points!`);

            // Move to processing then result
            setStage("processing");
            setUploadProgress("Processing your deposit...");

            // Brief delay for UX
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Use actual data from API response
            setResult({
                itemType: data.item_type || estimatedItemType,
                confidence: 0.92, // Will be from ML model later
                points: data.points_earned || 0,
                co2Saved: data.co2_saved || 0,
                transactionId: data.transaction_id || "",
                imageUrl: data.image_url || "",
            });

            setStage("result");

        } catch (err) {
            console.error("Upload error:", err);
            const errorMessage = err instanceof Error ? err.message : "Upload failed. Please try again.";
            setError(errorMessage);

            // Only add toast if not already added (for R2 failure)
            if (!errorMessage.includes("Upload failed")) {
                addToast("error", "❌ " + errorMessage);
            }

            setStage("error");
        }
    };

    const handleReset = () => {
        setStage("upload");
        setImage(null);
        setImageFile(null);
        setWeight("");
        setResult(null);
        setError(null);
        setUploadProgress("");
    };

    return (
        <main className="min-h-screen">
            <Navbar />

            {/* Toast Notifications */}
            <AnimatePresence>
                {toasts.map(toast => (
                    <ToastNotification
                        key={toast.id}
                        toast={toast}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </AnimatePresence>

            <div className="container mx-auto px-4 lg:px-8 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                        Deposit E-Waste
                    </h1>
                    <p className="text-slate-400">
                        Upload a photo of your e-waste and let our AI identify it
                    </p>
                </div>

                <div className="max-w-2xl mx-auto">
                    <AnimatePresence mode="wait">
                        {/* Upload Stage */}
                        {stage === "upload" && (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* Image Upload */}
                                <div
                                    {...getRootProps()}
                                    className={cn(
                                        "glass-card p-8 cursor-pointer transition-all duration-300 border-2 border-dashed",
                                        isDragActive
                                            ? "border-emerald-500 bg-emerald-500/10"
                                            : "border-white/20 hover:border-white/40"
                                    )}
                                >
                                    <input {...getInputProps()} />
                                    {image ? (
                                        <div className="text-center">
                                            <img
                                                src={image}
                                                alt="Uploaded e-waste"
                                                className="max-h-64 mx-auto rounded-lg mb-4"
                                            />
                                            <p className="text-sm text-slate-400">
                                                Click or drag to replace image
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <div className="inline-flex p-4 rounded-full bg-emerald-500/20 mb-4">
                                                <Camera className="h-8 w-8 text-emerald-400" />
                                            </div>
                                            <p className="text-white font-medium mb-2">
                                                {isDragActive
                                                    ? "Drop the image here..."
                                                    : "Upload E-Waste Image"}
                                            </p>
                                            <p className="text-sm text-slate-400">
                                                Drag & drop or click to select (JPEG, PNG, WebP)
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Weight Input */}
                                <div className="glass-card p-6">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        <div className="flex items-center gap-2">
                                            <Scale className="h-4 w-4" />
                                            Weight (grams)
                                        </div>
                                    </label>
                                    <input
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        placeholder="Enter weight in grams (e.g., 180)"
                                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        Tip: Smartphones are 100-250g, Laptops are 1000-3000g
                                    </p>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    onClick={handleAnalyze}
                                    disabled={!image || !weight}
                                    className={cn(
                                        "w-full py-4 rounded-xl font-semibold text-black flex items-center justify-center gap-2 transition-all duration-300",
                                        image && weight
                                            ? "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] cursor-pointer"
                                            : "bg-slate-700 text-slate-400 cursor-not-allowed"
                                    )}
                                >
                                    <Sparkles className="h-5 w-5" />
                                    Analyze with AI
                                </button>
                            </motion.div>
                        )}

                        {/* Uploading Stage */}
                        {stage === "uploading" && (
                            <motion.div
                                key="uploading"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-card p-12 text-center"
                            >
                                <div className="relative inline-flex mb-6">
                                    <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping" />
                                    <div className="relative p-6 bg-cyan-500/20 rounded-full">
                                        <CloudUpload className="h-12 w-12 text-cyan-400 animate-bounce" />
                                    </div>
                                </div>
                                <h2 className="text-xl font-semibold text-white mb-2">
                                    Uploading to Cloud Storage...
                                </h2>
                                <p className="text-slate-400 mb-4">
                                    {uploadProgress}
                                </p>
                                <div className="w-full max-w-xs mx-auto bg-slate-800/50 rounded-full h-2 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                                        initial={{ width: "0%" }}
                                        animate={{ width: "70%" }}
                                        transition={{ duration: 2, ease: "easeOut" }}
                                    />
                                </div>
                                <div className="mt-6 flex justify-center gap-1">
                                    {[0, 1, 2].map((i) => (
                                        <div
                                            key={i}
                                            className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                                            style={{ animationDelay: `${i * 0.1}s` }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Processing Stage */}
                        {stage === "processing" && (
                            <motion.div
                                key="processing"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-card p-12 text-center"
                            >
                                <div className="relative inline-flex mb-6">
                                    <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                                    <div className="relative p-6 bg-emerald-500/20 rounded-full">
                                        <Loader2 className="h-12 w-12 text-emerald-400 animate-spin" />
                                    </div>
                                </div>
                                <h2 className="text-xl font-semibold text-white mb-2">
                                    Image Uploaded Successfully! ✅
                                </h2>
                                <p className="text-emerald-400 font-medium mb-4">
                                    Your image has been stored in the cloud.
                                </p>

                                {/* Processing Message */}
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
                                    <p className="text-amber-300 text-sm">
                                        🔄 <strong>AI Processing:</strong> Our ML model is being integrated.
                                        <br />
                                        For now, we&apos;re using estimated values based on weight.
                                    </p>
                                </div>

                                <p className="text-slate-400">
                                    Preparing your results...
                                </p>
                                <div className="mt-6 flex justify-center gap-1">
                                    {[0, 1, 2].map((i) => (
                                        <div
                                            key={i}
                                            className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                                            style={{ animationDelay: `${i * 0.1}s` }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Error Stage */}
                        {stage === "error" && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="glass-card p-12 text-center"
                            >
                                <div className="inline-flex p-4 rounded-full bg-red-500/20 mb-4">
                                    <AlertCircle className="h-12 w-12 text-red-400" />
                                </div>
                                <h2 className="text-xl font-semibold text-white mb-2">
                                    Upload Failed
                                </h2>
                                <p className="text-slate-400 mb-2">
                                    Image could not be uploaded to cloud storage.
                                </p>
                                <p className="text-red-400 text-sm mb-6">
                                    {error || "Something went wrong. Please try again."}
                                </p>
                                <button
                                    onClick={handleReset}
                                    className="py-3 px-6 rounded-xl font-medium glass-panel hover:bg-white/10 text-white flex items-center justify-center gap-2 transition-colors mx-auto"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Try Again
                                </button>
                            </motion.div>
                        )}

                        {/* Result Stage */}
                        {stage === "result" && result && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-6"
                            >
                                {/* Success Card */}
                                <div className="glass-card p-8 text-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10" />
                                    <div className="relative">
                                        <div className="inline-flex p-4 rounded-full bg-emerald-500/20 mb-4">
                                            <CheckCircle className="h-12 w-12 text-emerald-400" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-2">
                                            Deposit Successful!
                                        </h2>
                                        <p className="text-slate-400 mb-6">
                                            Your e-waste has been recorded and image stored
                                        </p>

                                        {/* Detection Details */}
                                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                                            <div className="bg-slate-800/50 rounded-xl p-4">
                                                <div className="text-sm text-slate-400 mb-1">Detected Item</div>
                                                <div className="text-xl font-bold text-white">
                                                    {result.itemType}
                                                </div>
                                            </div>
                                            <div className="bg-slate-800/50 rounded-xl p-4">
                                                <div className="text-sm text-slate-400 mb-1">Confidence</div>
                                                <div className="text-xl font-bold text-emerald-400">
                                                    {(result.confidence * 100).toFixed(0)}%
                                                </div>
                                                <div className="text-xs text-amber-400 mt-1">
                                                    (Estimated - ML coming soon)
                                                </div>
                                            </div>
                                        </div>

                                        {/* Transaction ID */}
                                        <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                                            <div className="text-sm text-slate-400 mb-1">Transaction ID</div>
                                            <div className="text-sm font-mono text-white break-all">
                                                {result.transactionId}
                                            </div>
                                        </div>

                                        {/* Cloud Storage Status */}
                                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
                                            <div className="flex items-center justify-center gap-2 text-emerald-400">
                                                <CheckCircle className="h-5 w-5" />
                                                <span className="font-medium">Image stored in Cloudflare R2</span>
                                            </div>
                                        </div>

                                        {/* Rewards */}
                                        <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl p-6 border border-emerald-500/30">
                                            <div className="text-sm text-emerald-300 mb-2">
                                                🎉 You Earned
                                            </div>
                                            <div className="text-4xl font-bold text-white mb-2">
                                                +{result.points} Points
                                            </div>
                                            <div className="text-sm text-slate-400">
                                                And saved approximately{" "}
                                                <span className="text-emerald-400 font-medium">
                                                    {result.co2Saved}g CO₂
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleReset}
                                        className="flex-1 py-3 rounded-xl font-medium glass-panel hover:bg-white/10 text-white flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Deposit Another
                                    </button>
                                    <a
                                        href="/dashboard"
                                        className="flex-1 py-3 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-black flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                                    >
                                        View Dashboard
                                        <ArrowRight className="h-4 w-4" />
                                    </a>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </main>
    );
}
