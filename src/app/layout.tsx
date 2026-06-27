import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ICF SMART Goals – Frühförderung",
  description:
    "Unterstützung bei der Formulierung von ICF-CY-basierten SMART-Förderzielen in der Frühförderung.",
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
