import rawIcf from "@/data/icf-cy.json";
import rawMasken from "@/data/masken.json";
import rawTherapieformen from "@/data/therapieformen.json";
import rawMerkmale from "@/data/merkmale.json";
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

// ── Merkmale ──────────────────────────────────────────────────────────────────

const ALL_MERKMALE: Merkmal[] = rawMerkmale as Merkmal[];

export function getAllMerkmale(): Merkmal[] {
  return ALL_MERKMALE;
}
