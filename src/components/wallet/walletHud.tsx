"use client";
import React from 'react';
import { useWallet } from '../../context/walletContext';
import SpinWheel from './spinWheel';
import styles from './wallet.module.css';

type Props = {
  /** Extra class on the badge for per-game positioning (optional). */
  className?: string;
};

// Floating chip-stack badge shown on every table. Tap it any time to open the
// bonus wheel; if the bankroll hits zero the wheel pops up automatically and
// can't be dismissed until the player spins.
const WalletHud: React.FC<Props> = ({ className }) => {
  const { balance, broke } = useWallet();
  const [open, setOpen] = React.useState(false);

  // auto-open (forced) when broke
  const forced = broke;
  const showWheel = open || forced;

  return (
    <>
      <button
        className={`${styles.badge} ${className ?? ''}`}
        onClick={() => setOpen(true)}
        title="Tap for bonus chips"
      >
        <span className={styles.stack} aria-hidden>🪙</span>
        <span className={styles.badgeCol}>
          <span className={styles.badgeLabel}>CHIPS</span>
          <b className={styles.badgeVal}>{balance.toLocaleString()}</b>
        </span>
        <span className={styles.plus}>+</span>
      </button>

      {showWheel && <SpinWheel forced={forced} onClose={() => setOpen(false)} />}
    </>
  );
};

export default WalletHud;
