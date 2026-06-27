import { z } from "zod";

// ── Zod-Schemas (Laufzeit-Validierung der KI-Antworten) ───────────────────────

// Qualifier 0–4 als Literal-Union für exaktes TypeScript-Typing
const qualifierSchema = z.union([
  z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4),
]);

export const smartUnterzielSchema = z.object({
  ziel: z.string(),
  status: z.enum(["offen", "erreicht"]),
  naechsteStufe: z.string().optional(),
  begruendung: z.string(),
});

export const foerderzielSchema = z.object({
  oberziel: z.string(),
  bereich: z.string(),
  zeithorizont: z.string(),
  abgeleitetAus: z.array(z.string()),
  unterziele: z.array(smartUnterzielSchema),
});

export const foerderzielArraySchema = z.array(foerderzielSchema);

export const codeVorschlagSchema = z.object({
  code: z.string(),
  title: z.string(),
  empfohlenerQualifier: qualifierSchema.optional(),
  begruendung: z.string(),
});

export const codeVorschlagArraySchema = z.array(codeVorschlagSchema);

// ── Gemini responseSchema (JSON-Schema-Subset für strukturierte Ausgabe) ──────
// Gemini erwartet uppercase type-Strings und keine Zod-Konstrukte.

const UNTERZIEL_SCHEMA = {
  type: "OBJECT",
  properties: {
    ziel: { type: "STRING" },
    status: { type: "STRING", enum: ["offen", "erreicht"] },
    naechsteStufe: { type: "STRING" },
    begruendung: { type: "STRING" },
  },
  required: ["ziel", "status", "begruendung"],
};

export const GEMINI_GOALS_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      oberziel: { type: "STRING" },
      bereich: { type: "STRING" },
      zeithorizont: { type: "STRING" },
      abgeleitetAus: { type: "ARRAY", items: { type: "STRING" } },
      unterziele: { type: "ARRAY", items: UNTERZIEL_SCHEMA },
    },
    required: ["oberziel", "bereich", "zeithorizont", "abgeleitetAus", "unterziele"],
  },
};

export const GEMINI_CODES_SCHEMA = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      code: { type: "STRING" },
      title: { type: "STRING" },
      empfohlenerQualifier: { type: "NUMBER" },
      begruendung: { type: "STRING" },
    },
    required: ["code", "title", "begruendung"],
  },
};

export const GEMINI_NEXT_STEP_SCHEMA = UNTERZIEL_SCHEMA;
