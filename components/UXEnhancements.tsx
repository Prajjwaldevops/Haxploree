"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wifi,
    WifiOff,
    Shield,
    Info,
    X,
    ChevronRight,
    Eye,
    EyeOff,
    Volume2,
    VolumeX,
    ZoomIn,
    ZoomOut,
    Sun,
    Moon,
    Award,
    Flame,
    Trophy,
    Star,
    HelpCircle,
    CheckCircle,
    AlertTriangle,
    Loader2,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// =========================
// CONNECTION STATUS INDICATOR
// =========================
interface ConnectionStatusProps {
    isOnline: boolean;
    queuedCount?: number;
    onSync?: () => void;
}

export function ConnectionStatus({ isOnline, queuedCount = 0, onSync }: ConnectionStatusProps) {
    if (isOnline && queuedCount === 0) return null;

    return (
        <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className={cn(
                "fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-3 py-2 px-4 text-sm font-medium",
                isOnline ? "bg-emerald-500/90" : "bg-yellow-500/90"
            )}
        >
            {isOnline ? (
                <>
                    <Wifi className="h-4 w-4" />
                    <span>Back online!</span>
                    {queuedCount > 0 && (
                        <button
                            onClick={onSync}
                            className="ml-2 px-3 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
                        >
                            Sync {queuedCount} pending action{queuedCount > 1 ? "s" : ""}
                        </button>
                    )}
                </>
            ) : (
                <>
                    <WifiOff className="h-4 w-4" />
                    <span>You&apos;re offline. Actions will be saved and synced when connected.</span>
                </>
            )}
        </motion.div>
    );
}

// =========================
// AI CONFIDENCE SCORE
// =========================
interface ConfidenceScoreProps {
    score: number; // 0-100
    itemName: string;
    onLearnMore?: () => void;
}

export function ConfidenceScore({ score, itemName, onLearnMore }: ConfidenceScoreProps) {
    const [showDetails, setShowDetails] = useState(false);

    const getScoreColor = () => {
        if (score >= 90) return "text-emerald-400 bg-emerald-500/20";
        if (score >= 70) return "text-yellow-400 bg-yellow-500/20";
        return "text-orange-400 bg-orange-500/20";
    };

    const getScoreLabel = () => {
        if (score >= 90) return "High Confidence";
        if (score >= 70) return "Moderate Confidence";
        return "Low Confidence";
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-3">
                <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg", getScoreColor())}>
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">{score}% {getScoreLabel()}</span>
                </div>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-slate-400 hover:text-white transition-colors"
                >
                    <HelpCircle className="h-5 w-5" />
                </button>
            </div>

            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="glass-card p-4 text-sm">
                            <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-cyan-400" />
                                How AI Identified This Item
                            </h4>
                            <p className="text-slate-400 mb-3">
                                Our AI analyzed the item using image recognition and matched it against our database
                                of 50,000+ e-waste items. The confidence score indicates how certain we are about
                                the classification.
                            </p>
                            <div className="space-y-2 text-slate-300">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                                    <span>Shape and size analysis: Matched</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                                    <span>Material detection: Electronic components detected</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                                    <span>Category: {itemName}</span>
                                </div>
                            </div>
                            {score < 90 && (
                                <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                                    <p className="text-yellow-400 text-xs">
                                        <AlertTriangle className="h-4 w-4 inline mr-1" />
                                        The AI is not fully certain. You can confirm or correct the item type below.
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// =========================
// ONBOARDING TOOLTIP
// =========================
interface OnboardingTooltipProps {
    step: number;
    totalSteps: number;
    title: string;
    description: string;
    position?: "top" | "bottom" | "left" | "right";
    onNext?: () => void;
    onSkip?: () => void;
    onComplete?: () => void;
}

export function OnboardingTooltip({
    step,
    totalSteps,
    title,
    description,
    position = "bottom",
    onNext,
    onSkip,
    onComplete,
}: OnboardingTooltipProps) {
    const isLast = step === totalSteps;

    const positionClasses = {
        top: "bottom-full mb-2",
        bottom: "top-full mt-2",
        left: "right-full mr-2",
        right: "left-full ml-2",
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
                "absolute z-50 w-72 p-4 rounded-xl bg-slate-900 border border-emerald-500/30 shadow-2xl",
                positionClasses[position]
            )}
        >
            {/* Progress dots */}
            <div className="flex gap-1.5 mb-3">
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "h-1.5 rounded-full transition-all",
                            i < step ? "bg-emerald-500 w-4" : i === step ? "bg-emerald-400 w-6" : "bg-slate-600 w-4"
                        )}
                    />
                ))}
            </div>

            <h4 className="font-semibold text-white mb-1">{title}</h4>
            <p className="text-sm text-slate-400 mb-4">{description}</p>

            <div className="flex items-center justify-between">
                <button
                    onClick={onSkip}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                    Skip tour
                </button>
                <button
                    onClick={isLast ? onComplete : onNext}
                    className="flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-medium text-sm transition-colors"
                >
                    {isLast ? "Get Started" : "Next"}
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </motion.div>
    );
}

// =========================
// ACCESSIBILITY CONTROLS
// =========================
interface AccessibilityControlsProps {
    onClose?: () => void;
}

export function AccessibilityControls({ onClose }: AccessibilityControlsProps) {
    const [fontSize, setFontSize] = useState(100);
    const [highContrast, setHighContrast] = useState(false);
    const [voiceFeedback, setVoiceFeedback] = useState(false);

    useEffect(() => {
        document.documentElement.style.fontSize = `${fontSize}%`;
        if (highContrast) {
            document.body.classList.add("high-contrast");
        } else {
            document.body.classList.remove("high-contrast");
        }
    }, [fontSize, highContrast]);

    const speak = (text: string) => {
        if (voiceFeedback && "speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            speechSynthesis.speak(utterance);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-50 glass-card p-4 w-64"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Accessibility</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Font Size */}
            <div className="mb-4">
                <label className="text-sm text-slate-400 block mb-2">Text Size</label>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            setFontSize((p) => Math.max(80, p - 10));
                            speak("Text size decreased");
                        }}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                    >
                        <ZoomOut className="h-5 w-5 text-white" />
                    </button>
                    <div className="flex-1 text-center text-white font-medium">{fontSize}%</div>
                    <button
                        onClick={() => {
                            setFontSize((p) => Math.min(150, p + 10));
                            speak("Text size increased");
                        }}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                    >
                        <ZoomIn className="h-5 w-5 text-white" />
                    </button>
                </div>
            </div>

            {/* High Contrast */}
            <div className="mb-4">
                <button
                    onClick={() => {
                        setHighContrast(!highContrast);
                        speak(highContrast ? "High contrast disabled" : "High contrast enabled");
                    }}
                    className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg transition-colors",
                        highContrast ? "bg-white text-black" : "bg-white/10 text-white"
                    )}
                >
                    <span className="flex items-center gap-2">
                        {highContrast ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        High Contrast
                    </span>
                    <span className="text-sm">{highContrast ? "ON" : "OFF"}</span>
                </button>
            </div>

            {/* Voice Feedback */}
            <div>
                <button
                    onClick={() => {
                        setVoiceFeedback(!voiceFeedback);
                        if (!voiceFeedback) {
                            const utterance = new SpeechSynthesisUtterance("Voice feedback enabled");
                            speechSynthesis.speak(utterance);
                        }
                    }}
                    className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg transition-colors",
                        voiceFeedback ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/10 text-white"
                    )}
                >
                    <span className="flex items-center gap-2">
                        {voiceFeedback ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                        Voice Feedback
                    </span>
                    <span className="text-sm">{voiceFeedback ? "ON" : "OFF"}</span>
                </button>
            </div>
        </motion.div>
    );
}

// =========================
// ACHIEVEMENT BADGE
// =========================
interface AchievementBadgeProps {
    type: "first_deposit" | "streak_7" | "eco_warrior" | "recycler_pro" | "milestone";
    title: string;
    description: string;
    points?: number;
    isNew?: boolean;
    onDismiss?: () => void;
}

export function AchievementBadge({ type, title, description, points, isNew, onDismiss }: AchievementBadgeProps) {
    const getIcon = () => {
        switch (type) {
            case "first_deposit": return <Star className="h-8 w-8 text-yellow-400" />;
            case "streak_7": return <Flame className="h-8 w-8 text-orange-400" />;
            case "eco_warrior": return <Trophy className="h-8 w-8 text-emerald-400" />;
            case "recycler_pro": return <Award className="h-8 w-8 text-purple-400" />;
            case "milestone": return <CheckCircle className="h-8 w-8 text-cyan-400" />;
        }
    };

    if (isNew) {
        return (
            <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={onDismiss}
            >
                <motion.div
                    initial={{ y: 50 }}
                    animate={{ y: 0 }}
                    className="glass-card p-8 text-center max-w-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50 flex items-center justify-center"
                    >
                        {getIcon()}
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <h3 className="text-2xl font-bold text-white mb-2">🎉 Achievement Unlocked!</h3>
                        <h4 className="text-xl font-semibold text-gradient mb-2">{title}</h4>
                        <p className="text-slate-400 mb-4">{description}</p>
                        {points && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400">
                                <Sparkles className="h-4 w-4" />
                                +{points} Bonus Points
                            </div>
                        )}
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        onClick={onDismiss}
                        className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold"
                    >
                        Awesome!
                    </motion.button>
                </motion.div>

                {/* Confetti effect */}
                <Confetti />
            </motion.div>
        );
    }

    // Static badge display
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
            <div className="p-2 rounded-lg bg-white/10">{getIcon()}</div>
            <div>
                <p className="font-medium text-white">{title}</p>
                <p className="text-xs text-slate-400">{description}</p>
            </div>
        </div>
    );
}

// Confetti animation component
function Confetti() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                    key={i}
                    initial={{
                        x: "50vw",
                        y: "50vh",
                        scale: 0,
                        rotate: 0,
                    }}
                    animate={{
                        x: `${Math.random() * 100}vw`,
                        y: `${Math.random() * 100}vh`,
                        scale: [0, 1, 1, 0],
                        rotate: Math.random() * 720 - 360,
                    }}
                    transition={{
                        duration: 2 + Math.random(),
                        ease: "easeOut",
                        delay: Math.random() * 0.3,
                    }}
                    className={cn(
                        "absolute w-3 h-3 rounded-sm",
                        ["bg-emerald-400", "bg-cyan-400", "bg-yellow-400", "bg-purple-400", "bg-pink-400"][
                        Math.floor(Math.random() * 5)
                        ]
                    )}
                />
            ))}
        </div>
    );
}

// =========================
// PRIVACY NOTICE
// =========================
interface PrivacyNoticeProps {
    type?: "banner" | "modal";
    onAccept?: () => void;
    onDecline?: () => void;
}

export function PrivacyNotice({ type = "banner", onAccept, onDecline }: PrivacyNoticeProps) {
    const [showDetails, setShowDetails] = useState(false);

    if (type === "banner") {
        return (
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-slate-900 border-t border-white/10"
            >
                <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Shield className="h-6 w-6 text-emerald-400 flex-shrink-0" />
                        <p className="text-sm text-slate-300">
                            We collect minimal data to provide our service. Your deposit history is stored locally.
                            <button
                                onClick={() => setShowDetails(!showDetails)}
                                className="text-emerald-400 hover:underline ml-1"
                            >
                                Learn more
                            </button>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onDecline}
                            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
                        >
                            Decline Optional
                        </button>
                        <button
                            onClick={onAccept}
                            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-medium transition-colors"
                        >
                            Accept All
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {showDetails && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="container mx-auto mt-4 overflow-hidden"
                        >
                            <div className="p-4 rounded-lg bg-white/5 text-sm space-y-2">
                                <p className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                                    <strong>Required:</strong> Deposit data for tracking and rewards
                                </p>
                                <p className="flex items-center gap-2 text-slate-300">
                                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                                    <strong>Required:</strong> Location data for finding nearby bins
                                </p>
                                <p className="flex items-center gap-2 text-slate-400">
                                    <Eye className="h-4 w-4" />
                                    <strong>Optional:</strong> Analytics to improve our service
                                </p>
                                <p className="flex items-center gap-2 text-slate-400">
                                    <EyeOff className="h-4 w-4" />
                                    <strong>Never:</strong> We never sell your data
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    }

    return null;
}

// =========================
// ERROR STATE COMPONENT
// =========================
interface ErrorStateProps {
    title?: string;
    message: string;
    onRetry?: () => void;
    onManual?: () => void;
    isLoading?: boolean;
}

export function ErrorState({ title = "Something went wrong", message, onRetry, onManual, isLoading }: ErrorStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8"
        >
            <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center"
            >
                <AlertTriangle className="h-8 w-8 text-red-400" />
            </motion.div>

            <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">{message}</p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {onRetry && (
                    <button
                        onClick={onRetry}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-medium disabled:opacity-50 transition-colors"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <ChevronRight className="h-5 w-5" />
                                Try Again
                            </>
                        )}
                    </button>
                )}
                {onManual && (
                    <button
                        onClick={onManual}
                        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                        Enter Manually
                    </button>
                )}
            </div>
        </motion.div>
    );
}

// =========================
// STREAKS DISPLAY
// =========================
interface StreaksDisplayProps {
    currentStreak: number;
    longestStreak: number;
    lastDeposit?: Date;
}

export function StreaksDisplay({ currentStreak, longestStreak, lastDeposit }: StreaksDisplayProps) {
    const daysUntilReset = lastDeposit
        ? Math.max(0, 1 - Math.floor((Date.now() - lastDeposit.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    return (
        <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-400" />
                    Your Streak
                </h3>
                {daysUntilReset > 0 && (
                    <span className="text-xs text-slate-400">
                        Deposit today to keep your streak!
                    </span>
                )}
            </div>

            <div className="flex gap-4">
                <div className="flex-1 text-center p-3 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30">
                    <p className="text-3xl font-bold text-orange-400">{currentStreak}</p>
                    <p className="text-xs text-slate-400">Current Streak</p>
                </div>
                <div className="flex-1 text-center p-3 rounded-lg bg-white/5">
                    <p className="text-3xl font-bold text-white">{longestStreak}</p>
                    <p className="text-xs text-slate-400">Longest Streak</p>
                </div>
            </div>

            {/* Weekly progress */}
            <div className="mt-4 flex gap-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                    <div key={i} className="flex-1 text-center">
                        <div
                            className={cn(
                                "w-full aspect-square rounded-lg flex items-center justify-center text-xs",
                                i < currentStreak % 7
                                    ? "bg-gradient-to-br from-orange-500 to-red-500 text-black font-bold"
                                    : "bg-white/10 text-slate-500"
                            )}
                        >
                            {day}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
