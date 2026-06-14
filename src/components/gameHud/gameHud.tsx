import React from 'react';
import { Html } from '@react-three/drei';
import styles from './gameHud.module.css';
import { getSfxVolume, getMusicVolume, setSfxVolume, setMusicVolume, sfx } from '../../audio/audio';

export type Quality = 'low' | 'medium' | 'high';

const SUIT_GLYPH: Record<string, string> = {
  spades: '♠', hearts: '♥', clubs: '♣', diamonds: '♦',
};
const isRed = (s: string) => s === 'hearts' || s === 'diamonds';

type Pair = [number, number];

interface Props {
  gamesWon: Pair;       // match score (games)
  teamTricks: Pair;     // current game tricks
  hokm: string;
  trickTarget: number;  // tricks to win a game (7)
  matchTarget: number;  // games to win the match (7)
  hakemSeat: number;    // who calls trump & leads (0 You,1 Right,2 Partner,3 Left)
  gameOver: boolean;    // a game finished (a team reached 7 tricks)
  matchOver: boolean;   // a team reached 7 games
  winningTeam: 0 | 1;   // who won the finished game/match
  resultBadge: string;  // '', 'KOT', 'BAAVNI'
  showScore: boolean;   // show the scoreboard (only during play)
  canSort: boolean;     // show the Sort button (before the first card)
  onSort: () => void;
  quality: Quality;
  onQuality: (q: Quality) => void;
  onResetGame: () => void;
  onSettingsOpenChange?: (open: boolean) => void;
  onNext: () => void;
  onPlayAgain: () => void;
}

const Pips: React.FC<{ n: number; target: number; cls: string }> = ({ n, target, cls }) => (
  <div className={styles.pips}>
    {Array.from({ length: target }).map((_, i) => (
      <span key={i} className={`${styles.pip} ${cls} ${i < n ? styles.on : ''}`} />
    ))}
  </div>
);

const SEAT_NAME = ['You', 'Right', 'Partner', 'Left'];

const QUALITY_OPTS: Quality[] = ['low', 'medium', 'high'];

const GameHud: React.FC<Props> = ({
  gamesWon, teamTricks, hokm, trickTarget, matchTarget, hakemSeat,
  gameOver, matchOver, winningTeam, resultBadge, showScore, canSort, onSort,
  quality, onQuality, onResetGame, onSettingsOpenChange, onNext, onPlayAgain,
}) => {
  const youWon = winningTeam === 0;
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  // tell the scene so it can suspend OrbitControls (slider drags must not
  // double as a camera orbit gesture).
  React.useEffect(() => { onSettingsOpenChange?.(settingsOpen); }, [settingsOpen]);
  const [sfxVol, setSfxVol] = React.useState(0.8);
  const [musicVol, setMusicVol] = React.useState(0.5);

  // sync sliders with the audio module each time the panel opens
  React.useEffect(() => {
    if (settingsOpen) {
      setSfxVol(getSfxVolume());
      setMusicVol(getMusicVolume());
    }
  }, [settingsOpen]);

  const onSfx = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setSfxVol(v);
    setSfxVolume(v);
  };
  const onMusic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setMusicVol(v);
    setMusicVolume(v);
  };
  return (
    <Html fullscreen zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
      <div className={styles.overlay}>
        {/* live scoreboard */}
        {showScore && <div className={styles.scoreboard}>
          <div className={`${styles.side} ${styles.sideYou}`}>
            <span className={`${styles.teamName} ${styles.teamNameYou}`}>Your Team</span>
            <span className={styles.tricks}>{teamTricks[0]}</span>
            <span className={styles.games}>Games {gamesWon[0]}/{matchTarget}</span>
            <Pips n={gamesWon[0]} target={matchTarget} cls={styles.pipYou} />
          </div>

          <div className={styles.center}>
            <span className={styles.toWin}>Hakem: {SEAT_NAME[hakemSeat] ?? '—'}</span>
            <div className={styles.hokmRow}>
              <span className={styles.hokmLabel}>Hokm</span>
              {hokm
                ? <span className={`${styles.hokmSuit} ${isRed(hokm) ? styles.red : styles.dark}`}>{SUIT_GLYPH[hokm]}</span>
                : <span className={styles.hokmSuit}>—</span>}
            </div>
          </div>

          <div className={`${styles.side} ${styles.sideOpp}`}>
            <span className={`${styles.teamName} ${styles.teamNameOpp}`}>Opponents</span>
            <span className={styles.tricks}>{teamTricks[1]}</span>
            <span className={styles.games}>Games {gamesWon[1]}/{matchTarget}</span>
            <Pips n={gamesWon[1]} target={matchTarget} cls={styles.pipOpp} />
          </div>
        </div>}

        {/* settings (top-right) */}
        <button
          className={styles.muteBtn}
          onClick={() => { sfx.click(); setSettingsOpen(true); }}
          aria-label="settings"
        >
          ⚙️
        </button>

        {/* settings popup */}
        {settingsOpen && (
          <div className={styles.modalWrap} onClick={() => setSettingsOpen(false)}>
            <div className={styles.settings} onClick={e => e.stopPropagation()}>
              <button
                className={styles.closeBtn}
                onClick={() => setSettingsOpen(false)}
                aria-label="close settings"
              >✕</button>
              <h2 className={styles.settingsTitle}>Settings</h2>

              <label className={styles.row}>
                <span className={styles.rowLabel}>SFX Volume</span>
                <input type="range" min={0} max={1} step={0.05}
                  value={sfxVol} onChange={onSfx} className={styles.slider} />
                <span className={styles.rowVal}>{Math.round(sfxVol * 100)}%</span>
              </label>

              <label className={styles.row}>
                <span className={styles.rowLabel}>Background Music</span>
                <input type="range" min={0} max={1} step={0.05}
                  value={musicVol} onChange={onMusic} className={styles.slider} />
                <span className={styles.rowVal}>{Math.round(musicVol * 100)}%</span>
              </label>

              <div className={styles.row}>
                <span className={styles.rowLabel}>Graphic Quality</span>
                <div className={styles.segmented}>
                  {QUALITY_OPTS.map(q => (
                    <button key={q}
                      className={`${styles.segBtn} ${quality === q ? styles.segOn : ''}`}
                      onClick={() => { sfx.click(); onQuality(q); }}
                    >{q}</button>
                  ))}
                </div>
              </div>

              <button
                className={styles.resetBtn}
                onClick={() => { setSettingsOpen(false); onResetGame(); }}
              >Reset Game</button>
            </div>
          </div>
        )}

        {/* Sort button (bottom-right) — before the first card is played */}
        {canSort && !gameOver && (
          <button className={styles.sortBtn} onClick={onSort}>
            <span className={styles.sortIcon}>⇅</span> Sort
          </button>
        )}

        {/* result / match modal */}
        {gameOver && (
          <div className={styles.modalWrap}>
            <div className={`${styles.modal} ${youWon ? styles.modalWin : styles.modalLose}`}>
              <div className={styles.crown}>{matchOver ? '\u{1F3C6}' : youWon ? '\u{1F389}' : '\u{1F0CF}'}</div>
              <h1 className={styles.title}>
                {matchOver
                  ? (youWon ? 'You Win the Match!' : 'Match Lost')
                  : (youWon ? 'Game Won!' : 'Game Lost')}
              </h1>
              <p className={styles.subtitle}>
                {matchOver
                  ? (youWon ? 'You and your partner are champions' : 'Better luck next match')
                  : (youWon ? 'You and your partner took this hand' : 'The opponents took this hand')}
              </p>
              {resultBadge && <span className={styles.badge}>{resultBadge}</span>}

              <div className={styles.tally}>
                <div className={styles.tallyCell}>
                  <span className={`${styles.tallyNum} ${styles.tallyNumYou}`}>{gamesWon[0]}</span>
                  <span className={styles.tallyLbl}>You</span>
                </div>
                <span className={styles.vs}>games</span>
                <div className={styles.tallyCell}>
                  <span className={`${styles.tallyNum} ${styles.tallyNumOpp}`}>{gamesWon[1]}</span>
                  <span className={styles.tallyLbl}>Opp</span>
                </div>
              </div>

              {matchOver
                ? <button className={styles.btn} onClick={onPlayAgain}>Restart the game</button>
                : <button className={styles.btn} onClick={onNext}>Next Game</button>}
            </div>
          </div>
        )}
      </div>
    </Html>
  );
};

export default GameHud;
