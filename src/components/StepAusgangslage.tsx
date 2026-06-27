"use client";

import { useState } from "react";
import type { IcfCode, Hauptbereich } from "@/lib/types";

interface Props {
  allCodes: IcfCode[];
  gruppen: Hauptbereich[];
  vorgespraechCodes: string[];
  onChange: (codes: string[]) => void;
}

export default function StepAusgangslage({
  allCodes,
  gruppen,
  vorgespraechCodes,
  onChange,
}: Props) {
  const [search, setSearch] = useState("");

  const codeMap = new Map(allCodes.map((c) => [c.code, c]));

  const toggle = (code: string) => {
    onChange(
      vorgespraechCodes.includes(code)
        ? vorgespraechCodes.filter((c) => c !== code)
        : [...vorgespraechCodes, code],
    );
  };

  const matches = (code: IcfCode) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      code.code.toLowerCase().includes(q) ||
      code.title.toLowerCase().includes(q) ||
      code.keywords.some((k) => k.toLowerCase().includes(q))
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Optional: Welche ICF-CY-Codes wurden im Vorgespräch mit dem Diagnostikteam
        festgelegt? Diese werden als &bdquo;Stand Vorgespräch&ldquo; übernommen.
      </p>

      {/* Selected chips */}
      {vorgespraechCodes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-blue-50 p-3">
          <span className="text-xs font-medium text-blue-600">Stand Vorgespräch:</span>
          {vorgespraechCodes.map((code) => {
            const entry = codeMap.get(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggle(code)}
                className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs text-blue-800 transition-colors hover:bg-blue-200"
              >
                <span className="font-mono">{code}</span>
                {entry && <span className="hidden sm:inline"> – {entry.title}</span>}
                <span className="ml-1 text-blue-400">×</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Codes suchen (z.B. d330, Sprechen, Impulskontrolle) …"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
      />

      {/* Code list grouped by Hauptbereich */}
      <div className="space-y-5">
        {gruppen.map((gruppe) => {
          const visible = gruppe.codes
            .map((c) => codeMap.get(c))
            .filter((c): c is IcfCode => !!c && matches(c));
          if (visible.length === 0) return null;
          return (
            <div key={gruppe.id}>
              <h3 className="mb-2 text-sm font-semibold text-gray-700">{gruppe.label}</h3>
              <div className="space-y-1">
                {visible.map((code) => {
                  const checked = vorgespraechCodes.includes(code.code);
                  return (
                    <label
                      key={code.code}
                      className={[
                        "flex cursor-pointer items-start gap-3 rounded p-2 transition-colors",
                        checked ? "bg-blue-50" : "hover:bg-gray-50",
                      ].join(" ")}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(code.code)}
                        className="mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <span className="font-mono text-sm text-gray-500">{code.code}</span>
                        <span className="ml-2 text-sm text-gray-800">{code.title}</span>
                        <p className="mt-0.5 text-xs text-gray-500">{code.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
