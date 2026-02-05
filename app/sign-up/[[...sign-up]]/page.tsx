import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center relative">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] -z-10" />

            <div className="w-full max-w-md px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Join BinSmart</h1>
                    <p className="text-gray-600">Create an account and start earning rewards</p>
                </div>
                <SignUp
                    appearance={{
                        variables: {
                            colorPrimary: "#10b981",
                            colorBackground: "#ffffff",
                            colorText: "#0f172a",
                            colorInputBackground: "#f8fafc",
                            colorInputText: "#0f172a",
                        },
                        elements: {
                            rootBox: "mx-auto",
                            card: "bg-white shadow-xl border border-gray-100 rounded-2xl",
                            headerTitle: "text-gray-900",
                            headerSubtitle: "text-gray-600",
                            formButtonPrimary: "bg-emerald-500 hover:bg-emerald-600",
                            formFieldLabel: "text-gray-700",
                            formFieldInput: "bg-gray-50 border-gray-200 text-gray-900",
                            footerActionLink: "text-emerald-600 hover:text-emerald-700",
                            dividerText: "text-gray-400",
                            dividerLine: "bg-gray-200",
                            identityPreview: "bg-gray-50",
                            identityPreviewText: "text-gray-900",
                            identityPreviewEditButton: "text-emerald-600",
                        },
                    }}
                />
            </div>
        </div>
    );
}
