"use client";

import { useState } from "react";
import type { Foerderziel } from "@/lib/types";
import type { RefineModus } from "@/lib/ai/provider";

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
  onRemove: () => void;
}

export default function GoalCard({
  ziel,
  zielIndex,
  selected,
  onToggleSelect,
  onRefineUnterziel,
  busyUnterziel,
  onRemove,
}: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900">{ziel.oberziel}</h3>
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
            />
          );
        })}
      </div>

      {/* Karte verwerfen */}
      <div className="flex justify-end border-t border-gray-100 px-5 py-2">
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full px-3 py-1 text-xs text-red-600 transition-colors hover:bg-red-50"
        >
          Ganzes Oberziel verwerfen
        </button>
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
}: {
  unterziel: Foerderziel["unterziele"][number];
  selected: boolean;
  onToggleSelect: () => void;
  onRefine: (modus: RefineModus, freitext?: string) => void;
  busy: boolean;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const [showRefine, setShowRefine] = useState(false);
  const [freitext, setFreitext] = useState("");
  const erreicht = unterziel.status === "erreicht";

  const submitFreitext = () => {
    if (!freitext.trim()) return;
    onRefine("freitext", freitext.trim());
    setFreitext("");
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
            <p className="text-sm text-gray-800">
              {erreicht && <span className="mr-1 text-green-600">✓</span>}
              {unterziel.ziel}
            </p>
            {busy && (
              <span className="mt-0.5 inline-block h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            )}
          </div>

          {/* Aktionen */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {unterziel.begruendung && (
              <button
                type="button"
                onClick={() => setShowWhy((w) => !w)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {showWhy ? "Warum ▲" : "Warum ▼"}
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowRefine((r) => !r)}
              className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {showRefine ? "Verfeinern ▲" : "Verfeinern ▼"}
            </button>
          </div>

          {showWhy && unterziel.begruendung && (
            <p className="mt-1.5 rounded-md bg-gray-50 px-3 py-2 text-xs italic text-gray-500">
              {unterziel.begruendung}
            </p>
          )}

          {showRefine && (
            <div className="mt-2 space-y-2 rounded-md bg-gray-50 px-3 py-2.5">
              <div className="flex flex-wrap gap-1.5">
                {PRESET_BUTTONS.map((b) => (
                  <button
                    key={b.modus}
                    type="button"
                    disabled={busy}
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
                  onChange={(e) => setFreitext(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitFreitext();
                  }}
                  disabled={busy}
                  placeholder="Eigene Änderung beschreiben …"
                  className="min-h-[40px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={busy || !freitext.trim()}
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
