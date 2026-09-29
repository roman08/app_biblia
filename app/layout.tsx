import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { UserNav } from "@/components/layout/UserNav";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TimezoneSync } from "@/components/providers/TimezoneSync";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Biblia App",
    template: "%s · Biblia App",
  },
  description: "Lee, medita y estudia la Palabra de Dios",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Biblia",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Biblia" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <TimezoneSync />
          <PWAInstallPrompt />

          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-[env(safe-area-inset-top)]">
            <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-3 sm:px-4">
              <Link
                href="/"
                className="flex shrink-0 items-center gap-2 text-base font-semibold"
              >
                <Image
                  src="/icons/icon-96.png"
                  alt=""
                  width={28}
                  height={28}
                  className="rounded-md"
                  priority
                />
                Biblia
              </Link>

              <div className="shrink-0">
                <ThemeToggle />
                <UserNav />
              </div>
            </div>
          </header>

          <main>{children}</main>
          <BottomNav />
          <Toaster />

        </ThemeProvider>
      </body>
    </html>
  );
}
