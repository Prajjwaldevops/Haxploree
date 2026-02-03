"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload,
    Camera,
    Scale,
    Loader2,
    CheckCircle,
    Sparkles,
    ArrowRight,
    RotateCcw,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { simulateDetection, type DetectionResult } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Stage = "upload" | "analyzing" | "result";

export default function DepositPage() {
    const [stage, setStage] = useState<Stage>("upload");
    const [image, setImage] = useState<string | null>(null);
    const [weight, setWeight] = useState<string>("");
    const [result, setResult] = useState<DetectionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
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
        if (!image || !weight) {
            setError("Please upload an image and enter the weight");
            return;
        }

        const weightNum = parseFloat(weight);
        if (isNaN(weightNum) || weightNum <= 0) {
            setError("Please enter a valid weight");
            return;
        }

        setError(null);
        setStage("analyzing");

        try {
            const detectionResult = await simulateDetection(weightNum);
            setResult(detectionResult);
            setStage("result");
        } catch (err) {
            setError("Detection failed. Please try again.");
            setStage("upload");
        }
    };

    const handleReset = () => {
        setStage("upload");
        setImage(null);
        setWeight("");
        setResult(null);
        setError(null);
    };

    return (
        <main className="min-h-screen">
            <Navbar />

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

                        {/* Analyzing Stage */}
                        {stage === "analyzing" && (
                            <motion.div
                                key="analyzing"
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
                                    Analyzing Your E-Waste...
                                </h2>
                                <p className="text-slate-400">
                                    Our AI is identifying the item type and calculating your rewards
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
                                            Detection Successful!
                                        </h2>
                                        <p className="text-slate-400 mb-6">
                                            We&apos;ve identified your e-waste item
                                        </p>

                                        {/* Detection Details */}
                                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                                            <div className="bg-slate-800/50 rounded-xl p-4">
                                                <div className="text-sm text-slate-400 mb-1">Item Type</div>
                                                <div className="text-xl font-bold text-white">
                                                    {result.itemType}
                                                </div>
                                            </div>
                                            <div className="bg-slate-800/50 rounded-xl p-4">
                                                <div className="text-sm text-slate-400 mb-1">Confidence</div>
                                                <div className="text-xl font-bold text-emerald-400">
                                                    {(result.confidence * 100).toFixed(0)}%
                                                </div>
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
