import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProvider } from "@/lib/ai/provider";
import { getAllCodes } from "@/lib/icf";

const requestSchema = z.object({
  oberziel: z.string().min(1),
  bisherigesZiel: z.string().min(1),
  modus: z.enum([
    "einfacher",
    "ambitionierter",
    "umformulieren",
    "freitext",
  ]),
  freitext: z.string().optional(),
  alterHalbjahre: z.number().min(0).max(14),
  merkmale: z.record(z.string(), z.unknown()),
  beobachtung: z.string().optional(),
  codes: z.array(z.string()),
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
  const codeDetails = data.codes.flatMap((key) => {
    const found = allCodes.find((c) => c.code === key);
    return found
      ? [{ code: found.code, title: found.title, description: found.description }]
      : [];
  });

  try {
    const provider = getProvider();
    const unterziel = await provider.refineUnterziel({ ...data, codeDetails });
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
    console.error("[refine-goal]", err);
    return NextResponse.json(
      { error: "Verfeinern fehlgeschlagen. Bitte erneut versuchen." },
      { status: 502 },
    );
  }
}
