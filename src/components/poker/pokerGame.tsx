"use client";
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping } from 'three';
import PokerScene from './pokerScene';
import Cards2d from '../cards2d/cards2d';
import { usePeek, PeekButton } from '../cards2d/peek';
import GameSettings from '../gameSettings/gameSettings';
import ResetCameraButton from '../backButton/resetCameraButton';
import WalletHud from '../wallet/walletHud';
import { useHoldem } from '../../games/poker/useHoldem';
import { useWallet } from '../../context/walletContext';
import { useSettings } from '../../context/settingsContext';
import { initAudio, resumeAudio } from '../../audio/audio';
import styles from './poker.module.css';

const PokerGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const wallet = useWallet();
  const { dpr } = useSettings();
  const { state, isHumanTurn, toCall, minRaise, bigBlind, actions } = useHoldem(wallet);
  const [raiseTo, setRaiseTo] = React.useState(0);
  const controlsRef = React.useRef<any>(null);

  React.useEffect(() => { initAudio(); resumeAudio(); }, []);

  // 2D cards hidden by default; flashed for 3s by the large-view button
  const peek = usePeek();

  const human = state.players[0];
  const idle = state.phase === 'idle';
  const handover = state.phase === 'handover';

  // raise bounds for the slider
  const minRaiseTo = state.currentBet + minRaise;
  const maxRaiseTo = human.committed + human.chips; // all-in
  React.useEffect(() => {
    setRaiseTo(Math.min(maxRaiseTo, Math.max(minRaiseTo, state.currentBet + bigBlind * 2)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.toAct, state.phase]);

  const canRaise = isHumanTurn && maxRaiseTo > state.currentBet;

  // bot seats shown along the top; positions purely cosmetic
  const seatPos = [styles.seatYou, styles.seat1, styles.seat2, styles.seat3];

  return (
    <>
      <Canvas
        shadows
        dpr={dpr}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
        style={{ width: '100vw', height: '100dvh', backgroundColor: '#430a18', touchAction: 'none' }}
      >
        <Suspense fallback={null}>
          <PokerScene state={state} controlsRef={controlsRef} />
        </Suspense>
      </Canvas>

      <GameSettings onBack={onBack} />
      <ResetCameraButton onReset={() => controlsRef.current?.reset()} />
      <WalletHud />

      {/* pot + street */}
      <div className={styles.pot}>
        <span>POT</span><b>{state.pot}</b>
        <em>{state.message}</em>
      </div>

      {/* bot chip tags (your own tag lives inside the controls column below) */}
      {state.players.slice(1).map((p, idx) => {
        const i = idx + 1;
        return (
          <div key={i} className={`${styles.seat} ${seatPos[i]} ${state.toAct === i ? styles.active : ''} ${p.folded ? styles.folded : ''}`}>
            <div className={styles.seatName}>
              {p.name}{state.button === i ? <span className={styles.btn}>D</span> : null}
            </div>
            <div className={styles.seatChips}>{p.chips}</div>
            {p.committed > 0 && <div className={styles.seatBet}>{p.committed}</div>}
            {p.lastAction && <div className={styles.seatAct}>{p.lastAction}</div>}
          </div>
        );
      })}

      {/* large-view button: flash the flat 2D board + hole cards for low-vision players */}
      {human.hole.length > 0 && <PeekButton onClick={peek.show} />}
      {peek.visible && state.community.length > 0 && (
        <Cards2d cards={state.community} small label="BOARD" style={{ top: '25%' }} />
      )}
      {peek.visible && human.hole.length > 0 && (
        <Cards2d cards={human.hole} label="YOUR HAND" style={{ bottom: 150 }} />
      )}

      {/* controls (your player-state tag stacked above the action buttons) */}
      <div className={styles.controls}>
        <div className={`${styles.seat} ${styles.seatStatic} ${state.toAct === 0 ? styles.active : ''} ${human.folded ? styles.folded : ''}`}>
          <div className={styles.seatName}>
            {human.name}{state.button === 0 ? <span className={styles.btn}>D</span> : null}
          </div>
          <div className={styles.seatChips}>{human.chips}</div>
          {human.committed > 0 && <div className={styles.seatBet}>{human.committed}</div>}
          {human.lastAction && <div className={styles.seatAct}>{human.lastAction}</div>}
        </div>

        {(idle || handover) && (
          <button className={styles.primary} onClick={actions.deal} disabled={wallet.broke}>
            {wallet.broke ? 'OUT OF CHIPS' : idle ? 'DEAL' : 'NEXT HAND'}
          </button>
        )}

        {isHumanTurn && (
          <div className={styles.actRow}>
            <button className={styles.fold} onClick={actions.fold}>FOLD</button>
            {toCall === 0
              ? <button className={styles.call} onClick={actions.check}>CHECK</button>
              : <button className={styles.call} onClick={actions.call}>CALL {Math.min(toCall, human.chips)}</button>}
            {canRaise && (
              <div className={styles.raiseBox}>
                <input
                  type="range"
                  min={minRaiseTo}
                  max={maxRaiseTo}
                  step={bigBlind}
                  value={raiseTo}
                  onChange={e => setRaiseTo(+e.target.value)}
                />
                <button className={styles.raise} onClick={() => actions.raise(raiseTo)}>
                  {raiseTo >= maxRaiseTo ? `ALL-IN ${raiseTo}` : `RAISE ${raiseTo}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default PokerGame;
