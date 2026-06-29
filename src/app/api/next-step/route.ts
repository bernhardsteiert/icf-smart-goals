import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/ai/provider";

const unterzielSchema = z.object({
  ziel: z.string(),
  zielEltern: z.string(),
  status: z.enum(["offen", "erreicht"]),
  naechsteStufe: z.string().optional(),
  begruendung: z.string(),
});

const requestSchema = z.object({
  erreichtesUnterziel: unterzielSchema,
  oberziel: z.string().min(1),
  codes: z.array(z.string()),
  alterHalbjahre: z.number().min(0).max(14),
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

  try {
    const provider = getProvider();
    const unterziel = await provider.nextStep({
      erreichtesUnterziel: data.erreichtesUnterziel,
      oberziel: data.oberziel,
      codes: data.codes.map((c) => ({ code: c, quelle: "fachkraft" as const })),
      alterHalbjahre: data.alterHalbjahre,
    });
    return NextResponse.json({ unterziel });
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
    console.error("[next-step]", err);
    return NextResponse.json(
      { error: "Nächste Stufe konnte nicht vorgeschlagen werden. Bitte erneut versuchen." },
      { status: 502 },
    );
  }
}
