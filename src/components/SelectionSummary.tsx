"use client";

import type { ReactNode } from "react";
import type { IcfSelection } from "@/lib/types";
import { halbjahreToText, QUALIFIER_LABELS } from "@/lib/format";
import { getCodeByKey, getAllTherapieformen, getAllMerkmale } from "@/lib/icf";

const THERAPIEFORMEN = getAllTherapieformen();
const MERKMALE = getAllMerkmale();

const QUELLE_LABELS: Record<IcfSelection["quelle"], string> = {
  vorgespraech: "Vorgespräch",
  fachkraft: "Fachkraft",
};

// Zusammenfassung der getroffenen Auswahl (vor der Zielerstellung).
export default function SelectionSummary({
  therapieformen,
  auswahl,
  alterHalbjahre,
  merkmale,
  beobachtung,
}: {
  therapieformen: string[];
  auswahl: IcfSelection[];
  alterHalbjahre: number;
  merkmale: Record<string, unknown>;
  beobachtung: string;
}) {
  const therapieformLabels = therapieformen.map(
    (id) => THERAPIEFORMEN.find((t) => t.id === id)?.label ?? id,
  );

  const gesetzteMerkmale = MERKMALE.filter((m) => m.id !== "alter")
    .map((m) => {
      const value = merkmale[m.id];
      if (m.typ === "toggle") {
        return Boolean(value) ? { label: m.label, value: "Ja" } : null;
      }
      if (typeof value === "string" && value.trim() !== "") {
        return { label: m.label, value: value.trim() };
      }
      return null;
    })
    .filter((m): m is { label: string; value: string } => m !== null);

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
      <p className="font-medium text-gray-800">Zusammenfassung der Auswahl</p>

      <SummaryRow label="Therapieform(en)">
        {therapieformLabels.join(", ")}
      </SummaryRow>

      <SummaryRow label={`ICF-Codes (${auswahl.length})`}>
        <ul className="space-y-1">
          {auswahl.map((sel) => {
            const code = getCodeByKey(sel.code);
            return (
              <li key={sel.code} className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="font-mono text-gray-800">{sel.code}</span>
                {code && <span className="text-gray-700">{code.title}</span>}
                {sel.qualifier !== undefined && (
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                    Schweregrad {sel.qualifier} · {QUALIFIER_LABELS[sel.qualifier]}
                  </span>
                )}
                <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">
                  {QUELLE_LABELS[sel.quelle]}
                </span>
              </li>
            );
          })}
        </ul>
      </SummaryRow>

      <SummaryRow label="Alter">{halbjahreToText(alterHalbjahre)}</SummaryRow>

      {gesetzteMerkmale.length > 0 && (
        <SummaryRow label="Merkmale">
          <ul className="space-y-1">
            {gesetzteMerkmale.map((m) => (
              <li key={m.label}>
                <span className="text-gray-600">{m.label}:</span>{" "}
                <span className="text-gray-800">{m.value}</span>
              </li>
            ))}
          </ul>
        </SummaryRow>
      )}

      {beobachtung.trim() !== "" && (
        <SummaryRow label="Beobachtung (anonym)">
          <span className="whitespace-pre-wrap text-gray-700">
            {beobachtung.trim()}
          </span>
        </SummaryRow>
      )}
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <span className="font-medium text-gray-500">{label}</span>
      <div className="text-gray-800">{children}</div>
    </div>
  );
}
