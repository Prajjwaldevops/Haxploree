import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-cyan-500/15 rounded-full blur-[100px] -z-10" />

            <div className="w-full max-w-md px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-slate-400">Sign in to continue your eco-journey</p>
                </div>
                <SignIn
                    appearance={{
                        elements: {
                            rootBox: "mx-auto",
                            card: "bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl",
                        },
                    }}
                />
            </div>
        </div>
    );
}
