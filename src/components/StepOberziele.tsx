"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { Oberziel } from "@/lib/types";
import { getAllBereiche } from "@/lib/icf";
import { useCustomBereiche } from "@/lib/bereiche";

const CURATED_BEREICHE = getAllBereiche();
const CUSTOM_SENTINEL = "__custom__";

interface Props {
  oberziele: Oberziel[];
  onChange: (oberziele: Oberziel[]) => void;
  onRegenerate: () => void;
  regenerating: boolean;
  error: string | null;
}

/**
 * Textarea, die automatisch mit ihrem Inhalt mitwächst – damit lange Oberziele
 * vollständig (umgebrochen) lesbar bleiben, statt in einer Zeile abzuschneiden.
 */
function AutoTextarea({
  value,
  onChange,
  className,
  ...rest
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> & {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full resize-none overflow-hidden ${className ?? ""}`}
      {...rest}
    />
  );
}

/**
 * Schritt 6: Die KI hat nur die Förderrichtungen (Oberziele) vorgeschlagen. Die
 * Fachkraft prüft sie hier, ändert Titel/Bereich, ergänzt eigene oder löscht
 * welche. Erst mit „Weiter" (in der Wizard-Navigation) werden daraus die
 * SMART-Unterziele erzeugt.
 */
export default function StepOberziele({
  oberziele,
  onChange,
  onRegenerate,
  regenerating,
  error,
}: Props) {
  const { custom, add: addCustomBereich } = useCustomBereiche();
  // Welche Karte gerade ein Eingabefeld für einen eigenen Bereich zeigt.
  const [customFor, setCustomFor] = useState<number | null>(null);
  const [customText, setCustomText] = useState("");

  const patch = (i: number, p: Partial<Oberziel>) =>
    onChange(oberziele.map((o, idx) => (idx === i ? { ...o, ...p } : o)));
  const remove = (i: number) =>
    onChange(oberziele.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([...oberziele, { oberziel: "", bereich: "", abgeleitetAus: [] }]);

  // Optionen je Karte: kuratierte + eigene Bereiche; ein unbekannter (z.B. von der
  // KI frei formulierter) Wert bleibt erhalten und wird vorangestellt.
  const optionsFor = (value: string): string[] => {
    const list = [...CURATED_BEREICHE, ...custom];
    if (value && !list.includes(value)) list.unshift(value);
    return list;
  };

  const onSelectBereich = (i: number, value: string) => {
    if (value === CUSTOM_SENTINEL) {
      setCustomFor(i);
      setCustomText("");
    } else {
      patch(i, { bereich: value });
      if (customFor === i) setCustomFor(null);
    }
  };

  const submitCustom = (i: number) => {
    const added = addCustomBereich(customText);
    if (added) patch(i, { bereich: added });
    setCustomFor(null);
    setCustomText("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="max-w-md text-sm text-gray-500">
          Förderrichtungen (Entwurf). Bitte prüfen, anpassen, ergänzen oder löschen –
          erst danach werden mit „Weiter“ die SMART-Ziele erzeugt.
        </p>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={regenerating}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {regenerating ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              KI denkt nach …
            </>
          ) : (
            "Neu vorschlagen"
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>Fehler:</strong> {error}
        </div>
      )}

      {oberziele.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          Keine Oberziele vorhanden. Füge eines hinzu oder lass neue vorschlagen.
        </div>
      ) : (
        <ul className="space-y-3">
          {oberziele.map((o, i) => (
            <li
              key={i}
              className="space-y-2 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
            >
              {/* Kopfzeile: Nummer + Löschen – die Felder darunter über volle Breite */}
              <div className="flex items-center justify-between">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Oberziel ${i + 1} löschen`}
                  title="Oberziel löschen"
                  className="-mr-1 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
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

              <AutoTextarea
                value={o.oberziel}
                onChange={(v) => patch(i, { oberziel: v })}
                placeholder="Förderrichtung (Oberziel)"
                aria-label={`Oberziel ${i + 1}`}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium leading-snug text-gray-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />

              <div className="space-y-1">
                <label className="block text-xs text-gray-400">Bereich</label>
                <select
                  value={customFor === i ? CUSTOM_SENTINEL : o.bereich}
                  onChange={(e) => onSelectBereich(i, e.target.value)}
                  aria-label={`Bereich von Oberziel ${i + 1}`}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Bereich wählen …</option>
                  {optionsFor(o.bereich).map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value={CUSTOM_SENTINEL}>+ Eigener Bereich …</option>
                </select>

                {customFor === i && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          submitCustom(i);
                        }
                      }}
                      autoFocus
                      placeholder="Neuen Bereich eingeben"
                      aria-label="Neuen Bereich eingeben"
                      className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => submitCustom(i)}
                      disabled={!customText.trim()}
                      className="flex-shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Übernehmen
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomFor(null)}
                      className="flex-shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      Abbrechen
                    </button>
                  </div>
                )}
              </div>

              {o.abgeleitetAus.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  <span className="text-xs text-gray-400">Abgeleitet aus:</span>
                  {o.abgeleitetAus.map((code) => (
                    <span
                      key={code}
                      className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-600"
                    >
                      {code}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={add}
        className="w-full rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
      >
        + Eigenes Oberziel hinzufügen
      </button>
    </div>
  );
}
