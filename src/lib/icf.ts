import rawIcf from "@/data/icf-cy.json";
import rawMasken from "@/data/masken.json";
import rawTherapieformen from "@/data/therapieformen.json";
import rawMerkmale from "@/data/merkmale.json";
import rawSynonyme from "@/data/synonyme.json";
import rawBereiche from "@/data/bereiche.json";
import type { IcfCode, Maske, Therapieform, Merkmal, Hauptbereich } from "./types";

// ── Codes ─────────────────────────────────────────────────────────────────────

const ALL_CODES: IcfCode[] = rawIcf.codes as IcfCode[];

export function getAllCodes(): IcfCode[] {
  return ALL_CODES;
}

export function getCodeByKey(code: string): IcfCode | undefined {
  return ALL_CODES.find((c) => c.code === code);
}

export function getCodesByKeys(codes: string[]): IcfCode[] {
  return codes.flatMap((c) => {
    const found = getCodeByKey(c);
    return found ? [found] : [];
  });
}

// ── Masken ────────────────────────────────────────────────────────────────────

const ALL_MASKEN: Maske[] = rawMasken.masken as Maske[];

export function getMaskeForTherapieform(therapieformId: string): Maske | undefined {
  return ALL_MASKEN.find((m) => m.therapieform === therapieformId);
}

export function getHauptbereicheForTherapieform(
  therapieformId: string
): Hauptbereich[] {
  return getMaskeForTherapieform(therapieformId)?.gruppen ?? [];
}

// ── Therapieformen ────────────────────────────────────────────────────────────

const ALL_THERAPIEFORMEN: Therapieform[] = rawTherapieformen as Therapieform[];

export function getAllTherapieformen(): Therapieform[] {
  return ALL_THERAPIEFORMEN;
}

export function getAktiveTherapieformen(): Therapieform[] {
  return ALL_THERAPIEFORMEN.filter((t) => t.aktiv);
}

// ── Bereiche (kuratierte Liste für die Oberziel-Zuordnung) ────────────────────

const ALL_BEREICHE: string[] = rawBereiche as string[];

export function getAllBereiche(): string[] {
  return ALL_BEREICHE;
}

// ── Merkmale ──────────────────────────────────────────────────────────────────

const ALL_MERKMALE: Merkmal[] = rawMerkmale as Merkmal[];

export function getAllMerkmale(): Merkmal[] {
  return ALL_MERKMALE;
}

// ── Konzept-Suche (Synonym-Thesaurus) ─────────────────────────────────────────

type Konzept = { begriffe: string[]; codes: string[] };
const ALL_KONZEPTE: Konzept[] = (rawSynonyme as { konzepte: Konzept[] }).konzepte;

/**
 * Liefert zu einem Suchbegriff fachlich verwandte Codes über den Thesaurus –
 * z.B. "Selbstbewusstsein" → b122, b125, d250 …, auch wenn der Begriff nicht
 * im Code-Namen vorkommt. Trefferlogik bewusst tolerant (Teil-/Wortstamm).
 */
export function getConceptCodesForQuery(query: string): Set<string> {
  const q = query.toLowerCase().trim();
  const result = new Set<string>();
  if (q.length < 3) return result;
  for (const konzept of ALL_KONZEPTE) {
    const hit = konzept.begriffe.some(
      (b) => b.includes(q) || q.includes(b),
    );
    if (hit) konzept.codes.forEach((c) => result.add(c));
  }
  return result;
}
