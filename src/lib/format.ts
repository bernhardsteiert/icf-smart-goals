// Gemeinsame Formatierungs-Helfer (client- und serverseitig nutzbar).

// Bedeutung der ICF-Qualifier (Schweregrad 0–4).
export const QUALIFIER_LABELS: Record<number, string> = {
  0: "Kein",
  1: "Leicht",
  2: "Mäßig",
  3: "Erheblich",
  4: "Vollständig",
};

// Alter in Halbjahrschritten -> lesbarer Text.
// 0 = unter 6 Monate, 1 = 6 Monate, 2 = 1 Jahr, 3 = 1 Jahr und 6 Monate, ...
export function halbjahreToText(halbjahre: number): string {
  if (halbjahre === 0) return "unter 6 Monate";
  const years = Math.floor(halbjahre / 2);
  const months = (halbjahre % 2) * 6;
  if (years === 0) return `${months} Monate`;
  if (months === 0) return `${years} Jahr${years !== 1 ? "e" : ""}`;
  return `${years} Jahr${years !== 1 ? "e" : ""} und ${months} Monate`;
}
