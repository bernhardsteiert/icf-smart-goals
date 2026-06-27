import type { CodeVorschlag, Foerderziel, SmartUnterziel } from "@/lib/types";
import type { AiProvider, GenerateGoalsInput, SuggestCodesInput, NextStepInput } from "./provider";
import {
  foerderzielArraySchema,
  codeVorschlagArraySchema,
  smartUnterzielSchema,
  GEMINI_GOALS_SCHEMA,
  GEMINI_CODES_SCHEMA,
  GEMINI_NEXT_STEP_SCHEMA,
} from "./schema";
import {
  SYSTEM_PROMPT_GOALS,
  SYSTEM_PROMPT_CODES,
  buildGoalsUserPrompt,
  buildCodesUserPrompt,
  buildNextStepUserPrompt,
} from "./prompts";

const TIMEOUT_MS = 30_000;

type GeminiRequest = {
  systemInstruction?: { parts: { text: string }[] };
  contents: { role: string; parts: { text: string }[] }[];
  generationConfig: {
    responseMimeType: string;
    responseSchema: object;
  };
};

async function callGemini(body: GeminiRequest): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY ist nicht gesetzt. Bitte .env.local anlegen.");
  }
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const doFetch = () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  };

  let res = await doFetch();

  // Ein Retry bei Server-Fehlern (5xx)
  if (res.status >= 500) {
    await new Promise((r) => setTimeout(r, 2000));
    res = await doFetch();
  }

  if (res.status === 429) {
    throw new Error("429 KI-Kontingent erschöpft. Bitte später erneut versuchen.");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini API Fehler ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string };
  };

  if (json.error) {
    throw new Error(`Gemini Fehler: ${json.error.message ?? "Unbekannt"}`);
  }

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini hat keine Textantwort zurückgegeben.");
  }
  return text;
}

function parseAndValidate<T>(raw: string, schema: { safeParse(v: unknown): { success: true; data: T } | { success: false; error: { message: string } } }): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`KI-Antwort ist kein gültiges JSON: ${raw.slice(0, 200)}`);
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`KI-Antwort entspricht nicht dem erwarteten Schema: ${result.error.message}`);
  }
  return result.data;
}

export class GeminiProvider implements AiProvider {
  async generateGoals(input: GenerateGoalsInput): Promise<Foerderziel[]> {
    const raw = await callGemini({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT_GOALS }] },
      contents: [{ role: "user", parts: [{ text: buildGoalsUserPrompt(input) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: GEMINI_GOALS_SCHEMA,
      },
    });
    return parseAndValidate(raw, foerderzielArraySchema);
  }

  async suggestCodes(input: SuggestCodesInput): Promise<CodeVorschlag[]> {
    const raw = await callGemini({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT_CODES }] },
      contents: [{ role: "user", parts: [{ text: buildCodesUserPrompt(input) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: GEMINI_CODES_SCHEMA,
      },
    });
    return parseAndValidate(raw, codeVorschlagArraySchema);
  }

  async nextStep(input: NextStepInput): Promise<SmartUnterziel> {
    const raw = await callGemini({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT_GOALS }] },
      contents: [{ role: "user", parts: [{ text: buildNextStepUserPrompt(input) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: GEMINI_NEXT_STEP_SCHEMA,
      },
    });
    return parseAndValidate(raw, smartUnterzielSchema);
  }
}
