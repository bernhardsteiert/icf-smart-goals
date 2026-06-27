"use client";

import { useState, useEffect, useCallback } from "react";
import type { FallState } from "./types";

const STORAGE_KEY = "icf-smart-goals-fall";

export const INITIAL_FALL_STATE: FallState = {
  therapieformen: [],
  vorgespraechCodes: [],
  auswahl: [],
  alterHalbjahre: 4,
  merkmale: {},
  beobachtung: "",
  ziele: [],
};

export function useFallState() {
  const [state, setStateRaw] = useState<FallState>(INITIAL_FALL_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStateRaw(JSON.parse(raw) as FallState);
    } catch {
      // localStorage not available or corrupted
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage full
    }
  }, [state, hydrated]);

  const update = useCallback(<K extends keyof FallState>(key: K, value: FallState[K]) => {
    setStateRaw((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateMerkmale = useCallback((key: string, value: unknown) => {
    setStateRaw((prev) => ({
      ...prev,
      merkmale: { ...prev.merkmale, [key]: value },
    }));
  }, []);

  const resetFall = useCallback(() => {
    setStateRaw(INITIAL_FALL_STATE);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  return { state, update, updateMerkmale, resetFall, hydrated };
}
