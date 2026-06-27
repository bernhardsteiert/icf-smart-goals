import type { CodeVorschlag, Foerderziel, SmartUnterziel, IcfSelection } from "@/lib/types";

// ── Input-Typen (server-seitig, enthalten angereicherte Details) ──────────────

export type SuggestCodesInput = {
  therapieformen: string[];
  vorgespraechCodes: string[];
  merkmale: Record<string, unknown>;
  beobachtung?: string;
  catalogCodes: { code: string; title: string; description: string }[];
};

export type GenerateGoalsInput = {
  therapieformen: string[];
  codes: IcfSelection[];
  alterHalbjahre: number;
  merkmale: Record<string, unknown>;
  beobachtung?: string;
  modus: "neu" | "einfacher" | "ambitionierter" | "umformulieren" | "elterngerecht";
  bezugsziel?: { oberziel: string; unterziel?: string };
  // Angereichert vom Route-Handler aus den JSON-Stammdaten:
  codeDetails: { code: string; title: string; description: string }[];
  therapieformDetails: { id: string; label: string; hinweis: string }[];
};

export type NextStepInput = {
  erreichtesUnterziel: SmartUnterziel;
  oberziel: string;
  codes: IcfSelection[];
  alterHalbjahre: number;
};

// ── Provider-Interface ────────────────────────────────────────────────────────

export interface AiProvider {
  suggestCodes(input: SuggestCodesInput): Promise<CodeVorschlag[]>;
  generateGoals(input: GenerateGoalsInput): Promise<Foerderziel[]>;
  nextStep(input: NextStepInput): Promise<SmartUnterziel>;
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
