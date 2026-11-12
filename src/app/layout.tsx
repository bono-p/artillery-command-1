import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ARTILLERY COMMAND — Simulateur Tactique",
  description:
    "ARTILLERY COMMAND — jeu de simulation et de stratégie tactique. Incarnez le commandant d'une batterie d'artillerie dans un univers militaire fictif.",
  keywords: [
    "artillery",
    "simulation",
    "tactique",
    "stratégie",
    "commandement",
    "wargame",
    "fiction",
  ],
  authors: [{ name: "ARTILLERY COMMAND" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
