"use client";

interface Props {
  /** Hauptzeile, z.B. „Förderziele werden erstellt …". */
  message: string;
  /** Optionale zweite, kleinere Zeile. */
  hint?: string;
}

/**
 * Vollbild-Overlay mit Lade-Animation. Blockiert die Interaktion, während eine
 * längere KI-Anfrage läuft (z.B. Zielerstellung auf Schritt 5). Bewusst ohne
 * Abbrechen – die Anfrage läuft serverseitig ohnehin weiter.
 */
export default function LoadingOverlay({ message, hint }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={message}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black/40 px-6 text-center backdrop-blur-sm"
    >
      <span
        className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white"
        aria-hidden="true"
      />
      <p className="text-base font-medium text-white">{message}</p>
      {hint && <p className="max-w-xs text-sm text-white/80">{hint}</p>}
    </div>
  );
}
