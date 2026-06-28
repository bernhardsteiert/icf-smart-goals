import type { CodeVorschlag, Foerderziel, IcfSelection, SmartUnterziel } from "./types";
import type { RefineModus } from "./ai/provider";

const NETWORK_ERROR = "Netzwerkfehler. Bitte Verbindung prüfen und erneut versuchen.";

export type GenerateGoalsClientInput = {
  therapieformen: string[];
  codes: IcfSelection[];
  alterHalbjahre: number;
  merkmale: Record<string, unknown>;
  beobachtung?: string;
};

// Fordert neue Förderziele an. Wirft Error mit nutzbarer Meldung bei Fehlern.
export async function requestGoals(
  input: GenerateGoalsClientInput,
): Promise<Foerderziel[]> {
  let res: Response;
  try {
    res = await fetch("/api/generate-goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...input, modus: "neu" }),
    });
  } catch {
    throw new Error(NETWORK_ERROR);
  }
  const data = (await res.json().catch(() => ({}))) as {
    ziele?: Foerderziel[];
    error?: string;
  };
  if (!res.ok || data.error) {
    throw new Error(data.error ?? "Unbekannter Fehler beim Abrufen der Ziele.");
  }
  return data.ziele ?? [];
}

export type RefineUnterzielClientInput = {
  oberziel: string;
  bisherigesZiel: string;
  modus: RefineModus;
  freitext?: string;
  alterHalbjahre: number;
  merkmale: Record<string, unknown>;
  beobachtung?: string;
  codes: string[];
};

export type SuggestCodesClientInput = {
  therapieformen: string[];
  vorgespraechCodes: string[];
  merkmale: Record<string, unknown>;
  beobachtung?: string;
};

// Schlägt passende ICF-CY-Codes vor. Wirft Error mit nutzbarer Meldung.
export async function requestSuggestCodes(
  input: SuggestCodesClientInput,
): Promise<CodeVorschlag[]> {
  let res: Response;
  try {
    res = await fetch("/api/suggest-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error(NETWORK_ERROR);
  }
  const data = (await res.json().catch(() => ({}))) as {
    vorschlaege?: CodeVorschlag[];
    error?: string;
  };
  if (!res.ok || data.error) {
    throw new Error(data.error ?? "Code-Vorschläge konnten nicht geladen werden.");
  }
  return data.vorschlaege ?? [];
}

export type NextStepClientInput = {
  erreichtesUnterziel: SmartUnterziel;
  oberziel: string;
  codes: string[];
  alterHalbjahre: number;
};

// Schlägt eine aufbauende nächste Stufe vor. Wirft Error mit nutzbarer Meldung.
export async function requestNextStep(
  input: NextStepClientInput,
): Promise<SmartUnterziel> {
  let res: Response;
  try {
    res = await fetch("/api/next-step", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error(NETWORK_ERROR);
  }
  const data = (await res.json().catch(() => ({}))) as {
    unterziel?: SmartUnterziel;
    error?: string;
  };
  if (!res.ok || data.error || !data.unterziel) {
    throw new Error(data.error ?? "Nächste Stufe konnte nicht geladen werden.");
  }
  return data.unterziel;
}

// Überarbeitet ein einzelnes Unterziel. Wirft Error mit nutzbarer Meldung.
export async function requestRefine(
  input: RefineUnterzielClientInput,
): Promise<SmartUnterziel> {
  let res: Response;
  try {
    res = await fetch("/api/refine-goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error(NETWORK_ERROR);
  }
  const data = (await res.json().catch(() => ({}))) as {
    unterziel?: SmartUnterziel;
    error?: string;
  };
  if (!res.ok || data.error || !data.unterziel) {
    throw new Error(data.error ?? "Verfeinern fehlgeschlagen.");
  }
  return data.unterziel;
}
