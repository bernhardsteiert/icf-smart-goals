"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface Props {
  /** Wird vom Aktions-Button ausgelöst (neuer Fall). */
  onReset: () => void;
}

const clamp = (v: number, lo = 0, hi = 1) => Math.min(Math.max(v, lo), hi);

// Scrollstrecke (px), über die der Header von „groß" auf „kompakt" zusammenfährt.
const COLLAPSE = 72;

// Zusätzlicher Scrollraum (px), den eine Seite über COLLAPSE hinaus bieten muss,
// damit die Kollaps-Animation überhaupt freigeschaltet wird. Muss GRÖSSER sein als
// die Höhe, um die der Header beim Kollabieren schrumpft (Untertitel + Titel-
// Verkleinerung ≈ 30 px). Bildet zusammen mit COLLAPSE eine Hysterese, die das
// Zucken auf kurzen Seiten verhindert (siehe useEffect unten).
const COLLAPSE_ENABLE_MARGIN = 48;

/**
 * iOS-„Large Title"-Navigationsleiste: Derselbe „Förderkompass"-Titel schrumpft
 * beim Scrollen von groß auf klein (keine leere Leiste über dem großen Titel).
 * Der Aktions-Button zeigt in der großen Ansicht den Text „Neuer Fall" und
 * blendet beim Kollabieren zu einem reinen „+"-Button über. Untertitel fährt weg.
 */
export default function CollapsingHeader({ onReset }: Props) {
  const [scrollY, setScrollY] = useState(0);
  const [subHeight, setSubHeight] = useState(20);
  const subRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    let raf = 0;
    // Latch (in der Effekt-Closure, KEIN State → kein Re-Render): ist die Kollaps-
    // Animation gerade aktiv? Hintergrund: Der Header ist sticky und schrumpft beim
    // Kollabieren, wodurch sich das Dokument verkürzt und `max` sinkt. Auf kurzen
    // Seiten koppelt das die Scrollposition an den Header-Zustand zurück → Zucken,
    // verstärkt durch iOS-Rubber-Band-Bounce.
    //
    // Eine einfache Schwelle (`if (max < COLLAPSE) p = 0`) genügt NICHT: Für Seiten,
    // deren `max` knapp über COLLAPSE liegt, kippt das Schrumpfen des Headers `max`
    // wieder unter die Schwelle → der Header expandiert → `max` steigt → kollabiert …
    // (60-fps-Oszillation). Deshalb Hysterese mit zwei Schwellen:
    //   einschalten erst bei  max ≥ COLLAPSE + MARGIN  (expandiert reichlich Raum),
    //   ausschalten erst bei   max < COLLAPSE.
    // Weil MARGIN größer ist als die Header-Schrumpfung, kann das Kollabieren `max`
    // nie unter die Ausschalt-Schwelle drücken — der Flip ist unmöglich.
    let collapseEnabled = false;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        if (collapseEnabled) {
          if (max < COLLAPSE) collapseEnabled = false;
        } else if (max >= COLLAPSE + COLLAPSE_ENABLE_MARGIN) {
          collapseEnabled = true;
        }
        // Ist die Seite zu kurz für einen vollen Kollaps, bleibt der Header groß –
        // kein Bounce kann ihn dann bewegen. Sonst auf [0, max] clampen, damit der
        // Rubber-Band-Bounce am oberen/unteren Rand die Animation nicht auslöst.
        setScrollY(collapseEnabled ? Math.min(Math.max(window.scrollY, 0), max) : 0);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Natürliche Höhe des Untertitels messen (für sauberes Wegfahren).
  useLayoutEffect(() => {
    const measure = () => {
      if (subRef.current) setSubHeight(subRef.current.offsetHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const p = clamp(scrollY / COLLAPSE);
  const titleFontRem = 1.5 - 0.5 * p; // text-2xl (1.5rem) → text-base (1rem)
  const subOpacity = clamp(1 - p * 1.5);
  const textOpacity = clamp(1 - p * 1.9); // „Neuer Fall"-Text
  const iconOpacity = clamp((p - 0.35) / 0.65); // „+"-Icon

  return (
    <header
      className="sticky top-0 z-30 bg-blue-700 text-white"
      style={{
        paddingTop: "max(0.5rem, env(safe-area-inset-top))",
        paddingBottom: "0.5rem",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
        boxShadow: p > 0.5 ? "0 1px 4px rgba(0,0,0,0.18)" : "none",
        transition: "box-shadow 150ms ease",
      }}
    >
      <div className="mx-auto max-w-2xl">
        {/* Titelzeile: großer Titel links, Aktion rechts – direkt am oberen Rand,
            keine leere Leiste darüber. */}
        <div className="flex min-h-9 items-center justify-between gap-3">
          <h1
            className="font-bold leading-tight"
            style={{ fontSize: `${titleFontRem}rem` }}
          >
            Förderkompass
          </h1>

          {/* Aktions-Button: Text „Neuer Fall" ↔ „+" (überblendet) */}
          <button
            type="button"
            onClick={onReset}
            aria-label="Neuer Fall (aktuellen Fall verwerfen)"
            title="Neuer Fall"
            className="relative flex h-9 flex-shrink-0 items-center justify-end"
          >
            <span
              className="whitespace-nowrap rounded-lg border border-blue-400/70 px-3 py-1.5 text-sm transition-colors"
              style={{
                opacity: textOpacity,
                visibility: textOpacity <= 0.01 ? "hidden" : "visible",
              }}
            >
              Neuer Fall
            </span>
            <span
              className="absolute right-0 flex h-9 w-9 items-center justify-center rounded-full border border-blue-400/60"
              style={{
                opacity: iconOpacity,
                visibility: iconOpacity <= 0.01 ? "hidden" : "visible",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.1}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Refresh / „neu anfangen" – Kreis-Pfeil */}
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
            </span>
          </button>
        </div>

        {/* Untertitel: fährt beim Scrollen weg */}
        <div
          className="overflow-hidden"
          style={{ height: subHeight * (1 - p), opacity: subOpacity }}
          aria-hidden={p > 0.9}
        >
          <p ref={subRef} className="pt-0.5 text-sm text-blue-200">
            ICF-CY-basierte SMART-Förderziele für die Frühförderung
          </p>
        </div>
      </div>
    </header>
  );
}
