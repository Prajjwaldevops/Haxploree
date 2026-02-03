"use client";

import Link from "next/link";
import { useState } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { Menu, X, Recycle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
    const { isSignedIn, user } = useUser();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isAdmin = user?.username === "admin" ||
        user?.primaryEmailAddress?.emailAddress?.includes("admin") ||
        user?.publicMetadata?.role === "admin";

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/#features", label: "How it Works" },
        { href: "/#about", label: "About" },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
            <nav className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
                        <Recycle className="h-5 w-5 text-black" />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Recycle className="absolute h-5 w-5 text-black" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">
                        Bin<span className="text-emerald-400">Smart</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex gap-8 items-center">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm text-slate-300 hover:text-white transition-colors duration-200"
                        >
                            {link.label}
                        </Link>
                    ))}
                    {isAdmin && (
                        <Link
                            href="/admin"
                            className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors border border-red-500/30 px-4 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20"
                        >
                            Admin Command
                        </Link>
                    )}
                </div>

                {/* Auth Actions */}
                <div className="flex items-center gap-4">
                    {isSignedIn ? (
                        <>
                            <Link
                                href="/dashboard"
                                className="hidden md:flex items-center gap-2 text-sm font-semibold bg-white/10 px-5 py-2.5 rounded-full hover:bg-white/20 transition-colors border border-white/10"
                            >
                                Dashboard
                            </Link>
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        avatarBox: "w-9 h-9 ring-2 ring-emerald-500/30",
                                    },
                                }}
                            />
                        </>
                    ) : (
                        <Link
                            href="/sign-in"
                            className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-black px-6 py-2.5 rounded-full font-semibold shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 transform hover:scale-105"
                        >
                            Get Started
                        </Link>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 text-slate-300 hover:text-white"
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <div
                className={cn(
                    "md:hidden overflow-hidden transition-all duration-300 border-t border-white/10",
                    mobileMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <div className="container mx-auto px-4 py-4 space-y-3 bg-slate-950/95 backdrop-blur-xl">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block text-sm text-slate-300 hover:text-white py-2"
                        >
                            {link.label}
                        </Link>
                    ))}
                    {isAdmin && (
                        <Link
                            href="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block text-sm font-bold text-red-400 py-2"
                        >
                            Admin Command
                        </Link>
                    )}
                    {isSignedIn && (
                        <Link
                            href="/dashboard"
                            onClick={() => setMobileMenuOpen(false)}
                            className="block text-sm font-semibold text-emerald-400 py-2"
                        >
                            Dashboard
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
