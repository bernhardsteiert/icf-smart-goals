"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "icf-bereiche-custom";

/**
 * Eigene, von der Fachkraft ergänzte Bereiche – global (nicht pro Fall) in
 * localStorage gehalten, damit sie fallübergreifend im Dropdown auswählbar sind.
 */
export function useCustomBereiche() {
  const [custom, setCustom] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setCustom(JSON.parse(raw) as string[]);
    } catch {
      // localStorage nicht verfügbar oder beschädigt
    }
  }, []);

  const add = useCallback((name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    setCustom((prev) => {
      if (prev.includes(trimmed)) return prev;
      const next = [...prev, trimmed];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage voll – Auswahl funktioniert trotzdem für diese Sitzung
      }
      return next;
    });
    return trimmed;
  }, []);

  return { custom, add };
}
