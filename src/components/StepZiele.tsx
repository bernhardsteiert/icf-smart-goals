"use client";

import { useState, type ReactNode } from "react";
import type { Foerderziel, IcfSelection } from "@/lib/types";
import { halbjahreToText, QUALIFIER_LABELS } from "@/lib/format";
import { zieleToText } from "@/lib/export";
import {
  getCodeByKey,
  getAllTherapieformen,
  getAllMerkmale,
} from "@/lib/icf";
import GoalCard, { type RefineModus } from "./GoalCard";

// Statische Stammdaten (JSON, beim Build gebündelt) – einmalig auf Modulebene.
const THERAPIEFORMEN = getAllTherapieformen();
const MERKMALE = getAllMerkmale();

const QUELLE_LABELS: Record<IcfSelection["quelle"], string> = {
  vorgespraech: "Vorgespräch",
  fachkraft: "Fachkraft",
};

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
        <SelectionSummary
          therapieformen={therapieformen}
          auswahl={auswahl}
          alterHalbjahre={alterHalbjahre}
          merkmale={merkmale}
          beobachtung={beobachtung}
        />
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

// ── Zusammenfassung der getroffenen Auswahl (vor der Zielerstellung) ───────────

function SelectionSummary({
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
    (id) => THERAPIEFORMEN.find((t) => t.id === id)?.label ?? id
  );

  // Nur gesetzte Merkmale (Alter wird separat gezeigt) auflisten.
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
          <span className="whitespace-pre-wrap text-gray-700">{beobachtung.trim()}</span>
        </SummaryRow>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <span className="font-medium text-gray-500">{label}</span>
      <div className="text-gray-800">{children}</div>
    </div>
  );
}
