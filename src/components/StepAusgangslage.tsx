"use client";

import type { IcfCode, Hauptbereich } from "@/lib/types";
import CodeCatalog from "./CodeCatalog";

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
  const codeMap = new Map(allCodes.map((c) => [c.code, c]));

  const toggle = (code: string) => {
    onChange(
      vorgespraechCodes.includes(code)
        ? vorgespraechCodes.filter((c) => c !== code)
        : [...vorgespraechCodes, code],
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Optional: Welche ICF-CY-Codes wurden im Vorgespräch mit dem Diagnostikteam
        festgelegt? Diese werden als &bdquo;Stand Vorgespräch&ldquo; übernommen.
      </p>

      {/* Ausgewählte Codes als Chips */}
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

      <CodeCatalog
        gruppen={gruppen}
        allCodes={allCodes}
        selectedCodes={vorgespraechCodes}
        onToggle={toggle}
      />
    </div>
  );
}
