"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminDashboard from "./AdminDashboard";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkAuth = () => {
            try {
                const session = localStorage.getItem("adminSession");
                if (session) {
                    const parsed = JSON.parse(session);
                    // Check if session is valid (24 hours expiry)
                    const isValid = parsed.authenticated &&
                        (Date.now() - parsed.timestamp) < 24 * 60 * 60 * 1000;

                    if (isValid) {
                        setIsAuthenticated(true);
                    } else {
                        localStorage.removeItem("adminSession");
                        router.push("/admin-login");
                    }
                } else {
                    router.push("/admin-login");
                }
            } catch {
                router.push("/admin-login");
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
            </main>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <AdminDashboard />;
}
