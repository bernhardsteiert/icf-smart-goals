import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/ai/provider";
import { getAllCodes } from "@/lib/icf";

const requestSchema = z.object({
  therapieformen: z.array(z.string()).min(1),
  vorgespraechCodes: z.array(z.string()),
  merkmale: z.record(z.string(), z.unknown()),
  beobachtung: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "Ungültige Eingabe." },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const allCodes = getAllCodes();
  const catalogCodes = allCodes.map((c) => ({
    code: c.code,
    title: c.title,
    description: c.description,
  }));
  const validCodeKeys = new Set(allCodes.map((c) => c.code));

  try {
    const provider = getProvider();
    const rawVorschlaege = await provider.suggestCodes({ ...data, catalogCodes });

    // Nur Codes aus dem Katalog übernehmen (KI darf keine Codes erfinden)
    const vorschlaege = rawVorschlaege.filter((v) => validCodeKeys.has(v.code));

    return NextResponse.json({ vorschlaege });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    if (msg.includes("429")) {
      return NextResponse.json(
        { error: "KI-Kontingent erschöpft. Bitte kurz warten und erneut versuchen." },
        { status: 429 },
      );
    }
    if (msg.includes("503") || msg.includes("überlastet")) {
      return NextResponse.json(
        { error: "Die KI ist momentan überlastet. Bitte kurz warten und erneut versuchen." },
        { status: 503 },
      );
    }
    if (msg.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        { error: "Kein API-Schlüssel konfiguriert. Bitte GEMINI_API_KEY in .env.local eintragen." },
        { status: 502 },
      );
    }
    console.error("[suggest-codes]", err);
    return NextResponse.json(
      { error: "Code-Vorschläge konnten nicht geladen werden. Bitte erneut versuchen." },
      { status: 502 },
    );
  }
}
