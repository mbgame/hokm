"use client";
import React from 'react';
import styles from './cards2d.module.css';

// Peek state for the 2D card overlay: hidden by default, shown for `ms` after
// each tap of the large-view button, then auto-hidden. Re-tapping restarts the
// timer so the cards never blink away mid-look.
export function usePeek(ms = 3000) {
  const [visible, setVisible] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = React.useCallback(() => {
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), ms);
  }, [ms]);
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return { visible, show };
}

// Floating toggle that flashes the 2D card overlay for a few seconds.
export const PeekButton: React.FC<{ onClick: () => void; style?: React.CSSProperties }> = ({ onClick, style }) => (
  <button
    type="button"
    className={styles.peekBtn}
    style={{ left: 14, bottom: 'max(14px, env(safe-area-inset-bottom))', ...style }}
    onClick={onClick}
    aria-label="Show large 2D cards"
  >
    🔍 2D view
  </button>
);
