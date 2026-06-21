"use client";
import React from 'react';
import styles from './gameSettings.module.css';
import { useSettings, type Quality } from '../../context/settingsContext';
import {
  getSfxVolume, getMusicVolume, setSfxVolume, setMusicVolume,
  toggleMute, isMuted, sfx,
} from '../../audio/audio';

// Plain-DOM settings overlay shown on every table (rendered outside the Canvas).
// A fixed gear button opens a panel to return to the main menu and adjust
// sound + graphics/performance. Quality is shared across all games via
// SettingsContext; volumes go straight to the audio module.
type Props = {
  /** return to the main menu */
  onBack: () => void;
  /** optional game-specific restart (e.g. Hokm "restart match") */
  onRestart?: () => void;
  restartLabel?: string;
};

const QUALITY_OPTS: Quality[] = ['low', 'medium', 'high'];

const GameSettings: React.FC<Props> = ({ onBack, onRestart, restartLabel = 'Restart' }) => {
  const { quality, setQuality } = useSettings();
  const [open, setOpen] = React.useState(false);
  const [sfxVol, setSfxVol] = React.useState(0.8);
  const [musicVol, setMusicVol] = React.useState(0.5);
  const [mute, setMute] = React.useState(false);

  // sync controls with the audio module each time the panel opens
  React.useEffect(() => {
    if (open) {
      setSfxVol(getSfxVolume());
      setMusicVol(getMusicVolume());
      setMute(isMuted());
    }
  }, [open]);

  const onSfx = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setSfxVol(v); setSfxVolume(v);
  };
  const onMusic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setMusicVol(v); setMusicVolume(v);
  };
  const onToggleMute = () => { sfx.click(); setMute(toggleMute()); };

  return (
    <>
      <button
        className={styles.gear}
        onClick={() => { sfx.click(); setOpen(true); }}
        aria-label="settings"
      >
        ⚙️
      </button>

      {open && (
        <div className={styles.modalWrap} onClick={() => setOpen(false)}>
          <div className={styles.panel} onClick={e => e.stopPropagation()}>
            <button
              className={styles.closeBtn}
              onClick={() => setOpen(false)}
              aria-label="close settings"
            >✕</button>
            <h2 className={styles.title}>Settings</h2>

            <div className={styles.section}>Sound</div>

            <label className={styles.row}>
              <span className={styles.rowLabel}>SFX Volume</span>
              <input type="range" min={0} max={1} step={0.05}
                value={sfxVol} onChange={onSfx} className={styles.slider} disabled={mute} />
              <span className={styles.rowVal}>{Math.round(sfxVol * 100)}%</span>
            </label>

            <label className={styles.row}>
              <span className={styles.rowLabel}>Background Music</span>
              <input type="range" min={0} max={1} step={0.05}
                value={musicVol} onChange={onMusic} className={styles.slider} disabled={mute} />
              <span className={styles.rowVal}>{Math.round(musicVol * 100)}%</span>
            </label>

            <button className={styles.muteToggle} onClick={onToggleMute}>
              {mute ? '🔇 Unmute' : '🔊 Mute all'}
            </button>

            <div className={styles.section}>Graphics &amp; Performance</div>

            <div className={styles.row}>
              <span className={styles.rowLabel}>Quality</span>
              <div className={styles.segmented}>
                {QUALITY_OPTS.map(q => (
                  <button key={q}
                    className={`${styles.segBtn} ${quality === q ? styles.segOn : ''}`}
                    onClick={() => { sfx.click(); setQuality(q); }}
                  >{q}</button>
                ))}
              </div>
            </div>
            <p className={styles.hint}>Lower quality boosts performance on slower devices.</p>

            <div className={styles.actions}>
              {onRestart && (
                <button
                  className={styles.restartBtn}
                  onClick={() => { sfx.click(); setOpen(false); onRestart(); }}
                >{restartLabel}</button>
              )}
              <button
                className={styles.menuBtn}
                onClick={() => { sfx.click(); setOpen(false); onBack(); }}
              >◂ Main Menu</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameSettings;
