import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/ai/provider";
import { getAllCodes, getAllTherapieformen, getAllBereiche } from "@/lib/icf";

const requestSchema = z.object({
  therapieformen: z.array(z.string()).min(1),
  codes: z
    .array(
      z.object({
        code: z.string(),
        qualifier: z.number().min(0).max(4).optional(),
        quelle: z.enum(["vorgespraech", "fachkraft"]),
      }),
    )
    .min(1, "Mindestens ein ICF-Code muss ausgewählt sein."),
  alterHalbjahre: z.number().min(0).max(14),
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
  const allTherapieformen = getAllTherapieformen();

  // Cast qualifier to the literal union type (range 0-4 already validated by Zod above)
  const codesTyped = data.codes.map((c) => ({
    ...c,
    qualifier: c.qualifier as 0 | 1 | 2 | 3 | 4 | undefined,
  }));

  const codeDetails = data.codes.flatMap((sel) => {
    const found = allCodes.find((c) => c.code === sel.code);
    return found
      ? [{ code: found.code, title: found.title, description: found.description }]
      : [];
  });

  const therapieformDetails = data.therapieformen.flatMap((id) => {
    const found = allTherapieformen.find((t) => t.id === id);
    return found
      ? [{ id: found.id, label: found.label, hinweis: found.hinweis }]
      : [];
  });

  try {
    const provider = getProvider();
    const oberziele = await provider.generateOberziele({
      ...data,
      codes: codesTyped,
      codeDetails,
      therapieformDetails,
      bereiche: getAllBereiche(),
    });
    return NextResponse.json({ oberziele });
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
    if (msg.includes("abgeschnitten")) {
      return NextResponse.json(
        { error: "Die KI-Antwort war zu lang. Bitte mit weniger Codes erneut versuchen." },
        { status: 502 },
      );
    }
    if (msg.includes("blockiert")) {
      return NextResponse.json(
        { error: "Die KI hat die Antwort blockiert. Bitte Eingaben anpassen und erneut versuchen." },
        { status: 502 },
      );
    }
    if (msg.includes("GEMINI_API_KEY")) {
      return NextResponse.json(
        { error: "Kein API-Schlüssel konfiguriert. Bitte GEMINI_API_KEY in .env.local eintragen." },
        { status: 502 },
      );
    }
    console.error("[generate-oberziele]", err);
    return NextResponse.json(
      { error: "KI-Anfrage fehlgeschlagen. Bitte erneut versuchen." },
      { status: 502 },
    );
  }
}
