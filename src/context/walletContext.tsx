"use client";
import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';

// Single casino bankroll shared by EVERY game (Hokm, Blackjack, Hold'em). The
// player buys in once; chips won/lost at any table move this one balance. When
// it hits zero they spin the wheel for a top-up. Persisted so it survives reloads.

const STORAGE_KEY = 'casino_chips';
const START_CHIPS = 10000;

// Prizes on the chance wheel (in chips). Order = clockwise segment order.
export const WHEEL_PRIZES = [500, 2000, 1000, 5000, 750, 3000, 1500, 2500];

interface WalletContextType {
  /** Current chip balance (the player's whole-casino bankroll). */
  balance: number;
  /** True when the player is out of chips and must spin to continue. */
  broke: boolean;
  /** Try to stake `amt` chips. Returns false (no change) if unaffordable. */
  bet: (amt: number) => boolean;
  /** Add winnings. */
  win: (amt: number) => void;
  /** Apply a signed delta (positive = won, negative = lost). Clamped at 0. */
  adjust: (delta: number) => void;
  /** Overwrite balance directly (used to mirror poker's human stack). */
  setBalance: (next: number) => void;
  /** Credit a wheel prize and return the amount awarded. */
  award: (amt: number) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [balance, setBalanceState] = useState<number>(START_CHIPS);

  // hydrate from storage after mount (avoids SSR/client mismatch)
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s !== null) {
        const v = parseInt(s, 10);
        if (Number.isFinite(v) && v >= 0) setBalanceState(v);
      }
    } catch {}
  }, []);

  const persist = (v: number) => { try { localStorage.setItem(STORAGE_KEY, String(v)); } catch {} };

  const setBalance = useCallback((next: number) => {
    const v = Math.max(0, Math.round(next));
    setBalanceState(v);
    persist(v);
  }, []);

  const adjust = useCallback((delta: number) => {
    setBalanceState(prev => {
      const v = Math.max(0, Math.round(prev + delta));
      persist(v);
      return v;
    });
  }, []);

  const bet = useCallback((amt: number) => {
    let ok = false;
    setBalanceState(prev => {
      if (amt <= 0 || amt > prev) return prev;
      ok = true;
      const v = prev - amt;
      persist(v);
      return v;
    });
    return ok;
  }, []);

  const win = useCallback((amt: number) => adjust(Math.abs(amt)), [adjust]);
  const award = useCallback((amt: number) => adjust(Math.abs(amt)), [adjust]);

  const value: WalletContextType = {
    balance,
    broke: balance <= 0,
    bet,
    win,
    adjust,
    setBalance,
    award,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = (): WalletContextType => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within a WalletProvider');
  return ctx;
};
