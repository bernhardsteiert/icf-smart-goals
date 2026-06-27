import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICF SMART Goals – Frühförderung",
  description:
    "Unterstützung bei der Formulierung von ICF-CY-basierten SMART-Förderzielen in der Frühförderung.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "ICF Goals",
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
  themeColor: "#2563eb",
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
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
