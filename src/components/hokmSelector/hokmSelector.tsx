import React from 'react';
import { Html } from '@react-three/drei';
import styles from './hokmSelector.module.css';

type Suit = 'hearts' | 'spades' | 'clubs' | 'diamonds';

const SUITS: { suit: Suit; glyph: string; red: boolean }[] = [
  { suit: 'spades', glyph: '♠', red: false },
  { suit: 'hearts', glyph: '♥', red: true },
  { suit: 'clubs', glyph: '♣', red: false },
  { suit: 'diamonds', glyph: '♦', red: true },
];

type Props = {
  handleHokm: (suit: Suit) => void;
};

// Gamish 2D overlay (DOM via drei Html) shown in front of the player while the
// human is hakem and must call trump.
const HokmSelector: React.FC<Props> = ({ handleHokm }) => (
  <Html fullscreen zIndexRange={[120, 0]} style={{ pointerEvents: 'none' }}>
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <h2 className={styles.title}>Choose Hokm</h2>
        <p className={styles.hint}>Pick the trump suit</p>
        <div className={styles.suits}>
          {SUITS.map(({ suit, glyph, red }) => (
            <button
              key={suit}
              className={`${styles.suit} ${red ? styles.red : styles.dark}`}
              onClick={() => handleHokm(suit)}
              aria-label={suit}
            >
              {glyph}
            </button>
          ))}
        </div>
      </div>
    </div>
  </Html>
);

export default HokmSelector;
