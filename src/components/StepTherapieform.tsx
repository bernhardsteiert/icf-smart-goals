"use client";

import type { Therapieform } from "@/lib/types";

interface Props {
  therapieformen: Therapieform[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function StepTherapieform({ therapieformen, selected, onChange }: Props) {
  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Wählen Sie die Therapieform(en) für diesen Fall. Im MVP ist Heilpädagogik
        verfügbar; weitere Formen folgen in späteren Versionen.
      </p>
      <div className="space-y-2">
        {therapieformen.map((tf) => {
          const isSelected = selected.includes(tf.id);
          return (
            <button
              key={tf.id}
              type="button"
              disabled={!tf.aktiv}
              onClick={() => tf.aktiv && toggle(tf.id)}
              className={[
                "w-full text-left rounded-lg border px-4 py-3 transition-colors",
                !tf.aktiv
                  ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                  : isSelected
                  ? "border-blue-600 bg-blue-50 text-blue-900"
                  : "border-gray-200 bg-white text-gray-800 hover:border-blue-300 hover:bg-blue-50/50 active:bg-blue-50",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border text-xs",
                    isSelected
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300",
                  ].join(" ")}
                >
                  {isSelected && "✓"}
                </span>
                <div>
                  <div className="font-medium">{tf.label}</div>
                  <div className="mt-0.5 text-xs">
                    {tf.aktiv ? (
                      <span className="text-gray-500">{tf.hinweis}</span>
                    ) : (
                      <span className="text-gray-400">Verfügbar in späteren Versionen</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
