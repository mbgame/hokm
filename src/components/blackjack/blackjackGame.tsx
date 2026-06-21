"use client";
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping } from 'three';
import BlackjackScene from './blackjackScene';
import Cards2d from '../cards2d/cards2d';
import { usePeek, PeekButton } from '../cards2d/peek';
import GameSettings from '../gameSettings/gameSettings';
import ResetCameraButton from '../backButton/resetCameraButton';
import WalletHud from '../wallet/walletHud';
import { useBlackjack } from '../../games/blackjack/useBlackjack';
import { handTotal } from '../../games/shared/deck';
import { useWallet } from '../../context/walletContext';
import { useSettings } from '../../context/settingsContext';
import { initAudio, resumeAudio } from '../../audio/audio';
import styles from './blackjack.module.css';

const BlackjackGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const wallet = useWallet();
  const { dpr } = useSettings();
  const { state, chips, actions } = useBlackjack(wallet.balance, wallet.adjust);
  const controlsRef = React.useRef<any>(null);

  React.useEffect(() => { initAudio(); resumeAudio(); }, []);

  const pTotal = state.player.length ? handTotal(state.player).total : 0;
  // while the hole card is hidden, only the dealer's up-card counts on screen
  const dShown = state.holeHidden ? state.dealer.slice(0, 1) : state.dealer;
  const dTotal = dShown.length ? handTotal(dShown).total : 0;

  // 2D cards hidden by default; flashed for 3s by the large-view button
  const peek = usePeek();

  const betting = state.phase === 'betting';
  const playing = state.phase === 'player';
  const result = state.phase === 'result';

  return (
    <>
      <Canvas
        shadows
        dpr={dpr}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
        style={{ width: '100vw', height: '100dvh', backgroundColor: '#0a2a4d', touchAction: 'none' }}
      >
        <Suspense fallback={null}>
          <BlackjackScene state={state} controlsRef={controlsRef} />
        </Suspense>
      </Canvas>

      <GameSettings onBack={onBack} />
      <ResetCameraButton onReset={() => controlsRef.current?.reset()} />
      <WalletHud />

      {/* top scoreboard */}
      <div className={styles.top}>
        <div className={styles.chip}><span>BET</span><b>${state.bet}</b></div>
      </div>

      {/* totals */}
      {!betting && (
        <div className={styles.totals}>
          <div className={styles.tot}><span>DEALER</span><b>{state.holeHidden ? `${dTotal}+` : dTotal}</b></div>
          <div className={`${styles.tot} ${pTotal > 21 ? styles.bustTot : ''}`}><span>YOU</span><b>{pTotal}</b></div>
        </div>
      )}

      {/* message banner */}
      <div className={`${styles.banner} ${result ? styles.bannerBig : ''}`}>{state.message}</div>

      {/* large-view button: flash the flat 2D hands for low-vision players */}
      {!betting && state.player.length > 0 && <PeekButton onClick={peek.show} />}
      {peek.visible && !betting && state.dealer.length > 0 && (
        <Cards2d cards={state.dealer} small label="DEALER"
          hiddenFrom={state.holeHidden ? 1 : undefined}
          style={{ top: 'max(56px, env(safe-area-inset-top))' }} />
      )}
      {peek.visible && state.player.length > 0 && (
        <Cards2d cards={state.player} label="YOU" style={{ bottom: 116 }} />
      )}

      {/* controls */}
      <div className={styles.controls}>
        {betting && (
          <>
            <div className={styles.chipsRow}>
              {chips.map(c => (
                <button key={c} className={styles.chipBtn} disabled={state.bet + c > wallet.balance} onClick={() => actions.addChip(c)}>${c}</button>
              ))}
              <button className={styles.clear} onClick={actions.clearBet} disabled={state.bet === 0}>Clear</button>
            </div>
            <button className={styles.primary} onClick={actions.deal} disabled={wallet.balance <= 0}>DEAL</button>
          </>
        )}
        {playing && (
          <div className={styles.chipsRow}>
            <button className={styles.action} onClick={actions.hit}>HIT</button>
            <button className={styles.action} onClick={actions.stand}>STAND</button>
          </div>
        )}
        {result && (
          <button className={styles.primary} onClick={actions.nextHand}>NEXT HAND</button>
        )}
      </div>
    </>
  );
};

export default BlackjackGame;
