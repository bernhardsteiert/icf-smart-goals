import type {
  GenerateOberzieleInput,
  GenerateUnterzieleInput,
  SuggestCodesInput,
  NextStepInput,
  RefineUnterzielInput,
} from "./provider";
import { halbjahreToText } from "@/lib/format";

// ── Qualifier-Bedeutungen (fließen in den User-Prompt) ────────────────────────

const QUALIFIER_TEXT: Record<number, string> = {
  0: "kein Problem",
  1: "leichtes Problem",
  2: "mäßiges Problem",
  3: "erhebliches Problem",
  4: "vollständiges Problem",
};

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function merkmaleToText(merkmale: Record<string, unknown>): string {
  const lines: string[] = [];
  if (merkmale.kontext) lines.push(`Kontext: ${merkmale.kontext}`);
  if (merkmale.sprachbarriere) lines.push("Sprachbarriere / Mehrsprachigkeit: ja");
  if (merkmale.koerperlich) lines.push("Körperliche Einschränkung: ja");
  return lines.length > 0 ? lines.join(", ") : "keine weiteren Merkmale angegeben";
}

// ── System-Prompts ────────────────────────────────────────────────────────────

export const SYSTEM_PROMPT_OBERZIELE = `Du bist eine erfahrene Fachkraft der heilpädagogischen Frühförderung und \
arbeitest auf Basis der ICF-CY (International Classification of Functioning, Children & Youth). \
Deine Aufgabe ist es, in einem ERSTEN Schritt nur die ÜBERGEORDNETEN FÖRDERRICHTUNGEN \
(Oberziele) als ENTWURF vorzuschlagen – noch KEINE konkreten Unterziele.

Regeln:
- Schlage 3–5 Oberziele vor. Jedes Oberziel beschreibt eine FÖRDERRICHTUNG (das \
übergeordnete „Wohin"), nicht ein konkret messbares Einzelziel.
- Pro Oberziel: ein kurzer, prägnanter Titel im Feld "oberziel", ein passender \
"bereich" (z.B. „Sprachliche Entwicklung", „Selbstständigkeit") und die zugrunde \
liegenden ICF-CY-Codes im Feld "abgeleitetAus" (nur Codes aus der Eingabe).
- Leite die Oberziele ausschließlich aus den übergebenen ICF-CY-Codes, dem Alter \
und den Merkmalen ab. Erfinde keine Testnormen, Diagnosen oder Fakten.
- Schreibe auf Deutsch, wertschätzend und ressourcenorientiert.
- Antworte AUSSCHLIESSLICH mit JSON gemäß vorgegebenem Schema. Kein Fließtext außerhalb des JSON.`;

export const SYSTEM_PROMPT_UNTERZIELE = `Du bist eine erfahrene Fachkraft der heilpädagogischen Frühförderung und \
arbeitest auf Basis der ICF-CY (International Classification of Functioning, Children & Youth). \
Deine Aufgabe ist es, ENTWÜRFE für Förderziele zu erstellen, die eine Fachkraft anschließend prüft und verantwortet.

Regeln:
- Übernimm die VORGEGEBENEN Oberziele unverändert (Titel, Bereich, abgeleitetAus) \
und erstelle zu JEDEM jeweils mehrere SMART-Unterziele. Erfinde keine zusätzlichen \
Oberziele und lass keine weg.
- Jedes Unterziel ist GENAU EIN Ziel und wird in ZWEI Sprachversionen DESSELBEN \
Ziels formuliert:
  • Feld "ziel": fachsprachliche Formulierung für die Fachkraft.
  • Feld "zielEltern": dieselbe Aussage in alltagsnaher, wertschätzender Sprache \
für die Eltern (keine Fachbegriffe, gut verständlich).
  Beide Versionen sind jeweils EIN zusammenhängender, ausformulierter Satz, der \
ALLE SMART-Kriterien zugleich erfüllt: spezifisch, messbar (konkreter, \
beobachtbarer Indikator), erreichbar, relevant und terminiert. Inhalt, Anspruch \
und Messbarkeit sind in BEIDEN Versionen IDENTISCH – nur Wortwahl und Ton \
unterscheiden sich. Schlüssele die Kriterien NICHT in Einzelfelder auf.
- Planungshintergrund (NICHT im Text erwähnen): ein Förderzeitraum von ca. einem \
Jahr bzw. rund 42 Therapieeinheiten. Nutze das nur, um den Anspruch realistisch zu \
wählen. Nenne KEINE konkreten Monats- oder Einheitenzahlen in den Zielen; formuliere \
den Zeitbezug allgemein, z.B. "bis zum Ende des Förderzeitraums".
- Leite Ziele ausschließlich aus den übergebenen ICF-CY-Codes, dem Alter und den \
Merkmalen ab. Erfinde keine Testnormen, Diagnosen oder Fakten.
- Schreibe auf Deutsch, wertschätzend und ressourcenorientiert.
- Antworte AUSSCHLIESSLICH mit JSON gemäß vorgegebenem Schema. Kein Fließtext außerhalb des JSON.`;

export const SYSTEM_PROMPT_CODES = `Du bist eine erfahrene Fachkraft der heilpädagogischen Frühförderung (ICF-CY). \
Aufgabe: Ordne den beschriebenen aktuellen Entwicklungsstand passenden ICF-CY-Codes zu. \
Verwende NUR Codes aus dem mitgelieferten Katalog (keine Erfindung), Schwerpunkt Kapitel d. \
Begründe je Code kurz. Antworte ausschließlich als JSON gemäß Schema.`;

// ── User-Prompt-Builder ───────────────────────────────────────────────────────

// Gemeinsamer Fall-Kontext (Therapieform, Codes, Alter, Merkmale, Beobachtung)
// für beide Generierungs-Stufen.
function buildContextParts(input: GenerateOberzieleInput): string[] {
  const parts: string[] = [];

  const tfLines = input.therapieformDetails
    .map((t) => `- ${t.label}: ${t.hinweis}`)
    .join("\n");
  parts.push(`Therapieform(en):\n${tfLines}`);

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

  parts.push(`Alter: ${halbjahreToText(input.alterHalbjahre)}`);
  parts.push(`Merkmale: ${merkmaleToText(input.merkmale)}`);

  if (input.beobachtung?.trim()) {
    parts.push(`Beobachtung (anonym, Stichworte): ${input.beobachtung.trim()}`);
  }

  return parts;
}

// Stufe 1: nur Oberziele.
export function buildOberzieleUserPrompt(input: GenerateOberzieleInput): string {
  const parts = buildContextParts(input);
  parts.push(
    `Aufgabe: Schlage daraus 3–5 übergeordnete Förderrichtungen (Oberziele) als ` +
      `Entwurf vor – jeweils mit Titel, Bereich und den zugrunde liegenden Codes ` +
      `(abgeleitetAus). NOCH KEINE Unterziele.`,
  );
  return parts.join("\n\n");
}

// Stufe 2: SMART-Unterziele zu den bestätigten Oberzielen.
export function buildUnterzieleUserPrompt(input: GenerateUnterzieleInput): string {
  const parts = buildContextParts(input);

  const ozLines = input.oberziele
    .map((o, i) => {
      const codes = o.abgeleitetAus.length
        ? ` [abgeleitetAus: ${o.abgeleitetAus.join(", ")}]`
        : "";
      return `${i + 1}. "${o.oberziel}" (Bereich: ${o.bereich})${codes}`;
    })
    .join("\n");
  parts.push(
    `Von der Fachkraft bestätigte Oberziele (unverändert übernehmen, ` +
      `abgeleitetAus beibehalten):\n${ozLines}`,
  );
  parts.push(
    `Aufgabe: Erstelle zu JEDEM dieser Oberziele mehrere SMART-Unterziele – je in ` +
      `beiden Sprachversionen ("ziel" fachsprachlich und "zielEltern" elterngerecht).`,
  );

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
Das neue Unterziel soll auf dem Erreichten aufbauen und eine realistische nächste Entwicklungsstufe beschreiben. \
Gib BEIDE Sprachversionen desselben Ziels zurück: Feld "ziel" (fachsprachlich) und Feld "zielEltern" \
(alltagsnah/elterngerecht) – inhaltlich identisch, nur Wortwahl/Ton unterscheiden sich.`,
  ].join("\n\n");
}

const REFINE_MODUS_TEXT: Record<RefineUnterzielInput["modus"], string> = {
  einfacher: "Mache das Ziel EINFACHER / weniger anspruchsvoll.",
  ambitionierter: "Mache das Ziel AMBITIONIERTER / anspruchsvoller.",
  umformulieren: "Formuliere dasselbe Ziel ANDERS (gleicher Anspruch, neue Formulierung).",
  freitext: "Überarbeite das Ziel gemäß der gewünschten Änderung der Fachkraft.",
};

export function buildRefineUnterzielUserPrompt(input: RefineUnterzielInput): string {
  const parts: string[] = [];
  parts.push(`Oberziel (Richtung, bleibt gleich): "${input.oberziel}"`);
  parts.push(`Zu überarbeitendes Unterziel: "${input.bisherigesZiel}"`);

  const codeLines = input.codeDetails
    .map((d) => `- ${d.code} ${d.title}: ${d.description}`)
    .join("\n");
  if (codeLines) parts.push(`Bezug ICF-CY-Codes:\n${codeLines}`);

  parts.push(`Alter: ${halbjahreToText(input.alterHalbjahre)}`);
  parts.push(`Merkmale: ${merkmaleToText(input.merkmale)}`);
  if (input.beobachtung?.trim()) {
    parts.push(`Beobachtung (anonym): ${input.beobachtung.trim()}`);
  }

  parts.push(`Änderungswunsch: ${REFINE_MODUS_TEXT[input.modus]}`);
  if (input.modus === "freitext" && input.freitext?.trim()) {
    parts.push(`Konkrete Vorgabe der Fachkraft: ${input.freitext.trim()}`);
  }

  parts.push(
    `Gib GENAU EIN überarbeitetes Unterziel als JSON zurück, mit BEIDEN \
Sprachversionen desselben Ziels: Feld "ziel" (fachsprachlich) und Feld \
"zielEltern" (alltagsnah/elterngerecht). Beide sind ein ausformulierter SMART-Satz, \
der alle SMART-Kriterien zugleich erfüllt; Inhalt und Anspruch sind identisch, nur \
Wortwahl/Ton unterscheiden sich. Behalte den Status "offen", außer es ist anders \
sinnvoll.`,
  );

  return parts.join("\n\n");
}
