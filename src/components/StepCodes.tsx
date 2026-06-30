"use client";

import { useState } from "react";
import type { CodeVorschlag, IcfCode, IcfSelection, Hauptbereich } from "@/lib/types";
import { requestSuggestCodes } from "@/lib/goals-client";
import CodeCatalog from "./CodeCatalog";

const QUALIFIER_LABELS: Record<number, string> = {
  0: "kein Problem",
  1: "leichtes Problem",
  2: "mäßiges Problem",
  3: "erhebliches Problem",
  4: "vollständiges Problem",
};

// Wie viele KI-Vorschläge direkt sichtbar sind; der Rest klappt auf Knopfdruck aus.
const INITIAL_VISIBLE = 4;

interface Props {
  gruppen: Hauptbereich[];
  allCodes: IcfCode[];
  auswahl: IcfSelection[];
  vorgespraechCodes: string[];
  therapieformen: string[];
  merkmale: Record<string, unknown>;
  onChange: (auswahl: IcfSelection[]) => void;
}

export default function StepCodes({
  gruppen,
  allCodes,
  auswahl,
  vorgespraechCodes,
  therapieformen,
  merkmale,
  onChange,
}: Props) {
  const [vorschlaege, setVorschlaege] = useState<CodeVorschlag[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [stichwort, setStichwort] = useState("");

  const toggle = (code: string) => {
    const exists = auswahl.find((a) => a.code === code);
    if (exists) {
      onChange(auswahl.filter((a) => a.code !== code));
    } else {
      const quelle = vorgespraechCodes.includes(code)
        ? ("vorgespraech" as const)
        : ("fachkraft" as const);
      onChange([...auswahl, { code, quelle }]);
    }
  };

  const setQualifier = (
    code: string,
    qualifier: 0 | 1 | 2 | 3 | 4 | undefined,
  ) => {
    onChange(auswahl.map((a) => (a.code === code ? { ...a, qualifier } : a)));
  };

  const handleSuggest = async () => {
    setLoading(true);
    setFehler(null);
    setVorschlaege([]);
    setExpanded(false);
    try {
      const result = await requestSuggestCodes({
        therapieformen,
        vorgespraechCodes,
        merkmale,
        beobachtung: stichwort.trim() || undefined,
      });
      setVorschlaege(result);
      if (result.length === 0) {
        setFehler("Die KI hat keine passenden Codes gefunden. Bitte Codes manuell auswählen.");
      }
    } catch (err) {
      setFehler(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = (v: CodeVorschlag) => {
    const alreadySelected = auswahl.some((a) => a.code === v.code);
    if (alreadySelected) return;
    const newEntry: IcfSelection = {
      code: v.code,
      quelle: "fachkraft",
      ...(v.empfohlenerQualifier !== undefined
        ? { qualifier: v.empfohlenerQualifier }
        : {}),
    };
    onChange([...auswahl, newEntry]);
    // Vorschlag aus der Liste entfernen, sobald er übernommen wurde
    setVorschlaege((prev) => prev.filter((p) => p.code !== v.code));
  };

  const selectedCodes = auswahl.map((a) => a.code);
  const qualifierOf = (code: string) =>
    auswahl.find((a) => a.code === code)?.qualifier;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Überprüfen Sie, welche ICF-CY-Codes aktuell zum Stand des Kindes passen.
        Bestätigen Sie die Vorgespräch-Codes oder wählen Sie passendere aus.
        Tippen Sie auf einen Code für die Erklärung. Der Schweregrad (Qualifier)
        ist optional.
      </p>

      {/* KI-Code-Vorschläge */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">
          Passende Codes von der KI vorschlagen lassen
        </p>
        <div className="space-y-2">
          <label className="block text-xs text-gray-600">
            Kurze Beobachtung (Stichworte, optional)
          </label>
          <input
            type="text"
            value={stichwort}
            onChange={(e) => setStichwort(e.target.value)}
            placeholder="z.B. spielt wenig mit anderen, vermeidet Augenkontakt …"
            maxLength={300}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="text-xs text-amber-700">
            Hinweis: Kein Klarname, kein Geburtsdatum – nur anonyme Stichworte zum Entwicklungsstand.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSuggest}
          disabled={loading || therapieformen.length === 0}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Codes werden vorgeschlagen …
            </>
          ) : (
            "Passende Codes vorschlagen"
          )}
        </button>

        {fehler && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {fehler}
          </p>
        )}

        {vorschlaege.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Vorschläge der KI – Entwurf, bitte prüfen
            </p>
            {(expanded ? vorschlaege : vorschlaege.slice(0, INITIAL_VISIBLE)).map((v) => {
              const alreadySelected = auswahl.some((a) => a.code === v.code);
              return (
                <div
                  key={v.code}
                  className="rounded-lg border border-gray-200 bg-white p-3 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-sm font-semibold text-gray-800">
                        {v.code}
                      </span>{" "}
                      <span className="text-sm text-gray-700">{v.title}</span>
                      {v.empfohlenerQualifier !== undefined && (
                        <span className="ml-2 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                          Qualifier {v.empfohlenerQualifier}:{" "}
                          {QUALIFIER_LABELS[v.empfohlenerQualifier]}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAccept(v)}
                      disabled={alreadySelected}
                      className="shrink-0 min-h-[36px] rounded-lg border border-blue-600 px-3 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-default"
                    >
                      {alreadySelected ? "Bereits gewählt" : "Übernehmen"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">{v.begruendung}</p>
                </div>
              );
            })}

            {vorschlaege.length > INITIAL_VISIBLE && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                aria-expanded={expanded}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50"
              >
                {expanded
                  ? "Weniger anzeigen ▲"
                  : `Weitere ${vorschlaege.length - INITIAL_VISIBLE} Vorschläge anzeigen ▼`}
              </button>
            )}
          </div>
        )}
      </div>

      <CodeCatalog
        gruppen={gruppen}
        allCodes={allCodes}
        selectedCodes={selectedCodes}
        onToggle={toggle}
        variant="qualifier"
        qualifierOf={qualifierOf}
        onQualifier={setQualifier}
        vorgespraechCodes={vorgespraechCodes}
      />
    </div>
  );
}
