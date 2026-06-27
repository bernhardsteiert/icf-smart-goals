import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Förderkompass – ICF-CY-basierte SMART-Förderziele für die Frühförderung",
    short_name: "Förderkompass",
    description:
      "ICF-CY-basierte SMART-Förderziele für die Frühförderung.",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    // Identisch zur Header-Farbe (bg-blue-700), damit die Android-Statusleiste
    // nahtlos in den App-Header übergeht (keine sichtbare Kante).
    theme_color: "#1d4ed8",
    lang: "de",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
