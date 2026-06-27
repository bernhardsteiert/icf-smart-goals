import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Förderkompass – ICF-CY-basierte SMART-Förderziele für die Frühförderung",
  description:
    "ICF-CY-basierte SMART-Förderziele für die Frühförderung.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Förderkompass",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-icon.png",
  },
  other: {
    // Legacy-Tag für ältere iOS-Versionen (Vollbild ohne Safari-Leiste).
    // Next.js setzt zusätzlich das moderne "mobile-web-app-capable".
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  // Header-Farbe (bg-blue-700) – nahtlose Android-Statusleiste, vgl. manifest.ts.
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full">
      <body className="flex min-h-full flex-col bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
