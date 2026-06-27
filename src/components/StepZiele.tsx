"use client";

import { useState } from "react";
import type { Foerderziel, IcfSelection } from "@/lib/types";
import { halbjahreToText } from "@/lib/format";
import { zieleToText } from "@/lib/export";
import GoalCard, { type RefineModus } from "./GoalCard";

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
  const [refiningIndex, setRefiningIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const canGenerate = auswahl.length > 0 && therapieformen.length > 0;

  const basePayload = {
    therapieformen,
    codes: auswahl,
    alterHalbjahre,
    merkmale,
    beobachtung: beobachtung || undefined,
  };

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...basePayload, modus: "neu" }),
      });
      const data = (await res.json()) as { ziele?: Foerderziel[]; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Unbekannter Fehler beim Abrufen der Ziele.");
        return;
      }
      onZieleChange(data.ziele ?? []);
    } catch {
      setError("Netzwerkfehler. Bitte Verbindung prüfen und erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefine(index: number, modus: RefineModus) {
    setRefiningIndex(index);
    setError(null);
    try {
      const res = await fetch("/api/generate-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...basePayload,
          modus,
          bezugsziel: { oberziel: ziele[index].oberziel },
        }),
      });
      const data = (await res.json()) as { ziele?: Foerderziel[]; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Verfeinern fehlgeschlagen.");
        return;
      }
      const neu = data.ziele?.[0];
      if (neu) {
        onZieleChange(ziele.map((z, i) => (i === index ? neu : z)));
      }
    } catch {
      setError("Netzwerkfehler. Bitte Verbindung prüfen und erneut versuchen.");
    } finally {
      setRefiningIndex(null);
    }
  }

  function handleRemove(index: number) {
    onZieleChange(ziele.filter((_, i) => i !== index));
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(zieleToText(ziele));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Kopieren nicht möglich – bitte Text manuell markieren.");
    }
  }

  function handleDownload() {
    const blob = new Blob([zieleToText(ziele)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "foerderziele.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {/* Pre-flight summary */}
      {!canGenerate ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {auswahl.length === 0
            ? "Bitte zunächst in Schritt 3 ICF-Codes auswählen."
            : "Bitte zunächst in Schritt 1 eine Therapieform wählen."}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <span className="font-medium text-gray-800">Bereit zur Zielerstellung:</span>{" "}
          {auswahl.length} Code{auswahl.length !== 1 ? "s" : ""} ausgewählt ·{" "}
          Alter {halbjahreToText(alterHalbjahre)}
        </div>
      )}

      {/* Generate button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={!canGenerate || loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            KI denkt nach …
          </>
        ) : ziele.length > 0 ? (
          "Ziele neu vorschlagen"
        ) : (
          "Ziele vorschlagen"
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>Fehler:</strong> {error}
        </div>
      )}

      {/* Results */}
      {ziele.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {ziele.length} Förderziel{ziele.length !== 1 ? "e" : ""} vorgeschlagen – bitte
            fachlich prüfen und bei Bedarf anpassen.
          </p>
          {ziele.map((z, i) => (
            <GoalCard
              key={i}
              ziel={z}
              busy={refiningIndex === i}
              onRefine={(modus) => handleRefine(i, modus)}
              onRemove={() => handleRemove(i)}
            />
          ))}

          {/* Export */}
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <span className="text-sm font-medium text-gray-700">Export:</span>
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
      )}
    </div>
  );
}
