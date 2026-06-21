"use client";
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping } from 'three';
import Scene, { type HumanHudState } from '../scene/scene.component';
import Hand2d from '../hand2d/hand2d';
import { usePeek, PeekButton } from '../cards2d/peek';
import BackButton from '../backButton/backButton';
import WalletHud from '../wallet/walletHud';
import { useWallet } from '../../context/walletContext';
import styles from './hokm.module.css';

const STAKES = [500, 1000, 2500, 5000];

// Hokm table wrapper: same untouched 3D Scene, plus the shared wallet HUD and a
// per-game stake. Each finished game (7 tricks) settles the chosen stake on the
// casino bankroll — win it from the table, or lose it to the opponents.
const HokmGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const wallet = useWallet();
  const [stake, setStake] = React.useState(1000);
  const [toast, setToast] = React.useState<{ id: number; won: boolean; amt: number } | null>(null);
  // live snapshot of the human hand for the 2D accessibility hand bar
  const [hud, setHud] = React.useState<HumanHudState | null>(null);
  // stake is locked once the deal begins -> hide the picker after start
  const [started, setStarted] = React.useState(false);
  // 2D hand hidden by default; flashed for 3s by the large-view button
  const peek = usePeek();

  // clamp stake to what the player can actually cover
  const maxStake = Math.max(0, wallet.balance);
  const liveStake = Math.min(stake, maxStake);

  const onGameResult = React.useCallback((humanWon: boolean) => {
    // settle against the bankroll at the moment the game ends
    const amt = Math.min(stake, Math.max(0, wallet.balance));
    wallet.adjust(humanWon ? amt : -amt);
    setToast({ id: Date.now(), won: humanWon, amt });
  }, [wallet, stake]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 0.92,
        }}
        style={{ width: '100vw', height: '100dvh', backgroundColor: '#0c4a2a', touchAction: 'none' }}
      >
        <Suspense fallback={null}>
          <Scene onGameResult={onGameResult} stake={liveStake} onHud={setHud} onBack={onBack} onStarted={() => setStarted(true)} />
        </Suspense>
      </Canvas>

      <BackButton onBack={onBack} />
      <WalletHud />

      {/* large-view button: flash the flat 2D hand for low-vision players */}
      {hud?.gameStarted && <PeekButton onClick={peek.show} />}
      {peek.visible && <Hand2d state={hud} />}

      {/* per-game stake picker — only before the game starts */}
      {!started && (
      <div className={styles.stakeBar}>
        <span className={styles.stakeLabel}>STAKE / GAME</span>
        <div className={styles.stakeChips}>
          {STAKES.map(s => (
            <button
              key={s}
              className={`${styles.stakeChip} ${liveStake === s ? styles.stakeActive : ''}`}
              disabled={s > maxStake}
              onClick={() => setStake(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      )}

      {toast && (
        <div className={`${styles.toast} ${toast.won ? styles.toastWin : styles.toastLose}`}>
          {toast.won ? `Game won  +${toast.amt}` : `Game lost  −${toast.amt}`}
        </div>
      )}
    </>
  );
};

export default HokmGame;
