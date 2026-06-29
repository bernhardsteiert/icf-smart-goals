import type { CodeVorschlag, Foerderziel, Oberziel, SmartUnterziel, IcfSelection } from "@/lib/types";

// ── Input-Typen (server-seitig, enthalten angereicherte Details) ──────────────

export type SuggestCodesInput = {
  therapieformen: string[];
  vorgespraechCodes: string[];
  merkmale: Record<string, unknown>;
  beobachtung?: string;
  catalogCodes: { code: string; title: string; description: string }[];
};

// Gemeinsamer Kontext für beide Generierungs-Stufen (vom Route-Handler aus den
// JSON-Stammdaten angereichert).
type GoalContextInput = {
  therapieformen: string[];
  codes: IcfSelection[];
  alterHalbjahre: number;
  merkmale: Record<string, unknown>;
  beobachtung?: string;
  codeDetails: { code: string; title: string; description: string }[];
  therapieformDetails: { id: string; label: string; hinweis: string }[];
};

// Stufe 1: nur Oberziele (Förderrichtungen) vorschlagen.
export type GenerateOberzieleInput = GoalContextInput;

// Stufe 2: zu den von der Fachkraft bestätigten Oberzielen die SMART-Unterziele
// erzeugen.
export type GenerateUnterzieleInput = GoalContextInput & {
  oberziele: Oberziel[];
};

export type NextStepInput = {
  erreichtesUnterziel: SmartUnterziel;
  oberziel: string;
  codes: IcfSelection[];
  alterHalbjahre: number;
};

export type RefineModus =
  | "einfacher"
  | "ambitionierter"
  | "umformulieren"
  | "freitext";

export type RefineUnterzielInput = {
  oberziel: string;
  bisherigesZiel: string; // aktueller Zielsatz, der überarbeitet werden soll
  modus: RefineModus;
  freitext?: string; // bei modus "freitext": gewünschte Änderung in Worten
  alterHalbjahre: number;
  merkmale: Record<string, unknown>;
  beobachtung?: string;
  // Angereichert vom Route-Handler:
  codeDetails: { code: string; title: string; description: string }[];
};

// ── Provider-Interface ────────────────────────────────────────────────────────

export interface AiProvider {
  suggestCodes(input: SuggestCodesInput): Promise<CodeVorschlag[]>;
  generateOberziele(input: GenerateOberzieleInput): Promise<Oberziel[]>;
  generateUnterziele(input: GenerateUnterzieleInput): Promise<Foerderziel[]>;
  nextStep(input: NextStepInput): Promise<SmartUnterziel>;
  refineUnterziel(input: RefineUnterzielInput): Promise<SmartUnterziel>;
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function getProvider(): AiProvider {
  const name = process.env.AI_PROVIDER ?? "gemini";
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { GeminiProvider } = require("./gemini") as { GeminiProvider: new () => AiProvider };
  switch (name) {
    case "gemini":
      return new GeminiProvider();
    default:
      throw new Error(`Unbekannter AI_PROVIDER: "${name}". Unterstützt: gemini`);
  }
}
