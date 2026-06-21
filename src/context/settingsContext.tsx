"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Cross-game graphics/performance setting. One quality level shared by every
// table; it maps to the renderer pixel ratio (dpr) — lower = faster, higher =
// sharper. Persisted so it survives reloads.

export type Quality = 'low' | 'medium' | 'high';

// quality -> renderer pixel ratio (perf vs sharpness)
export const QUALITY_DPR: Record<Quality, number> = { low: 1, medium: 1.5, high: 2 };

const STORAGE_KEY = 'cardroyale_quality';

interface SettingsContextType {
  quality: Quality;
  setQuality: (q: Quality) => void;
  /** renderer pixel ratio for the current quality */
  dpr: number;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [quality, setQ] = useState<Quality>('medium');

  // hydrate after mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const q = localStorage.getItem(STORAGE_KEY);
      if (q === 'low' || q === 'medium' || q === 'high') setQ(q);
    } catch {}
  }, []);

  const setQuality = (q: Quality) => {
    setQ(q);
    try { localStorage.setItem(STORAGE_KEY, q); } catch {}
  };

  return (
    <SettingsContext.Provider value={{ quality, setQuality, dpr: QUALITY_DPR[quality] }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
};
