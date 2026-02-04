"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Smartphone,
    QrCode,
    Check,
    AlertTriangle,
    Recycle,
    Leaf,
    Battery,
    ChevronDown,
    Scan,
    Loader2,
    Home,
    Wrench,
    Zap,
    Globe,
    Settings,
    HelpCircle,
    Shield,
    Flame,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { translations, languageOptions, type Language, type Translations } from "@/lib/translations";
import { useConnection } from "@/lib/useConnection";
import {
    ConnectionStatus,
    ConfidenceScore,
    OnboardingTooltip,
    AccessibilityControls,
    AchievementBadge,
    StreaksDisplay,
} from "@/components/UXEnhancements";

// Types
type BinStatus = "operational" | "full" | "maintenance";
type ScreenState = "idle" | "scan" | "deposit" | "complete" | "unavailable" | "onboarding";

interface DepositResult {
    itemType: string;
    weight: number;
    points: number;
    co2Saved: number;
    confidence: number;
}

// Mock e-waste items for simulation with confidence scores
const mockItems = [
    { type: "Smartphone", weight: 0.18, points: 50, co2: 2.5, confidence: 94 },
    { type: "Tablet", weight: 0.45, points: 75, co2: 4.2, confidence: 89 },
    { type: "Laptop Battery", weight: 0.35, points: 60, co2: 3.8, confidence: 92 },
    { type: "Charger", weight: 0.12, points: 25, co2: 1.2, confidence: 97 },
    { type: "Earphones", weight: 0.05, points: 15, co2: 0.6, confidence: 85 },
    { type: "Power Bank", weight: 0.25, points: 40, co2: 2.1, confidence: 91 },
];

// Onboarding steps
const onboardingSteps = [
    {
        title: "Welcome to Smart Bin!",
        description: "This kiosk helps you recycle e-waste and earn rewards. Let's take a quick tour!",
    },
    {
        title: "Scan Your QR Code",
        description: "Use the QR code in our app to identify yourself and earn points. Or continue as guest.",
    },
    {
        title: "Deposit Your Item",
        description: "Place your e-waste item in the bin. Our AI will identify it automatically.",
    },
    {
        title: "Earn Rewards",
        description: "Get points for every deposit! Redeem them for discounts and prizes.",
    },
];

export default function SmartBinPage() {
    // State
    const [language, setLanguage] = useState<Language>("en");
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const [screen, setScreen] = useState<ScreenState>("idle");
    const [binStatus, setBinStatus] = useState<BinStatus>("operational");
    const [fillLevel, setFillLevel] = useState(67);
    const [isScanning, setIsScanning] = useState(false);
    const [depositProgress, setDepositProgress] = useState(0);
    const [depositStage, setDepositStage] = useState(0);
    const [depositResult, setDepositResult] = useState<DepositResult | null>(null);
    const [userName, setUserName] = useState<string | null>(null);

    // UX Enhancement states
    const [showAccessibility, setShowAccessibility] = useState(false);
    const [onboardingStep, setOnboardingStep] = useState(0);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showAchievement, setShowAchievement] = useState(false);
    const [totalDeposits, setTotalDeposits] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(3);
    const [longestStreak, setLongestStreak] = useState(7);
    const [showHelp, setShowHelp] = useState(false);

    // Connection hook for offline support
    const { isOnline, queuedActions, queueAction, syncActions } = useConnection();

    const t: Translations = translations[language];

    // Load saved preferences and check first-time user
    useEffect(() => {
        const saved = localStorage.getItem("binLanguage") as Language;
        if (saved && translations[saved]) {
            setLanguage(saved);
        }

        // Check if first-time user
        const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
        if (!hasSeenOnboarding) {
            setShowOnboarding(true);
        }

        // Load stats
        const deposits = localStorage.getItem("totalDeposits");
        if (deposits) setTotalDeposits(parseInt(deposits));

        const streak = localStorage.getItem("currentStreak");
        if (streak) setCurrentStreak(parseInt(streak));
    }, []);

    const changeLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem("binLanguage", lang);
        setShowLanguageMenu(false);

        // Voice feedback for accessibility
        speak(`Language changed to ${translations[lang].languageName}`);
    };

    // Text-to-speech for accessibility
    const speak = (text: string) => {
        if ("speechSynthesis" in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language === "hi" ? "hi-IN" : language === "ta" ? "ta-IN" : language === "bn" ? "bn-IN" : "en-US";
            speechSynthesis.speak(utterance);
        }
    };

    const startScan = useCallback(() => {
        setScreen("scan");
        setIsScanning(true);
        speak(t.scanQRCode);

        setTimeout(() => {
            setIsScanning(false);
            setUserName("User #" + Math.floor(Math.random() * 10000));
            setTimeout(() => startDeposit(), 1000);
        }, 3000);
    }, [t.scanQRCode]);

    const skipScan = () => {
        setUserName(null);
        startDeposit();
    };

    const startDeposit = () => {
        setScreen("deposit");
        setDepositProgress(0);
        setDepositStage(0);
        speak(t.depositInProgress);

        setTimeout(() => setDepositStage(1), 500);
        setTimeout(() => { setDepositStage(2); setDepositProgress(25); }, 2000);
        setTimeout(() => { setDepositStage(3); setDepositProgress(50); speak(t.itemDetected); }, 3500);
        setTimeout(() => { setDepositStage(4); setDepositProgress(75); }, 4500);

        setTimeout(() => {
            const item = mockItems[Math.floor(Math.random() * mockItems.length)];
            const result = {
                itemType: item.type,
                weight: item.weight,
                points: item.points,
                co2Saved: item.co2,
                confidence: item.confidence,
            };

            setDepositResult(result);
            setDepositProgress(100);
            setFillLevel((prev) => Math.min(prev + Math.random() * 3, 100));

            // Update stats
            const newTotal = totalDeposits + 1;
            setTotalDeposits(newTotal);
            localStorage.setItem("totalDeposits", newTotal.toString());

            // Queue action if offline
            if (!isOnline) {
                queueAction("deposit", result);
            }

            setTimeout(() => {
                setScreen("complete");
                speak(t.thankYou);

                // Show achievement on milestones
                if (newTotal === 1 || newTotal === 10 || newTotal === 50) {
                    setTimeout(() => setShowAchievement(true), 1000);
                }
            }, 500);
        }, 6000);
    };

    const resetToIdle = () => {
        setScreen("idle");
        setDepositResult(null);
        setDepositProgress(0);
        setDepositStage(0);
        setUserName(null);
    };

    const handleTapToStart = () => {
        if (binStatus === "full" || binStatus === "maintenance") {
            setScreen("unavailable");
            speak(binStatus === "full" ? t.binFull : t.maintenanceRequired);
        } else {
            startScan();
        }
    };

    const completeOnboarding = () => {
        setShowOnboarding(false);
        localStorage.setItem("hasSeenOnboarding", "true");
    };

    const getStatusStyle = () => {
        switch (binStatus) {
            case "operational": return { color: "text-emerald-400", bg: "bg-emerald-500/20", icon: Check };
            case "full": return { color: "text-red-400", bg: "bg-red-500/20", icon: AlertTriangle };
            case "maintenance": return { color: "text-yellow-400", bg: "bg-yellow-500/20", icon: Wrench };
        }
    };

    const statusStyle = getStatusStyle();
    const StatusIcon = statusStyle.icon;

    return (
        <main className="min-h-screen bg-[#01030c] overflow-hidden relative flex flex-col">
            {/* Connection Status Banner */}
            <AnimatePresence>
                {(!isOnline || queuedActions.length > 0) && (
                    <ConnectionStatus
                        isOnline={isOnline}
                        queuedCount={queuedActions.length}
                        onSync={syncActions}
                    />
                )}
            </AnimatePresence>

            {/* Animated Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            {/* Header Bar */}
            <header className="relative z-50 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/30 backdrop-blur-xl">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
                        <Recycle className="h-7 w-7 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white">BinSmart</h1>
                        <p className="text-xs text-slate-400">E-Waste Collection</p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={cn("flex items-center gap-2 px-4 py-2 rounded-full", statusStyle.bg)}>
                    <motion.span
                        animate={binStatus === "operational" ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="relative flex h-2 w-2"
                    >
                        <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75",
                            binStatus === "operational" ? "bg-emerald-400 animate-ping" :
                                binStatus === "full" ? "bg-red-400" : "bg-yellow-400"
                        )} />
                        <span className={cn("relative inline-flex rounded-full h-2 w-2",
                            binStatus === "operational" ? "bg-emerald-500" :
                                binStatus === "full" ? "bg-red-500" : "bg-yellow-500"
                        )} />
                    </motion.span>
                    <StatusIcon className={cn("h-4 w-4", statusStyle.color)} />
                    <span className={cn("text-sm font-medium", statusStyle.color)}>
                        {binStatus === "operational" ? t.operational : binStatus === "full" ? t.full : t.maintenance}
                    </span>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2">
                    {/* Help Button */}
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors relative"
                        aria-label="Help"
                    >
                        <HelpCircle className="h-5 w-5 text-slate-400" />
                    </button>

                    {/* Accessibility Button */}
                    <button
                        onClick={() => setShowAccessibility(!showAccessibility)}
                        className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                        aria-label="Accessibility"
                    >
                        <Settings className="h-5 w-5 text-slate-400" />
                    </button>

                    {/* Language Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <Globe className="h-4 w-4 text-slate-400" />
                            <span className="text-white text-sm">{translations[language].languageName}</span>
                            <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", showLanguageMenu && "rotate-180")} />
                        </button>

                        <AnimatePresence>
                            {showLanguageMenu && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden z-50"
                                >
                                    {languageOptions.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => changeLanguage(lang.code)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left",
                                                language === lang.code && "bg-emerald-500/20"
                                            )}
                                        >
                                            <span className="text-xl">{lang.flag}</span>
                                            <span className="text-white">{lang.name}</span>
                                            {language === lang.code && <Check className="h-4 w-4 text-emerald-400 ml-auto" />}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* Help Panel */}
            <AnimatePresence>
                {showHelp && (
                    <motion.div
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="fixed left-4 top-24 z-50 glass-card p-4 w-72"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-emerald-400" />
                                Quick Help
                            </h3>
                            <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-emerald-400 text-xs font-bold">1</span>
                                </div>
                                <p className="text-slate-300">Tap the screen to start the deposit process</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-emerald-400 text-xs font-bold">2</span>
                                </div>
                                <p className="text-slate-300">Scan your QR code or continue as guest</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-emerald-400 text-xs font-bold">3</span>
                                </div>
                                <p className="text-slate-300">Place your e-waste item in the bin</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-emerald-400 text-xs font-bold">4</span>
                                </div>
                                <p className="text-slate-300">Collect your points and earn rewards!</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { setShowHelp(false); setShowOnboarding(true); setOnboardingStep(0); }}
                            className="mt-4 w-full py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 transition-colors"
                        >
                            Take Full Tour
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Accessibility Controls */}
            <AnimatePresence>
                {showAccessibility && (
                    <AccessibilityControls onClose={() => setShowAccessibility(false)} />
                )}
            </AnimatePresence>

            {/* Onboarding Overlay */}
            <AnimatePresence>
                {showOnboarding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="glass-card p-8 max-w-md w-full text-center"
                        >
                            {/* Progress dots */}
                            <div className="flex justify-center gap-2 mb-6">
                                {onboardingSteps.map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-2 rounded-full transition-all",
                                            i <= onboardingStep ? "bg-emerald-500 w-8" : "bg-slate-600 w-2"
                                        )}
                                    />
                                ))}
                            </div>

                            <motion.div
                                key={onboardingStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-500/30 flex items-center justify-center">
                                    {onboardingStep === 0 && <Recycle className="h-10 w-10 text-emerald-400" />}
                                    {onboardingStep === 1 && <QrCode className="h-10 w-10 text-emerald-400" />}
                                    {onboardingStep === 2 && <Smartphone className="h-10 w-10 text-emerald-400" />}
                                    {onboardingStep === 3 && <Zap className="h-10 w-10 text-yellow-400" />}
                                </div>

                                <h2 className="text-2xl font-bold text-white mb-3">
                                    {onboardingSteps[onboardingStep].title}
                                </h2>
                                <p className="text-slate-400 mb-8">
                                    {onboardingSteps[onboardingStep].description}
                                </p>
                            </motion.div>

                            <div className="flex gap-3">
                                <button
                                    onClick={completeOnboarding}
                                    className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={() => {
                                        if (onboardingStep < onboardingSteps.length - 1) {
                                            setOnboardingStep(onboardingStep + 1);
                                        } else {
                                            completeOnboarding();
                                        }
                                    }}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold transition-all hover:shadow-lg"
                                >
                                    {onboardingStep < onboardingSteps.length - 1 ? "Next" : "Get Started"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Achievement Popup */}
            <AnimatePresence>
                {showAchievement && (
                    <AchievementBadge
                        type={totalDeposits === 1 ? "first_deposit" : totalDeposits === 10 ? "recycler_pro" : "milestone"}
                        title={totalDeposits === 1 ? "First Deposit!" : totalDeposits === 10 ? "Recycler Pro" : "50 Deposits!"}
                        description={totalDeposits === 1 ? "You made your first e-waste deposit!" : totalDeposits === 10 ? "You've deposited 10 items!" : "Amazing! 50 items recycled!"}
                        points={totalDeposits === 1 ? 100 : totalDeposits === 10 ? 250 : 500}
                        isNew={true}
                        onDismiss={() => setShowAchievement(false)}
                    />
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 relative z-10 flex items-center justify-center p-6">
                <AnimatePresence mode="wait">
                    {/* IDLE SCREEN */}
                    {screen === "idle" && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-2xl"
                        >
                            <div className="text-center cursor-pointer" onClick={handleTapToStart}>
                                {/* Animated Icon */}
                                <motion.div
                                    animate={{ y: [0, -15, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    className="mx-auto mb-8 w-40 h-40 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-500/30 flex items-center justify-center"
                                >
                                    <Recycle className="h-20 w-20 text-emerald-400" />
                                </motion.div>

                                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                                    {t.welcome}
                                </h1>

                                <motion.p
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-xl text-slate-400 mb-8"
                                >
                                    👆 {t.tapToStart}
                                </motion.p>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                {/* Fill Level */}
                                <div className="glass-card p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-slate-400">{t.fillLevel}</span>
                                        <span className="text-white font-bold">{Math.round(fillLevel)}%</span>
                                    </div>
                                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${fillLevel}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            className={cn(
                                                "h-full rounded-full",
                                                fillLevel < 60 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
                                                    fillLevel < 80 ? "bg-gradient-to-r from-yellow-500 to-yellow-400" :
                                                        "bg-gradient-to-r from-red-500 to-red-400"
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Streak Display */}
                                <div className="glass-card p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Flame className="h-5 w-5 text-orange-400" />
                                        <span className="text-sm text-slate-400">Current Streak</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-orange-400">{currentStreak}</span>
                                        <span className="text-xs text-slate-400">days</span>
                                    </div>
                                </div>
                            </div>

                            {/* Privacy & Trust */}
                            <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
                                <div className="flex items-center gap-1">
                                    <Shield className="h-4 w-4 text-emerald-400" />
                                    <span>Your data is secure</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Check className="h-4 w-4 text-emerald-400" />
                                    <span>AI-verified deposits</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* SCAN SCREEN */}
                    {screen === "scan" && (
                        <motion.div
                            key="scan"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -50 }}
                            className="w-full max-w-lg text-center"
                        >
                            <h2 className="text-3xl font-bold text-white mb-2">{t.scanQRCode}</h2>
                            <p className="text-slate-400 mb-8">{t.positionQR}</p>

                            {/* Simulated Camera View */}
                            <div className="relative mx-auto w-72 h-72 rounded-2xl overflow-hidden bg-slate-900 border-2 border-white/20">
                                <motion.div
                                    animate={{ y: [0, 260, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                                />

                                <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-emerald-400 rounded-tl-lg" />
                                <div className="absolute top-4 right-4 w-12 h-12 border-r-4 border-t-4 border-emerald-400 rounded-tr-lg" />
                                <div className="absolute bottom-4 left-4 w-12 h-12 border-l-4 border-b-4 border-emerald-400 rounded-bl-lg" />
                                <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-emerald-400 rounded-br-lg" />

                                <div className="absolute inset-0 flex items-center justify-center">
                                    {isScanning ? (
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                                            <Scan className="h-16 w-16 text-emerald-400/50" />
                                        </motion.div>
                                    ) : userName ? (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="p-4 rounded-full bg-emerald-500/20">
                                            <Check className="h-16 w-16 text-emerald-400" />
                                        </motion.div>
                                    ) : (
                                        <QrCode className="h-16 w-16 text-white/20" />
                                    )}
                                </div>
                            </div>

                            <p className="mt-6 text-lg text-white">
                                {isScanning ? t.scanning : userName ? `Welcome, ${userName}!` : ""}
                            </p>

                            {isScanning && (
                                <button
                                    onClick={skipScan}
                                    className="mt-6 px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-lg transition-colors"
                                >
                                    {t.continueAsGuest}
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* DEPOSIT SCREEN */}
                    {screen === "deposit" && (
                        <motion.div
                            key="deposit"
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -50 }}
                            className="w-full max-w-lg text-center"
                        >
                            <h2 className="text-3xl font-bold text-white mb-8">{t.depositInProgress}</h2>

                            {/* Progress Circle */}
                            <div className="relative mx-auto w-56 h-56 mb-8">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="112" cy="112" r="100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                                    <motion.circle
                                        cx="112" cy="112" r="100" fill="none" stroke="url(#progressGradient)"
                                        strokeWidth="12" strokeLinecap="round" strokeDasharray={628}
                                        initial={{ strokeDashoffset: 628 }}
                                        animate={{ strokeDashoffset: 628 - (depositProgress / 100) * 628 }}
                                        transition={{ duration: 0.5 }}
                                    />
                                    <defs>
                                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#10b981" />
                                            <stop offset="100%" stopColor="#06b6d4" />
                                        </linearGradient>
                                    </defs>
                                </svg>

                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <motion.div animate={depositStage === 2 ? { rotate: 360 } : {}} transition={{ duration: 2, repeat: depositStage === 2 ? Infinity : 0, ease: "linear" }}>
                                        {depositStage < 3 ? (
                                            <Loader2 className={cn("h-12 w-12 text-emerald-400", depositStage === 2 && "animate-spin")} />
                                        ) : (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                <Check className="h-12 w-12 text-emerald-400" />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                    <span className="text-2xl font-bold text-white mt-2">{depositProgress}%</span>
                                </div>
                            </div>

                            {/* Stage indicators */}
                            <div className="space-y-3">
                                {[
                                    { stage: 1, text: t.placeItem },
                                    { stage: 2, text: t.analyzing },
                                    { stage: 3, text: t.itemDetected },
                                    { stage: 4, text: t.processingDeposit },
                                ].map((item) => (
                                    <motion.div
                                        key={item.stage}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: depositStage >= item.stage ? 1 : 0.3, x: 0 }}
                                        transition={{ delay: item.stage * 0.1 }}
                                        className={cn("flex items-center gap-3 p-3 rounded-lg", depositStage >= item.stage ? "bg-emerald-500/20" : "bg-white/5")}
                                    >
                                        {depositStage > item.stage ? (
                                            <Check className="h-5 w-5 text-emerald-400" />
                                        ) : depositStage === item.stage ? (
                                            <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
                                        ) : (
                                            <div className="h-5 w-5 rounded-full border-2 border-white/20" />
                                        )}
                                        <span className={cn("text-left", depositStage >= item.stage ? "text-white" : "text-slate-500")}>{item.text}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* COMPLETE SCREEN */}
                    {screen === "complete" && depositResult && (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-lg text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                className="mx-auto mb-6 w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center"
                            >
                                <Check className="h-14 w-14 text-black" />
                            </motion.div>

                            <h2 className="text-4xl font-bold text-white mb-2">{t.thankYou}</h2>
                            <p className="text-xl text-slate-400 mb-6">{t.depositComplete}</p>

                            {/* AI Confidence Score */}
                            <div className="mb-6">
                                <ConfidenceScore
                                    score={depositResult.confidence}
                                    itemName={depositResult.itemType}
                                />
                            </div>

                            {/* Points earned */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="glass-card p-6 mb-6"
                            >
                                <div className="flex items-center justify-center gap-3 mb-4">
                                    <Zap className="h-8 w-8 text-yellow-400" />
                                    <span className="text-5xl font-bold text-gradient">+{depositResult.points}</span>
                                </div>
                                <p className="text-slate-400">{t.pointsEarned}</p>
                            </motion.div>

                            {/* Details grid */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="grid grid-cols-2 gap-4 mb-8"
                            >
                                <div className="glass-card p-4">
                                    <Smartphone className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                                    <p className="text-white font-medium">{depositResult.itemType}</p>
                                    <p className="text-xs text-slate-400">{t.itemType}</p>
                                </div>
                                <div className="glass-card p-4">
                                    <Battery className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                                    <p className="text-white font-medium">{depositResult.weight} kg</p>
                                    <p className="text-xs text-slate-400">{t.estimatedWeight}</p>
                                </div>
                                <div className="col-span-2 glass-card p-4">
                                    <Leaf className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
                                    <p className="text-white font-medium">{depositResult.co2Saved} kg {t.co2Saved}</p>
                                    <p className="text-xs text-slate-400">{t.environmentalImpact}</p>
                                </div>
                            </motion.div>

                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                onClick={resetToIdle}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold text-lg hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all"
                            >
                                <Home className="inline h-5 w-5 mr-2" />
                                {t.returnHome}
                            </motion.button>
                        </motion.div>
                    )}

                    {/* UNAVAILABLE SCREEN */}
                    {screen === "unavailable" && (
                        <motion.div
                            key="unavailable"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full max-w-lg text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={cn(
                                    "mx-auto mb-6 w-28 h-28 rounded-full flex items-center justify-center",
                                    binStatus === "full" ? "bg-red-500/20" : "bg-yellow-500/20"
                                )}
                            >
                                {binStatus === "full" ? (
                                    <AlertTriangle className="h-14 w-14 text-red-400" />
                                ) : (
                                    <Wrench className="h-14 w-14 text-yellow-400" />
                                )}
                            </motion.div>

                            <h2 className="text-3xl font-bold text-white mb-2">
                                {binStatus === "full" ? t.binFull : t.maintenanceRequired}
                            </h2>
                            <p className="text-slate-400 mb-8">
                                {binStatus === "full" ? t.binFullMessage : t.maintenanceMessage}
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={resetToIdle}
                                    className="flex-1 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                                >
                                    {t.close}
                                </button>
                                <button className="flex-1 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-bold transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                                    {t.notifyMaintenance}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <footer className="relative z-10 px-6 py-4 border-t border-white/10 bg-black/30 backdrop-blur-xl">
                <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Bin ID: #BIN-2847-A</span>
                    <span>Location: Central Plaza, Downtown</span>
                    <span>Last Pickup: Today, 09:30 AM</span>
                </div>
            </footer>

            {/* Demo Controls */}
            <div className="fixed bottom-20 right-6 z-50">
                <div className="glass-card p-3 space-y-2">
                    <p className="text-xs text-slate-400 mb-2">Demo Controls</p>
                    <button onClick={() => setBinStatus("operational")} className={cn("block w-full px-3 py-1.5 rounded text-xs text-left", binStatus === "operational" ? "bg-emerald-500/30 text-emerald-400" : "bg-white/10 text-white")}>Set Operational</button>
                    <button onClick={() => setBinStatus("full")} className={cn("block w-full px-3 py-1.5 rounded text-xs text-left", binStatus === "full" ? "bg-red-500/30 text-red-400" : "bg-white/10 text-white")}>Set Full</button>
                    <button onClick={() => setBinStatus("maintenance")} className={cn("block w-full px-3 py-1.5 rounded text-xs text-left", binStatus === "maintenance" ? "bg-yellow-500/30 text-yellow-400" : "bg-white/10 text-white")}>Set Maintenance</button>
                    <hr className="border-white/10" />
                    <button onClick={() => { setShowOnboarding(true); setOnboardingStep(0); }} className="block w-full px-3 py-1.5 rounded text-xs text-left bg-white/10 text-white">Show Onboarding</button>
                    <button onClick={() => setShowAchievement(true)} className="block w-full px-3 py-1.5 rounded text-xs text-left bg-white/10 text-white">Show Achievement</button>
                </div>
            </div>
        </main>
    );
}
