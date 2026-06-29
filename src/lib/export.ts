import type { Foerderziel } from "./types";

export type ExportOptions = {
  // Zusätzlich zur fachsprachlichen Version (Default) auch die elterngerechte
  // Formulierung mit ausgeben.
  includeEltern?: boolean;
};

// Wandelt die Förderziele in strukturierten Plaintext zum Kopieren / als .txt.
// PDF wird bewusst NICHT erzeugt – der Text wird extern in ein größeres
// Dokument übernommen. Standardmäßig wird die Fachkraft-Formulierung exportiert;
// mit includeEltern zusätzlich die Elternversion.
export function zieleToText(
  ziele: Foerderziel[],
  options: ExportOptions = {},
): string {
  if (ziele.length === 0) return "";

  const lines: string[] = [];
  lines.push("Förderziele (Heilpädagogik) – Entwurf");
  lines.push("");

  ziele.forEach((ziel, idx) => {
    if (idx > 0) lines.push("");
    lines.push(`Bereich: ${ziel.bereich}`);
    lines.push(`Oberziel: ${ziel.oberziel}`);

    ziel.unterziele.forEach((uz) => {
      const erreicht = uz.status === "erreicht" ? " [erreicht]" : "";
      lines.push(`  - Ziel: ${uz.ziel}${erreicht}`);
      if (options.includeEltern) {
        lines.push(`      Elternversion: ${uz.zielEltern || uz.ziel}`);
      }
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
