"use client";

import { useState } from "react";
import type { IcfCode, IcfSelection, Hauptbereich } from "@/lib/types";

const QUALIFIER_LABELS: Record<number, string> = {
  0: "Kein",
  1: "Leicht",
  2: "Mäßig",
  3: "Erheblich",
  4: "Vollständig",
};

interface Props {
  gruppe: Hauptbereich;
  codes: IcfCode[];
  auswahl: IcfSelection[];
  vorgespraechCodes: string[];
  onToggle: (code: string) => void;
  onQualifier: (code: string, qualifier: 0 | 1 | 2 | 3 | 4 | undefined) => void;
}

export default function CodeGroup({
  gruppe,
  codes,
  auswahl,
  vorgespraechCodes,
  onToggle,
  onQualifier,
}: Props) {
  const [open, setOpen] = useState(true);

  const selectedCount = codes.filter((c) =>
    auswahl.some((a) => a.code === c.code),
  ).length;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      {/* Group header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left hover:bg-gray-100 transition-colors"
      >
        <span className="font-medium text-gray-800">{gruppe.label}</span>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {selectedCount} / {codes.length}
            </span>
          )}
          <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Code list */}
      {open && (
        <div className="divide-y divide-gray-100">
          {codes.map((code) => {
            const selection = auswahl.find((a) => a.code === code.code);
            const isSelected = Boolean(selection);
            const isFromVorgespraech = vorgespraechCodes.includes(code.code);

            return (
              <div
                key={code.code}
                className={isSelected ? "bg-blue-50" : "bg-white"}
              >
                {/* Code row */}
                <label className="flex cursor-pointer items-start gap-3 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(code.code)}
                    className="mt-0.5 h-5 w-5 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-gray-500">
                        {code.code}
                      </span>
                      <span className="text-sm text-gray-800">{code.title}</span>
                      {isFromVorgespraech && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                          Vorgespräch
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {code.description}
                    </p>
                  </div>
                </label>

                {/* Qualifier row (only when selected) */}
                {isSelected && (
                  <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3 pl-10">
                    <span className="text-xs text-gray-500">Schweregrad:</span>
                    {([0, 1, 2, 3, 4] as const).map((q) => {
                      const active = selection?.qualifier === q;
                      return (
                        <button
                          key={q}
                          type="button"
                          onClick={() =>
                            onQualifier(code.code, active ? undefined : q)
                          }
                          className={[
                            "rounded border px-2 py-0.5 text-xs transition-colors",
                            active
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600",
                          ].join(" ")}
                          title={`${q} – ${QUALIFIER_LABELS[q]}`}
                        >
                          {q} {QUALIFIER_LABELS[q]}
                        </button>
                      );
                    })}
                    {selection?.qualifier !== undefined && (
                      <button
                        type="button"
                        onClick={() => onQualifier(code.code, undefined)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                        title="Schweregrad entfernen"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
