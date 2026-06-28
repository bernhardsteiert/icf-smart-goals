"use client";

import { useState } from "react";
import type { Foerderziel, IcfSelection } from "@/lib/types";
import { requestGoals } from "@/lib/goals-client";
import SelectionSummary from "./SelectionSummary";

interface Props {
  therapieformen: string[];
  auswahl: IcfSelection[];
  alterHalbjahre: number;
  merkmale: Record<string, unknown>;
  beobachtung: string;
  hasZiele: boolean;
  onGenerated: (ziele: Foerderziel[]) => void;
  onGoToZiele: () => void;
}

export default function StepUebersicht({
  therapieformen,
  auswahl,
  alterHalbjahre,
  merkmale,
  beobachtung,
  hasZiele,
  onGenerated,
  onGoToZiele,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate = auswahl.length > 0 && therapieformen.length > 0;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const ziele = await requestGoals({
        therapieformen,
        codes: auswahl,
        alterHalbjahre,
        merkmale,
        beobachtung: beobachtung || undefined,
      });
      onGenerated(ziele);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {!canGenerate ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {auswahl.length === 0
            ? "Bitte zunächst in Schritt 3 ICF-Codes auswählen."
            : "Bitte zunächst in Schritt 1 eine Therapieform wählen."}
        </div>
      ) : (
        <SelectionSummary
          therapieformen={therapieformen}
          auswahl={auswahl}
          alterHalbjahre={alterHalbjahre}
          merkmale={merkmale}
          beobachtung={beobachtung}
        />
      )}

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
        ) : hasZiele ? (
          "Ziele neu vorschlagen"
        ) : (
          "Ziele vorschlagen"
        )}
      </button>

      {hasZiele && !loading && (
        <button
          type="button"
          onClick={onGoToZiele}
          className="w-full rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Zu den vorhandenen Zielen →
        </button>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>Fehler:</strong> {error}
        </div>
      )}
    </div>
  );
}
