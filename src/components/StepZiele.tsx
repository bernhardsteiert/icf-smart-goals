"use client";

import { useState } from "react";
import type { Foerderziel, IcfSelection } from "@/lib/types";
import type { RefineModus } from "@/lib/ai/provider";
import { zieleToText } from "@/lib/export";
import { requestGoals, requestRefine } from "@/lib/goals-client";
import GoalCard from "./GoalCard";

// Alle Export-Auswahl-Schlüssel (Karten-Index : Unterziel-Index).
function allSelectionKeys(ziele: Foerderziel[]): Set<string> {
  const keys = new Set<string>();
  ziele.forEach((z, zi) =>
    z.unterziele.forEach((_, ui) => keys.add(`${zi}:${ui}`)),
  );
  return keys;
}

// Reduziert die Ziele auf die ausgewählten Unterziele (für den Export).
function filterSelected(
  ziele: Foerderziel[],
  selected: Set<string>,
): Foerderziel[] {
  return ziele
    .map((z, zi) => ({
      ...z,
      unterziele: z.unterziele.filter((_, ui) => selected.has(`${zi}:${ui}`)),
    }))
    .filter((z) => z.unterziele.length > 0);
}

interface Props {
  therapieformen: string[];
  auswahl: IcfSelection[];
  alterHalbjahre: number;
  merkmale: Record<string, unknown>;
  beobachtung: string;
  ziele: Foerderziel[];
  onZieleChange: (ziele: Foerderziel[]) => void;
}

export default function StepZiele({
  therapieformen,
  auswahl,
  alterHalbjahre,
  merkmale,
  beobachtung,
  ziele,
  onZieleChange,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refiningKey, setRefiningKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() =>
    allSelectionKeys(ziele),
  );
  const [exportScope, setExportScope] = useState<"auswahl" | "komplett">("auswahl");

  const codes = auswahl.map((a) => a.code);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const neueZiele = await requestGoals({
        therapieformen,
        codes: auswahl,
        alterHalbjahre,
        merkmale,
        beobachtung: beobachtung || undefined,
      });
      onZieleChange(neueZiele);
      setSelected(allSelectionKeys(neueZiele));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefineUnterziel(
    zi: number,
    ui: number,
    modus: RefineModus,
    freitext?: string,
  ) {
    setRefiningKey(`${zi}:${ui}`);
    setError(null);
    try {
      const neu = await requestRefine({
        oberziel: ziele[zi].oberziel,
        bisherigesZiel: ziele[zi].unterziele[ui].ziel,
        modus,
        freitext,
        alterHalbjahre,
        merkmale,
        beobachtung: beobachtung || undefined,
        codes,
      });
      onZieleChange(
        ziele.map((z, i) =>
          i === zi
            ? { ...z, unterziele: z.unterziele.map((u, j) => (j === ui ? neu : u)) }
            : z,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler.");
    } finally {
      setRefiningKey(null);
    }
  }

  function handleRemove(index: number) {
    const neueZiele = ziele.filter((_, i) => i !== index);
    onZieleChange(neueZiele);
    setSelected(allSelectionKeys(neueZiele));
  }

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function exportText(): string {
    const list = exportScope === "komplett" ? ziele : filterSelected(ziele, selected);
    return zieleToText(list);
  }

  async function handleCopy() {
    const text = exportText();
    if (!text) {
      setError("Bitte mindestens ein Ziel für den Export auswählen.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Kopieren nicht möglich – bitte Text manuell markieren.");
    }
  }

  function handleDownload() {
    const text = exportText();
    if (!text) {
      setError("Bitte mindestens ein Ziel für den Export auswählen.");
      return;
    }
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "foerderziele.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectedCount = selected.size;

  // Leerzustand: normalerweise nicht erreichbar (Generierung läuft auf Schritt 5),
  // aber als Sicherheitsnetz mit eigenem Auslöser.
  if (ziele.length === 0) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
          Noch keine Ziele erstellt.
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              KI denkt nach …
            </>
          ) : (
            "Ziele vorschlagen"
          )}
        </button>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <strong>Fehler:</strong> {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          {ziele.length} Förderziel{ziele.length !== 1 ? "e" : ""} – bitte fachlich
          prüfen und bei Bedarf verfeinern.
        </p>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              KI denkt nach …
            </>
          ) : (
            "Ziele neu vorschlagen"
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>Fehler:</strong> {error}
        </div>
      )}

      {ziele.map((z, i) => (
        <GoalCard
          key={i}
          ziel={z}
          zielIndex={i}
          selected={selected}
          onToggleSelect={toggleSelect}
          onRefineUnterziel={(ui, modus, freitext) =>
            handleRefineUnterziel(i, ui, modus, freitext)
          }
          busyUnterziel={
            refiningKey?.startsWith(`${i}:`)
              ? Number(refiningKey.split(":")[1])
              : null
          }
          onRemove={() => handleRemove(i)}
        />
      ))}

      {/* Export */}
      <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="font-medium text-gray-700">Export-Umfang:</span>
          <label className="flex cursor-pointer items-center gap-1.5 text-gray-700">
            <input
              type="radio"
              name="exportScope"
              checked={exportScope === "auswahl"}
              onChange={() => setExportScope("auswahl")}
              className="h-4 w-4"
            />
            Ausgewählte Ziele ({selectedCount})
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-gray-700">
            <input
              type="radio"
              name="exportScope"
              checked={exportScope === "komplett"}
              onChange={() => setExportScope("komplett")}
              className="h-4 w-4"
            />
            Kompletter Förderplan
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100"
          >
            {copied ? "✓ Kopiert" : "In Zwischenablage kopieren"}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100"
          >
            Als .txt herunterladen
          </button>
          <span className="text-xs text-gray-400">
            (Text – PDF entsteht extern im größeren Dokument)
          </span>
        </div>
      </div>
    </div>
  );
}
