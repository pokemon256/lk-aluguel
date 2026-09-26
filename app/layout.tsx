import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "LK Aluguel — Gestão de Decoração",
  description: "Inventário, alugueres, clientes e calendário para aluguer de materiais de decoração.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "LK Aluguel", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#170f0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-AO" className="h-full">
      <body className={`${inter.variable} ${fraunces.variable} min-h-full antialiased`}>
        {/* Brilho festivo de fundo */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-brand-200/50 blur-3xl" />
          <div className="absolute top-40 -right-32 h-72 w-72 rounded-full bg-gold-200/40 blur-3xl" />
        </div>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
