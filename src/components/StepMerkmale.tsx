"use client";

import type { Merkmal } from "@/lib/types";

interface Props {
  alterHalbjahre: number;
  merkmale: Record<string, unknown>;
  alleMerkmale: Merkmal[];
  onAlterChange: (value: number) => void;
  onMerkmaleChange: (key: string, value: unknown) => void;
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
  onAlterChange,
  onMerkmaleChange,
}: Props) {
  // "alter" is handled by the dedicated dropdown; skip it in the loop
  const otherMerkmale = alleMerkmale.filter((m) => m.id !== "alter");

  return (
    <div className="space-y-6">
      {/* Alter */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Alter des Kindes
        </label>
        <select
          value={alterHalbjahre}
          onChange={(e) => onAlterChange(Number(e.target.value))}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
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
          Weitere Merkmale <span className="font-normal text-gray-400">(nicht identifizierend, optional)</span>
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
          className="h-4 w-4"
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
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
      </div>
    );
  }

  return null;
}
