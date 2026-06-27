"use client";

import { useState } from "react";
import type { Foerderziel, IcfSelection } from "@/lib/types";
import { halbjahreToText } from "@/lib/format";
import GoalCard from "./GoalCard";

interface Props {
  therapieformen: string[];
  auswahl: IcfSelection[];
  alterHalbjahre: number;
  merkmale: Record<string, unknown>;
  beobachtung: string;
  ziele: Foerderziel[];
  onZieleChange: (ziele: Foerderziel[]) => void;
}

export default function StepZiele({
  therapieformen,
  auswahl,
  alterHalbjahre,
  merkmale,
  beobachtung,
  ziele,
  onZieleChange,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = auswahl.length > 0 && therapieformen.length > 0;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          therapieformen,
          codes: auswahl,
          alterHalbjahre,
          merkmale,
          beobachtung: beobachtung || undefined,
          modus: "neu",
        }),
      });
      const data = (await res.json()) as { ziele?: Foerderziel[]; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Unbekannter Fehler beim Abrufen der Ziele.");
        return;
      }
      onZieleChange(data.ziele ?? []);
    } catch {
      setError("Netzwerkfehler. Bitte Verbindung prüfen und erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Pre-flight summary */}
      {!canGenerate ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {auswahl.length === 0
            ? "Bitte zunächst in Schritt 3 ICF-Codes auswählen."
            : "Bitte zunächst in Schritt 1 eine Therapieform wählen."}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <span className="font-medium text-gray-800">Bereit zur Zielerstellung:</span>{" "}
          {auswahl.length} Code{auswahl.length !== 1 ? "s" : ""} ausgewählt ·{" "}
          Alter {halbjahreToText(alterHalbjahre)}
        </div>
      )}

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate || loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            KI denkt nach …
          </>
        ) : ziele.length > 0 ? (
          "Ziele neu vorschlagen"
        ) : (
          "Ziele vorschlagen"
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>Fehler:</strong> {error}
        </div>
      )}

      {/* Results */}
      {ziele.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {ziele.length} Förderziel{ziele.length !== 1 ? "e" : ""} vorgeschlagen – bitte
            fachlich prüfen und bei Bedarf anpassen.
          </p>
          {ziele.map((z, i) => (
            <GoalCard key={i} ziel={z} />
          ))}
        </div>
      )}
    </div>
  );
}
