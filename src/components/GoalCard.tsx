"use client";

import { useState } from "react";
import type { Foerderziel } from "@/lib/types";

interface Props {
  ziel: Foerderziel;
}

export default function GoalCard({ ziel }: Props) {
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
        <p className="mt-1 text-xs text-gray-500">
          Zeithorizont: {ziel.zeithorizont}
        </p>
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
      <div className="divide-y divide-gray-50 px-5 py-3">
        {ziel.unterziele.map((uz, i) => (
          <UnterzielRow key={i} unterziel={uz} />
        ))}
      </div>
    </div>
  );
}

function UnterzielRow({
  unterziel,
}: {
  unterziel: Foerderziel["unterziele"][number];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-800">{unterziel.ziel}</p>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-800"
        >
          {expanded ? "SMART ▲" : "SMART ▼"}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 rounded-md bg-gray-50 px-3 py-2 text-xs space-y-1.5">
          <SmartRow label="Spezifisch" value={unterziel.smart.spezifisch} />
          <SmartRow label="Messbar" value={unterziel.smart.messbar} />
          <SmartRow label="Erreichbar" value={unterziel.smart.erreichbar} />
          <SmartRow label="Relevant" value={unterziel.smart.relevant} />
          <SmartRow label="Terminiert" value={unterziel.smart.terminiert} />
          {unterziel.begruendung && (
            <p className="mt-1.5 border-t border-gray-200 pt-1.5 italic text-gray-500">
              {unterziel.begruendung}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SmartRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-20 flex-shrink-0 font-medium text-gray-500">{label}:</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}
