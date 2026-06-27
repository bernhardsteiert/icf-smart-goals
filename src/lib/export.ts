import type { Foerderziel } from "./types";

// Wandelt die Förderziele in strukturierten Plaintext zum Kopieren / als .txt.
// PDF wird bewusst NICHT erzeugt – der Text wird extern in ein größeres
// Dokument übernommen.
export function zieleToText(ziele: Foerderziel[]): string {
  if (ziele.length === 0) return "";

  const lines: string[] = [];
  lines.push("Förderziele (Heilpädagogik) – Entwurf");
  lines.push("Planungshorizont: ca. 1 Jahr (~42 Therapieeinheiten)");
  lines.push("");

  ziele.forEach((ziel, idx) => {
    if (idx > 0) lines.push("");
    lines.push(`Bereich: ${ziel.bereich}`);
    lines.push(`Oberziel: ${ziel.oberziel}`);

    ziel.unterziele.forEach((uz) => {
      const erreicht = uz.status === "erreicht" ? " [erreicht]" : "";
      lines.push(`  - Ziel: ${uz.ziel}${erreicht}`);
      if (uz.naechsteStufe) {
        lines.push(`      nächste Stufe: ${uz.naechsteStufe}`);
      }
    });

    if (ziel.abgeleitetAus.length > 0) {
      lines.push(`  (abgeleitet aus: ${ziel.abgeleitetAus.join(", ")})`);
    }
  });

  return lines.join("\n");
}
