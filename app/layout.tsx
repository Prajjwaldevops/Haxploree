import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BinSmart | Smart E-Waste Recycling",
  description: "Recycle your e-waste smartly with AI-powered identification and earn rewards. Join the revolution with BinSmart by Team Prakriti.",
  keywords: ["e-waste", "recycling", "smart bin", "sustainability", "rewards", "AI"],
  authors: [{ name: "Team Prakriti" }],
  openGraph: {
    title: "BinSmart | Smart E-Waste Recycling",
    description: "Recycle your e-waste smartly and earn rewards",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#10b981",
          colorBackground: "#0f172a",
          colorInputBackground: "#1e293b",
          colorInputText: "#f8fafc",
        },
        elements: {
          formButtonPrimary: "bg-emerald-600 hover:bg-emerald-500",
          card: "bg-slate-900 border border-slate-800",
          headerTitle: "text-white",
          headerSubtitle: "text-slate-400",
          socialButtonsBlockButton: "bg-slate-800 border-slate-700 hover:bg-slate-700",
          formFieldLabel: "text-slate-300",
          formFieldInput: "bg-slate-800 border-slate-700 text-white",
          footerActionLink: "text-emerald-400 hover:text-emerald-300",
        },
      }}
    >
      <html lang="en">
        <body className={`${inter.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
