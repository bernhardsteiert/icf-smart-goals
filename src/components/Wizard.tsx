"use client";

import { useState } from "react";
import { useFallState } from "@/lib/store";
import {
  getAllTherapieformen,
  getAllCodes,
  getHauptbereicheForTherapieform,
  getAllMerkmale,
} from "@/lib/icf";
import DisclaimerBanner from "./DisclaimerBanner";
import StepTherapieform from "./StepTherapieform";
import StepAusgangslage from "./StepAusgangslage";
import StepCodes from "./StepCodes";
import StepMerkmale from "./StepMerkmale";

const STEP_LABELS = [
  "Therapieform",
  "Ausgangslage",
  "ICF-Codes",
  "Alter & Merkmale",
  "Ziele",
];
const TOTAL_STEPS = STEP_LABELS.length;

// Static data – loaded once at module level (JSON bundled at build time)
const THERAPIEFORMEN = getAllTherapieformen();
const ALL_CODES = getAllCodes();
const ALL_MERKMALE = getAllMerkmale();

export default function Wizard() {
  const { state, update, updateMerkmale, resetFall, hydrated } = useFallState();
  const [step, setStep] = useState(1);

  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        Laden …
      </div>
    );
  }

  const activeTherapieformId = state.therapieformen[0] ?? "heilpaedagogik";
  const gruppen = getHauptbereicheForTherapieform(activeTherapieformId);

  const canAdvance = step === 1 ? state.therapieformen.length > 0 : step < TOTAL_STEPS;

  const handleReset = () => {
    if (window.confirm("Aktuellen Fall verwerfen und neu beginnen?")) {
      resetFall();
      setStep(1);
    }
  };

  // When entering step 3 for the first time, pre-populate auswahl from Vorgespräch-Codes
  const goNext = () => {
    const next = step + 1;
    if (next === 3 && state.auswahl.length === 0 && state.vorgespraechCodes.length > 0) {
      update("auswahl", state.vorgespraechCodes.map((code) => ({
        code,
        quelle: "vorgespraech" as const,
      })));
    }
    setStep(next);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="bg-blue-700 px-6 py-4 text-white shadow">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">ICF SMART Goals</h1>
            <p className="mt-0.5 text-sm text-blue-200">
              Heilpädagogische Frühförderung
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded border border-blue-500 px-3 py-1 text-sm text-blue-200 transition-colors hover:border-blue-300 hover:text-white"
          >
            Neuer Fall
          </button>
        </div>
      </header>

      {/* Progress indicator */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <StepIndicator current={step} labels={STEP_LABELS} />
        </div>
      </div>

      {/* Step content */}
      <main className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-5">
          <DisclaimerBanner />

          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Schritt {step}: {STEP_LABELS[step - 1]}
            </h2>

            {step === 1 && (
              <StepTherapieform
                therapieformen={THERAPIEFORMEN}
                selected={state.therapieformen}
                onChange={(ids) => update("therapieformen", ids)}
              />
            )}

            {step === 2 && (
              <StepAusgangslage
                allCodes={ALL_CODES}
                gruppen={gruppen}
                vorgespraechCodes={state.vorgespraechCodes}
                onChange={(codes) => update("vorgespraechCodes", codes)}
              />
            )}

            {step === 3 && (
              <StepCodes
                gruppen={gruppen}
                allCodes={ALL_CODES}
                auswahl={state.auswahl}
                vorgespraechCodes={state.vorgespraechCodes}
                onChange={(auswahl) => update("auswahl", auswahl)}
              />
            )}

            {step === 4 && (
              <StepMerkmale
                alterHalbjahre={state.alterHalbjahre}
                merkmale={state.merkmale}
                alleMerkmale={ALL_MERKMALE}
                onAlterChange={(v) => update("alterHalbjahre", v)}
                onMerkmaleChange={updateMerkmale}
              />
            )}

            {step === 5 && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">
                <p className="font-medium">Förderziele</p>
                <p className="mt-1 text-sm">Wird in Meilenstein M4 / M5 implementiert.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Navigation */}
      <footer className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Zurück
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!canAdvance}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {step === TOTAL_STEPS ? "Abschluss" : "Weiter →"}
          </button>
        </div>
      </footer>
    </div>
  );
}

function StepIndicator({
  current,
  labels,
}: {
  current: number;
  labels: string[];
}) {
  return (
    <div className="flex items-start">
      {labels.map((label, i) => {
        const num = i + 1;
        const done = num < current;
        const active = num === current;
        return (
          <div key={num} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {/* Left connector */}
              {i > 0 && (
                <div
                  className={`h-px flex-1 ${done || active ? "bg-blue-400" : "bg-gray-200"}`}
                />
              )}
              {/* Circle */}
              <div
                className={[
                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done
                    ? "bg-blue-600 text-white"
                    : active
                    ? "bg-blue-600 text-white ring-4 ring-blue-100"
                    : "border border-gray-300 bg-white text-gray-400",
                ].join(" ")}
              >
                {done ? "✓" : num}
              </div>
              {/* Right connector */}
              {i < labels.length - 1 && (
                <div
                  className={`h-px flex-1 ${done ? "bg-blue-400" : "bg-gray-200"}`}
                />
              )}
            </div>
            {/* Label */}
            <span
              className={[
                "mt-1 hidden text-center text-xs sm:block",
                active
                  ? "font-medium text-blue-700"
                  : done
                  ? "text-gray-500"
                  : "text-gray-400",
              ].join(" ")}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
