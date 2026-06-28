"use client";

import type { IcfSelection } from "@/lib/types";
import SelectionSummary from "./SelectionSummary";

interface Props {
  therapieformen: string[];
  auswahl: IcfSelection[];
  alterHalbjahre: number;
  merkmale: Record<string, unknown>;
  beobachtung: string;
  hasZiele: boolean;
  canGenerate: boolean;
  error: string | null;
}

/**
 * Schritt 5: reine Zusammenfassung der Auswahl. Der Vorwärtsschritt (Ziele
 * erstellen bzw. zu vorhandenen Zielen wechseln) läuft jetzt über den normalen
 * „Weiter →"-Button in der Wizard-Navigation; während der Generierung blendet
 * der Wizard ein Lade-Overlay ein.
 */
export default function StepUebersicht({
  therapieformen,
  auswahl,
  alterHalbjahre,
  merkmale,
  beobachtung,
  hasZiele,
  canGenerate,
  error,
}: Props) {
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

      {canGenerate && hasZiele && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Es bestehen bereits Förderziele. „Weiter“ führt direkt dorthin – neu
          vorschlagen lassen kannst du sie dort.
        </div>
      )}

      {canGenerate && !hasZiele && (
        <p className="text-sm text-gray-500">
          Mit „Weiter“ werden aus dieser Auswahl Förderziele als Entwurf erstellt.
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>Fehler:</strong> {error}
        </div>
      )}
    </div>
  );
}
