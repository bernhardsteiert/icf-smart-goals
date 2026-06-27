import type { GenerateGoalsInput, SuggestCodesInput, NextStepInput } from "./provider";

// ── Qualifier-Bedeutungen (fließen in den User-Prompt) ────────────────────────

const QUALIFIER_TEXT: Record<number, string> = {
  0: "kein Problem",
  1: "leichtes Problem",
  2: "mäßiges Problem",
  3: "erhebliches Problem",
  4: "vollständiges Problem",
};

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function halbjahreToText(halbjahre: number): string {
  if (halbjahre === 0) return "unter 6 Monate";
  const years = Math.floor(halbjahre / 2);
  const months = (halbjahre % 2) * 6;
  if (years === 0) return `${months} Monate`;
  if (months === 0) return `${years} Jahr${years !== 1 ? "e" : ""}`;
  return `${years} Jahr${years !== 1 ? "e" : ""} und ${months} Monate`;
}

function merkmaleToText(merkmale: Record<string, unknown>): string {
  const lines: string[] = [];
  if (merkmale.kontext) lines.push(`Kontext: ${merkmale.kontext}`);
  if (merkmale.sprachbarriere) lines.push("Sprachbarriere / Mehrsprachigkeit: ja");
  if (merkmale.koerperlich) lines.push("Körperliche Einschränkung: ja");
  return lines.length > 0 ? lines.join(", ") : "keine weiteren Merkmale angegeben";
}

// ── System-Prompts ────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT_GOALS = `Du bist eine erfahrene Fachkraft der heilpädagogischen Frühförderung und \
arbeitest auf Basis der ICF-CY (International Classification of Functioning, Children & Youth). \
Deine Aufgabe ist es, ENTWÜRFE für Förderziele zu erstellen, die eine Fachkraft anschließend prüft und verantwortet.

Regeln:
- Erstelle Oberziele mit jeweils mehreren messbaren SMART-Unterzielen \
(spezifisch, messbar, erreichbar, relevant, terminiert).
- Plane realistisch für ca. ein Jahr Förderung (Richtwert 42 Therapieeinheiten).
- Leite Ziele ausschließlich aus den übergebenen ICF-CY-Codes, dem Alter und den \
Merkmalen ab. Erfinde keine Testnormen, Diagnosen oder Fakten.
- Jedes Unterziel braucht einen konkreten, beobachtbaren Messindikator im Feld "messbar".
- Schreibe auf Deutsch, wertschätzend und ressourcenorientiert.
- Passe die Sprache an den Modus an: \
"neu" und "fachintern" → Fachsprache; "elterngerecht" → alltagsnahe, positive Sprache.
- Antworte AUSSCHLIESSLICH mit JSON gemäß vorgegebenem Schema. Kein Fließtext außerhalb des JSON.`;

export const SYSTEM_PROMPT_CODES = `Du bist eine erfahrene Fachkraft der heilpädagogischen Frühförderung (ICF-CY). \
Aufgabe: Ordne den beschriebenen aktuellen Entwicklungsstand passenden ICF-CY-Codes zu. \
Verwende NUR Codes aus dem mitgelieferten Katalog (keine Erfindung), Schwerpunkt Kapitel d. \
Begründe je Code kurz. Antworte ausschließlich als JSON gemäß Schema.`;

// ── User-Prompt-Builder ───────────────────────────────────────────────────────

export function buildGoalsUserPrompt(input: GenerateGoalsInput): string {
  const parts: string[] = [];

  // Therapieform(en)
  const tfLines = input.therapieformDetails
    .map((t) => `- ${t.label}: ${t.hinweis}`)
    .join("\n");
  parts.push(`Therapieform(en):\n${tfLines}`);

  // Codes
  const codeLines = input.codes.map((sel) => {
    const detail = input.codeDetails.find((d) => d.code === sel.code);
    if (!detail) return `- ${sel.code} (unbekannt)`;
    const qPart =
      sel.qualifier !== undefined
        ? ` [Qualifier ${sel.qualifier}: ${QUALIFIER_TEXT[sel.qualifier]}]`
        : "";
    return `- ${detail.code} ${detail.title}${qPart}: ${detail.description}`;
  });
  parts.push(`Aktueller Stand – ausgewählte ICF-CY-Codes:\n${codeLines.join("\n")}`);

  // Alter
  parts.push(`Alter: ${halbjahreToText(input.alterHalbjahre)}`);

  // Merkmale
  parts.push(`Merkmale: ${merkmaleToText(input.merkmale)}`);

  // Beobachtung (optional, anonym)
  if (input.beobachtung?.trim()) {
    parts.push(`Beobachtung (anonym, Stichworte): ${input.beobachtung.trim()}`);
  }

  // Modus
  const modusText: Record<typeof input.modus, string> = {
    neu: "Neu erstellen",
    einfacher: "Einfacher / weniger anspruchsvoll",
    ambitionierter: "Ambitionierter / anspruchsvoller",
    umformulieren: "Anders formulieren",
    elterngerecht: "Elterngerecht (alltagsnahe Sprache)",
  };
  parts.push(`Modus: ${modusText[input.modus]}`);

  // Verfeinerungsbezug (bei Folge-Anfragen)
  if (input.bezugsziel) {
    parts.push(
      `Bezug auf: Oberziel "${input.bezugsziel.oberziel}"` +
        (input.bezugsziel.unterziel
          ? ` → Unterziel "${input.bezugsziel.unterziel}"`
          : ""),
    );
  }

  return parts.join("\n\n");
}

export function buildCodesUserPrompt(input: SuggestCodesInput): string {
  const parts: string[] = [];

  parts.push(`Therapieform(en): ${input.therapieformen.join(", ")}`);

  if (input.vorgespraechCodes.length > 0) {
    parts.push(`Vorgespräch-Codes: ${input.vorgespraechCodes.join(", ")}`);
  }

  parts.push(`Verfügbare Codes im Katalog:\n${input.catalogCodes
    .map((c) => `- ${c.code} ${c.title}: ${c.description}`)
    .join("\n")}`);

  if (input.beobachtung?.trim()) {
    parts.push(`Beobachtung (anonym): ${input.beobachtung.trim()}`);
  }

  parts.push(`Merkmale: ${merkmaleToText(input.merkmale)}`);

  return parts.join("\n\n");
}

export function buildNextStepUserPrompt(input: NextStepInput): string {
  return [
    `Erreichtes Unterziel: "${input.erreichtesUnterziel.ziel}"`,
    `Oberziel: "${input.oberziel}"`,
    `Alter: ${halbjahreToText(input.alterHalbjahre)}`,
    `Aufgabe: Schlage ein darauf aufbauendes, schwierigeres nächstes Unterziel vor (Progression). \
Das neue Unterziel soll auf dem Erreichten aufbauen und eine realistische nächste Entwicklungsstufe beschreiben.`,
  ].join("\n\n");
}
