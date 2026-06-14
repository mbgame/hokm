import React from 'react';
import styles from '../../styles/loading.module.css';

const SUITS = [
  { ch: '♠', red: false }, // ♠
  { ch: '♥', red: true },  // ♥
  { ch: '♣', red: false }, // ♣
  { ch: '♦', red: true },  // ♦
];

const Loading: React.FC = () => (
  <div className={styles.container}>
    <div className={styles.glow} />
    <div className={styles.vignette} />

    <div className={styles.content}>
      <div className={styles.suits}>
        {SUITS.map((s, i) => (
          <span
            key={i}
            className={`${styles.suit} ${s.red ? styles.red : styles.dark}`}
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            {s.ch}
          </span>
        ))}
      </div>

      <h1 className={styles.title}>HOKM</h1>
      <p className={styles.subtitle}>Shuffling the deck&hellip;</p>

      <div className={styles.bar}>
        <div className={styles.fill} />
      </div>
    </div>
  </div>
);

export default Loading;
