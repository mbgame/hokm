"use client";
import React from 'react';
import { WHEEL_PRIZES, useWallet } from '../../context/walletContext';
import { sfx } from '../../audio/audio';
import styles from './wallet.module.css';

type Props = {
  /** When true the modal can't be dismissed without spinning (player is broke). */
  forced?: boolean;
  onClose: () => void;
};

const SEG = 360 / WHEEL_PRIZES.length;
const COLORS = ['#c0392b', '#16243a', '#1e8449', '#7d3c98', '#b9770e', '#117a8b', '#922b21', '#1f618d'];

// Chance wheel: tap SPIN, the disc eases through several turns and lands on a
// random prize, then credits the shared wallet. Pure CSS conic-gradient disc +
// a transform transition — no canvas, works on top of the 3D games.
const SpinWheel: React.FC<Props> = ({ forced = false, onClose }) => {
  const { award, balance } = useWallet();
  const [angle, setAngle] = React.useState(0);
  const [spinning, setSpinning] = React.useState(false);
  const [prize, setPrize] = React.useState<number | null>(null);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setPrize(null);
    sfx.sweep();

    const idx = Math.floor(Math.random() * WHEEL_PRIZES.length);
    // land so the pointer (top, 0°) sits at the middle of segment `idx`
    const target = 360 * 6 + (360 - (idx * SEG + SEG / 2));
    setAngle(prev => prev - (prev % 360) + target);

    window.setTimeout(() => {
      setSpinning(false);
      setPrize(WHEEL_PRIZES[idx]);
      award(WHEEL_PRIZES[idx]);
      sfx.win();
    }, 4200);
  };

  // conic-gradient slices for the wheel face
  const gradient = WHEEL_PRIZES
    .map((_, i) => `${COLORS[i % COLORS.length]} ${i * SEG}deg ${(i + 1) * SEG}deg`)
    .join(', ');

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.wheelTitle}>{forced ? 'Out of chips!' : 'Bonus Wheel'}</h2>
        <p className={styles.wheelSub}>
          {forced ? 'Spin to top up and keep playing.' : 'Spin for free chips.'}
        </p>

        <div className={styles.wheelWrap}>
          <div className={styles.pointer} />
          <div
            className={styles.wheel}
            style={{
              background: `conic-gradient(${gradient})`,
              transform: `rotate(${angle}deg)`,
              transition: spinning ? 'transform 4s cubic-bezier(.17,.67,.16,1)' : 'none',
            }}
          >
            {WHEEL_PRIZES.map((p, i) => (
              <span
                key={i}
                className={styles.wheelLabel}
                style={{ transform: `rotate(${i * SEG + SEG / 2}deg)` }}
              >
                <span className={styles.wheelLabelText}>{p}</span>
              </span>
            ))}
          </div>
          <div className={styles.hub} />
        </div>

        {prize !== null
          ? <div className={styles.prize}>+{prize} chips!</div>
          : <div className={styles.prizePlaceholder}>Balance: {balance}</div>}

        <div className={styles.wheelBtns}>
          <button className={styles.spinBtn} onClick={spin} disabled={spinning}>
            {spinning ? 'Spinning…' : 'SPIN'}
          </button>
          {(!forced || prize !== null) && (
            <button className={styles.closeBtn} onClick={onClose} disabled={spinning}>
              {prize !== null ? 'Continue' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpinWheel;
