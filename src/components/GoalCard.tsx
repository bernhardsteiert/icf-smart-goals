"use client";

import { useState } from "react";
import type { Foerderziel } from "@/lib/types";
import type { RefineModus } from "@/lib/ai/provider";
import { detectsKlarname } from "@/lib/privacy";

const PRESET_BUTTONS: { modus: RefineModus; label: string }[] = [
  { modus: "einfacher", label: "Einfacher" },
  { modus: "ambitionierter", label: "Ambitionierter" },
  { modus: "umformulieren", label: "Anders formulieren" },
  { modus: "elterngerecht", label: "Für Eltern" },
];

interface Props {
  ziel: Foerderziel;
  zielIndex: number;
  selected: Set<string>;
  onToggleSelect: (key: string) => void;
  onRefineUnterziel: (
    uzIndex: number,
    modus: RefineModus,
    freitext?: string,
  ) => void;
  busyUnterziel: number | null;
  onToggleStatus: (uzIndex: number) => void;
  onNextStep: (uzIndex: number) => void;
  busyNextStep: number | null;
  onEditZiel: (uzIndex: number, newZiel: string) => void;
  onRemove: () => void;
}

export default function GoalCard({
  ziel,
  zielIndex,
  selected,
  onToggleSelect,
  onRefineUnterziel,
  busyUnterziel,
  onToggleStatus,
  onNextStep,
  busyNextStep,
  onEditZiel,
  onRemove,
}: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex-1 text-base font-semibold text-gray-900">
            {ziel.oberziel}
          </h3>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Ganzes Oberziel verwerfen"
            title="Ganzes Oberziel verwerfen"
            className="-mr-1 -mt-1 flex-shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        </div>
        <div className="mt-1.5">
          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-700">
            {ziel.bereich}
          </span>
        </div>
        {ziel.abgeleitetAus.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="text-xs text-gray-400">Abgeleitet aus:</span>
            {ziel.abgeleitetAus.map((code) => (
              <span
                key={code}
                className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600"
              >
                {code}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Unterziele */}
      <div className="divide-y divide-gray-100 px-5 py-1">
        {ziel.unterziele.map((uz, i) => {
          const key = `${zielIndex}:${i}`;
          return (
            <UnterzielRow
              key={i}
              unterziel={uz}
              selected={selected.has(key)}
              onToggleSelect={() => onToggleSelect(key)}
              onRefine={(modus, freitext) => onRefineUnterziel(i, modus, freitext)}
              busy={busyUnterziel === i}
              onToggleStatus={() => onToggleStatus(i)}
              onNextStep={() => onNextStep(i)}
              busyNextStep={busyNextStep === i}
              onEdit={(newZiel) => onEditZiel(i, newZiel)}
            />
          );
        })}
      </div>
    </div>
  );
}

function UnterzielRow({
  unterziel,
  selected,
  onToggleSelect,
  onRefine,
  busy,
  onToggleStatus,
  onNextStep,
  busyNextStep,
  onEdit,
}: {
  unterziel: Foerderziel["unterziele"][number];
  selected: boolean;
  onToggleSelect: () => void;
  onRefine: (modus: RefineModus, freitext?: string) => void;
  busy: boolean;
  onToggleStatus: () => void;
  onNextStep: () => void;
  busyNextStep: boolean;
  onEdit: (newZiel: string) => void;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const [showRefine, setShowRefine] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editText, setEditText] = useState(unterziel.ziel);
  const [freitext, setFreitext] = useState("");
  const [freitextDirty, setFreitextDirty] = useState(false);
  const erreicht = unterziel.status === "erreicht";
  const anyBusy = busy || busyNextStep;

  const showKlarnamenWarnung = freitextDirty && detectsKlarname(freitext);

  const submitFreitext = () => {
    if (!freitext.trim()) return;
    onRefine("freitext", freitext.trim());
    setFreitext("");
    setFreitextDirty(false);
    setShowRefine(false);
  };

  const submitEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === unterziel.ziel) {
      setShowEdit(false);
      return;
    }
    onEdit(trimmed);
    setShowEdit(false);
  };

  const openEdit = () => {
    setEditText(unterziel.ziel);
    setShowEdit(true);
    setShowRefine(false);
  };

  return (
    <div className="py-3">
      <div className="flex items-start gap-3">
        {/* Export-Auswahl */}
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label="Für Export auswählen"
          className="mt-0.5 h-5 w-5 flex-shrink-0"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm ${erreicht ? "text-gray-500" : "text-gray-800"}`}>
              {erreicht && (
                <span className="mr-1 font-semibold text-green-600" aria-hidden="true">✓</span>
              )}
              {unterziel.ziel}
            </p>
            {(busy || busyNextStep) && (
              <span
                className="mt-0.5 inline-block h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
                aria-label="Wird bearbeitet …"
              />
            )}
          </div>

          {/* Aktionen */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {unterziel.begruendung && (
              <button
                type="button"
                onClick={() => setShowWhy((w) => !w)}
                aria-expanded={showWhy}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {showWhy ? "Warum ▲" : "Warum ▼"}
              </button>
            )}

            {/* Erreicht-Toggle */}
            <button
              type="button"
              disabled={anyBusy}
              onClick={onToggleStatus}
              aria-pressed={erreicht}
              className={`text-xs font-medium transition-colors disabled:opacity-50 ${
                erreicht
                  ? "text-green-700 hover:text-green-900"
                  : "text-gray-400 hover:text-green-700"
              }`}
              title={erreicht ? "Als offen markieren" : "Als erreicht markieren"}
            >
              {erreicht ? "✓ Erreicht" : "○ Offen"}
            </button>

            {!erreicht && (
              <>
                <button
                  type="button"
                  disabled={anyBusy}
                  onClick={() => { setShowRefine((r) => !r); setShowEdit(false); }}
                  aria-expanded={showRefine}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {showRefine ? "Verfeinern ▲" : "Verfeinern ▼"}
                </button>

                <button
                  type="button"
                  disabled={anyBusy}
                  onClick={() => { openEdit(); setShowRefine(false); }}
                  aria-expanded={showEdit}
                  className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  {showEdit ? "Bearbeiten ▲" : "Bearbeiten ▼"}
                </button>
              </>
            )}

            {/* Nächste Stufe – nur bei erreichtem Ziel */}
            {erreicht && (
              <button
                type="button"
                disabled={anyBusy}
                onClick={onNextStep}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {busyNextStep ? (
                  <>
                    <span
                      className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"
                      aria-hidden="true"
                    />
                    Nächste Stufe …
                  </>
                ) : (
                  "→ Nächste Stufe vorschlagen"
                )}
              </button>
            )}
          </div>

          {showWhy && unterziel.begruendung && (
            <p className="mt-1.5 rounded-md bg-gray-50 px-3 py-2 text-xs italic text-gray-500">
              {unterziel.begruendung}
            </p>
          )}

          {/* Manuelles Editieren */}
          {showEdit && !erreicht && (
            <div className="mt-2 space-y-2 rounded-md bg-gray-50 px-3 py-2.5">
              <label className="block text-xs font-medium text-gray-600">
                Zielsatz direkt bearbeiten
              </label>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                disabled={anyBusy}
                className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  disabled={anyBusy || !editText.trim()}
                  onClick={submitEdit}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Speichern
                </button>
              </div>
            </div>
          )}

          {/* KI-Verfeinern */}
          {showRefine && !erreicht && (
            <div className="mt-2 space-y-2 rounded-md bg-gray-50 px-3 py-2.5">
              <div className="flex flex-wrap gap-1.5">
                {PRESET_BUTTONS.map((b) => (
                  <button
                    key={b.modus}
                    type="button"
                    disabled={anyBusy}
                    onClick={() => onRefine(b.modus)}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={freitext}
                  onChange={(e) => {
                    setFreitextDirty(true);
                    setFreitext(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitFreitext();
                  }}
                  disabled={anyBusy}
                  placeholder="Eigene Änderung beschreiben …"
                  aria-describedby={showKlarnamenWarnung ? "freitext-warn" : undefined}
                  className={`min-h-[40px] w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    showKlarnamenWarnung
                      ? "border-amber-400 focus:border-amber-400 focus:ring-amber-100"
                      : "border-gray-300 focus:border-blue-400 focus:ring-blue-100"
                  }`}
                />
                {showKlarnamenWarnung && (
                  <p
                    id="freitext-warn"
                    role="alert"
                    className="rounded-md bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800"
                  >
                    Hinweis: Möglicher Klarname oder Geburtsdatum erkannt – bitte
                    nur anonyme Beschreibungen verwenden.
                  </p>
                )}
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={anyBusy || !freitext.trim()}
                    onClick={submitFreitext}
                    className="min-h-[40px] rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Anwenden
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
