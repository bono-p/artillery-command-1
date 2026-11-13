import type { Metadata } from "next";
import { Chakra_Petch, Barlow, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "ARTILLERY COMMAND — Simulateur Tactique",
  description:
    "ARTILLERY COMMAND — jeu de simulation et de stratégie tactique. Univers militaire fictif de Theranie.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" suppressHydrationWarning className="dark">
      <body
        className={`${chakra.variable} ${barlow.variable} ${jetbrains.variable} antialiased bg-background text-foreground min-h-screen`}
        style={{
          fontFamily: "var(--font-barlow), system-ui, sans-serif",
        }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
