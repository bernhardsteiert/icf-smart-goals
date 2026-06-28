"use client";

import { useState } from "react";
import type { Merkmal } from "@/lib/types";
import { detectsKlarname } from "@/lib/privacy";

interface Props {
  alterHalbjahre: number;
  merkmale: Record<string, unknown>;
  alleMerkmale: Merkmal[];
  beobachtung: string;
  onAlterChange: (value: number) => void;
  onMerkmaleChange: (key: string, value: unknown) => void;
  onBeobachtungChange: (value: string) => void;
}

function alterLabel(halbjahre: number): string {
  if (halbjahre === 0) return "Jünger als 6 Monate";
  const years = Math.floor(halbjahre / 2);
  const hasHalf = halbjahre % 2 === 1;
  if (years === 0) return "6 Monate";
  if (!hasHalf) return `${years} Jahr${years !== 1 ? "e" : ""}`;
  return `${years} Jahr${years !== 1 ? "e" : ""} 6 Monate`;
}

export default function StepMerkmale({
  alterHalbjahre,
  merkmale,
  alleMerkmale,
  beobachtung,
  onAlterChange,
  onMerkmaleChange,
  onBeobachtungChange,
}: Props) {
  const [beobachtungDirty, setBeobachtungDirty] = useState(false);
  const otherMerkmale = alleMerkmale.filter((m) => m.id !== "alter");
  const showKlarnamenWarnung = beobachtungDirty && detectsKlarname(beobachtung);

  return (
    <div className="space-y-6">
      {/* Alter */}
      <div>
        <label htmlFor="alter-select" className="mb-1 block text-sm font-medium text-gray-700">
          Alter des Kindes
        </label>
        <select
          id="alter-select"
          value={alterHalbjahre}
          onChange={(e) => onAlterChange(Number(e.target.value))}
          className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          {Array.from({ length: 15 }, (_, i) => (
            <option key={i} value={i}>
              {alterLabel(i)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Halbjahrschritte · nicht identifizierend
        </p>
      </div>

      {/* Other merkmale */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">
          Weitere Merkmale{" "}
          <span className="font-normal text-gray-400">(nicht identifizierend, optional)</span>
        </h3>
        {otherMerkmale.map((m) => (
          <MerkmalInput
            key={m.id}
            merkmal={m}
            value={merkmale[m.id]}
            onChange={(v) => onMerkmaleChange(m.id, v)}
          />
        ))}
      </div>

      {/* Freie Beobachtungen (anonym) */}
      <div>
        <label htmlFor="beobachtung-textarea" className="mb-1 block text-sm font-medium text-gray-700">
          Weitere Beobachtungen{" "}
          <span className="font-normal text-gray-400">(anonym, optional)</span>
        </label>
        <textarea
          id="beobachtung-textarea"
          value={beobachtung}
          onChange={(e) => {
            setBeobachtungDirty(true);
            onBeobachtungChange(e.target.value);
          }}
          rows={3}
          placeholder="Stichworte zum Kind, die für die Ziele hilfreich sind (z.B. 'spielt gern draußen, wird bei Wechseln schnell unruhig') …"
          aria-describedby="beobachtung-hint"
          className={`w-full resize-y rounded-lg border px-3 py-2.5 text-base focus:outline-none focus:ring-2 ${
            showKlarnamenWarnung
              ? "border-amber-400 focus:border-amber-400 focus:ring-amber-100"
              : "border-gray-300 focus:border-blue-400 focus:ring-blue-100"
          }`}
        />
        {showKlarnamenWarnung ? (
          <p
            id="beobachtung-hint"
            role="alert"
            className="mt-1 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800"
          >
            Hinweis: Möglicher Klarname oder Geburtsdatum erkannt – bitte nur
            anonyme Stichworte verwenden (z.B. &bdquo;das Kind&ldquo; statt echtem Namen).
          </p>
        ) : (
          <p id="beobachtung-hint" className="mt-1 text-xs text-gray-500">
            Bitte keine echten Namen, Geburtsdaten oder Einrichtungen – nur
            &bdquo;das Kind&ldquo;. Fließt anonym in die Zielerstellung ein.
          </p>
        )}
      </div>
    </div>
  );
}

function MerkmalInput({
  merkmal,
  value,
  onChange,
}: {
  merkmal: Merkmal;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (merkmal.typ === "toggle") {
    return (
      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-5 w-5"
        />
        <span className="text-sm text-gray-700">{merkmal.label}</span>
      </label>
    );
  }

  if (merkmal.typ === "kurztext") {
    return (
      <div>
        <label className="mb-1 block text-sm text-gray-700">{merkmal.label}</label>
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Stichwort (kein Klarname) …"
          className="min-h-[44px] w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
      </div>
    );
  }

  return null;
}
