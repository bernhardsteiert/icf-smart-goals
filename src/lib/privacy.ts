// Klarnamen-Erkennung: einfache, client-seitige Heuristik für typische
// Muster, die auf Personennamen oder Geburtsdaten hindeuten. Nur Warnung,
// kein harter Block – die Fachkraft entscheidet selbst.

// Muster, die einen Klarnamen-Hinweis auslösen:
// - Großgeschriebenes Wort (≥2 Buchstaben) direkt vor oder nach "heißt",
//   "namens", "Name:", "Kind:" o.ä.
// - Jahreszahl im Bereich 2015–2026 (typisches Geburtsjahr für Frühförderung)
// - Explizites Datumsmuster TT.MM.JJJJ oder TT/MM/JJJJ

const NAME_PATTERNS = [
  // "heißt Max", "Max heißt", "namens Lena", "Kind: Emma"
  /\b(heißt|namens|genannt|Kind:|Name:)\s+[A-ZÄÖÜ][a-zäöüß]+/u,
  /\b[A-ZÄÖÜ][a-zäöüß]{1,}\s+(heißt|ist|wird)/u,
  // Datum TT.MM.JJJJ oder TT.MM.JJ
  /\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/,
  // Jahreszahl im Geburtsjahresbereich 2015–2026
  /\b20(1[5-9]|2[0-6])\b/,
];

export function detectsKlarname(text: string): boolean {
  if (!text || text.trim().length < 4) return false;
  return NAME_PATTERNS.some((re) => re.test(text));
}
