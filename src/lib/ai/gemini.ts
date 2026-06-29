import type { CodeVorschlag, Foerderziel, Oberziel, SmartUnterziel } from "@/lib/types";
import type {
  AiProvider,
  GenerateOberzieleInput,
  GenerateUnterzieleInput,
  SuggestCodesInput,
  NextStepInput,
  RefineUnterzielInput,
} from "./provider";
import {
  foerderzielArraySchema,
  oberzielArraySchema,
  codeVorschlagArraySchema,
  smartUnterzielSchema,
  GEMINI_GOALS_SCHEMA,
  GEMINI_OBERZIELE_SCHEMA,
  GEMINI_CODES_SCHEMA,
  GEMINI_NEXT_STEP_SCHEMA,
} from "./schema";
import {
  SYSTEM_PROMPT_OBERZIELE,
  SYSTEM_PROMPT_UNTERZIELE,
  SYSTEM_PROMPT_CODES,
  buildOberzieleUserPrompt,
  buildUnterzieleUserPrompt,
  buildCodesUserPrompt,
  buildNextStepUserPrompt,
  buildRefineUnterzielUserPrompt,
} from "./prompts";

const TIMEOUT_MS = 30_000;

type GeminiRequest = {
  systemInstruction?: { parts: { text: string }[] };
  contents: { role: string; parts: { text: string }[] }[];
  generationConfig: {
    responseMimeType: string;
    responseSchema: object;
    maxOutputTokens?: number;
    thinkingConfig?: { thinkingBudget: number };
  };
};

// Reicht für mehrere Förderziele mit je mehreren SMART-Unterzielen.
const MAX_OUTPUT_TOKENS = 8192;

async function callGemini(body: GeminiRequest): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY ist nicht gesetzt. Bitte .env.local anlegen.");
  }
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // gemini-2.5-flash ist ein Thinking-Modell: Ohne Begrenzung kann das
  // „Nachdenken" das Output-Budget aufbrauchen und eine leere Antwort
  // (finishReason MAX_TOKENS) liefern. Für die strukturierte JSON-Ausgabe
  // schalten wir Thinking ab und setzen ein großzügiges Output-Limit.
  const requestBody: GeminiRequest = {
    ...body,
    generationConfig: {
      ...body.generationConfig,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const doFetch = () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));
  };

  let res = await doFetch();

  // Ein Retry bei Server-Fehlern (5xx, inkl. 503 „überlastet")
  if (res.status >= 500) {
    await new Promise((r) => setTimeout(r, 2000));
    res = await doFetch();
  }

  if (res.status === 429) {
    throw new Error("429 KI-Kontingent erschöpft. Bitte später erneut versuchen.");
  }

  if (res.status === 503) {
    throw new Error("503 Die KI ist momentan überlastet. Bitte kurz warten und erneut versuchen.");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gemini API Fehler ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    candidates?: {
      content?: { parts?: { text?: string }[] };
      finishReason?: string;
    }[];
    error?: { message?: string };
  };

  if (json.error) {
    throw new Error(`Gemini Fehler: ${json.error.message ?? "Unbekannt"}`);
  }

  const candidate = json.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
  if (!text) {
    const reason = candidate?.finishReason;
    if (reason === "MAX_TOKENS") {
      throw new Error(
        "Die KI-Antwort wurde abgeschnitten (zu lang). Bitte mit weniger Codes erneut versuchen.",
      );
    }
    if (reason === "SAFETY" || reason === "RECITATION") {
      throw new Error("Die KI hat die Antwort blockiert. Bitte Eingaben anpassen.");
    }
    throw new Error(
      `Gemini hat keine Textantwort zurückgegeben (finishReason: ${reason ?? "unbekannt"}).`,
    );
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
  async generateOberziele(input: GenerateOberzieleInput): Promise<Oberziel[]> {
    const raw = await callGemini({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT_OBERZIELE }] },
      contents: [{ role: "user", parts: [{ text: buildOberzieleUserPrompt(input) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: GEMINI_OBERZIELE_SCHEMA,
      },
    });
    return parseAndValidate(raw, oberzielArraySchema);
  }

  async generateUnterziele(input: GenerateUnterzieleInput): Promise<Foerderziel[]> {
    const raw = await callGemini({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT_UNTERZIELE }] },
      contents: [{ role: "user", parts: [{ text: buildUnterzieleUserPrompt(input) }] }],
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
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT_UNTERZIELE }] },
      contents: [{ role: "user", parts: [{ text: buildNextStepUserPrompt(input) }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: GEMINI_NEXT_STEP_SCHEMA,
      },
    });
    return parseAndValidate(raw, smartUnterzielSchema);
  }

  async refineUnterziel(input: RefineUnterzielInput): Promise<SmartUnterziel> {
    const raw = await callGemini({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT_UNTERZIELE }] },
      contents: [
        { role: "user", parts: [{ text: buildRefineUnterzielUserPrompt(input) }] },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: GEMINI_NEXT_STEP_SCHEMA,
      },
    });
    return parseAndValidate(raw, smartUnterzielSchema);
  }
}
