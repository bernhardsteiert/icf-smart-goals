"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface Props {
  /** Wird vom „+"-Button ausgelöst (neuer Fall). */
  onReset: () => void;
}

/**
 * iOS-„Large Title"-Navigationsleiste: Beim Scrollen nach unten kollabiert der
 * große Titel + Untertitel in eine kompakte Leiste, in der nur der kleine
 * „Förderkompass"-Schriftzug und der „+"-Button stehen bleiben. Der Kollaps ist
 * direkt an die Scrollposition gekoppelt (kein Snap), wie bei nativen iOS-Apps.
 */
export default function CollapsingHeader({ onReset }: Props) {
  const [scrollY, setScrollY] = useState(0);
  const [maxHeight, setMaxHeight] = useState(64);
  const largeRef = useRef<HTMLDivElement>(null);

  // Scrollposition (gedrosselt via requestAnimationFrame) verfolgen.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrollY(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Natürliche Höhe des großen Titelblocks messen (für sauberes Kollabieren,
  // auch wenn der Untertitel auf schmalen Geräten umbricht).
  useLayoutEffect(() => {
    const measure = () => {
      if (largeRef.current) setMaxHeight(largeRef.current.offsetHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Kollaps-Fortschritt 0 (offen) … 1 (kompakt).
  const p = Math.min(Math.max(scrollY / Math.max(maxHeight, 1), 0), 1);
  const largeOpacity = Math.max(1 - p * 1.6, 0);
  const smallOpacity = Math.max((p - 0.45) / 0.55, 0);

  return (
    <header
      className="sticky top-0 z-30 bg-blue-700 text-white"
      style={{
        paddingTop: "max(0.5rem, env(safe-area-inset-top))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
        boxShadow: p > 0.5 ? "0 1px 4px rgba(0,0,0,0.18)" : "none",
        transition: "box-shadow 150ms ease",
      }}
    >
      <div className="mx-auto max-w-2xl">
        {/* Kompaktleiste – bleibt immer sichtbar */}
        <div className="flex h-11 items-center justify-between gap-3">
          <span
            className="text-base font-semibold"
            style={{
              opacity: smallOpacity,
              transform: `translateY(${(1 - smallOpacity) * 6}px)`,
            }}
          >
            Förderkompass
          </span>
          <button
            type="button"
            onClick={onReset}
            aria-label="Neuer Fall (aktuellen Fall verwerfen)"
            title="Neuer Fall"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-blue-400/60 text-white transition-colors hover:bg-blue-600 active:bg-blue-800"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        {/* Großer Titel – kollabiert beim Scrollen */}
        <div
          className="overflow-hidden"
          style={{ height: maxHeight * (1 - p), opacity: largeOpacity }}
          aria-hidden={p > 0.9}
        >
          <div ref={largeRef} className="pb-3">
            <h1 className="text-2xl font-bold leading-tight">Förderkompass</h1>
            <p className="mt-0.5 text-sm text-blue-200">
              ICF-CY-basierte SMART-Förderziele für die Frühförderung
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
