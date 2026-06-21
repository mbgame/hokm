"use client";
import React from 'react';
import styles from './mainMenu.module.css';

export type GameId = 'hokm' | 'blackjack' | 'poker';

type GameDef = {
  id: GameId;
  title: string;
  tag: string;
  blurb: string;
  suit: string;
  theme: string; // css class for the card accent
};

const GAMES: GameDef[] = [
  { id: 'hokm', title: 'HOKM', tag: 'Court Piece', blurb: '4-player trick taking. Call trump, win 7 tricks with your partner.', suit: '♠', theme: styles.green },
  { id: 'blackjack', title: 'BLACKJACK', tag: '21 vs Dealer', blurb: 'Beat the dealer. Hit, stand and chase a natural 21.', suit: '♥', theme: styles.blue },
  { id: 'poker', title: "HOLD'EM", tag: 'Texas Poker', blurb: '2 hole cards, 5 community. Bet, bluff and take the pot.', suit: '♦', theme: styles.red },
];

type Props = { onSelect: (id: GameId) => void };

// Gamish landing menu: animated felt backdrop + three glossy game cards. Pure
// DOM (no canvas) so it's instant and works before any 3D scene mounts.
const MainMenu: React.FC<Props> = ({ onSelect }) => (
  <div className={styles.root}>
    <div className={styles.bg} />
    <div className={styles.vignette} />

    <header className={styles.head}>
      <div className={styles.suits}>
        <span className={styles.dark}>♠</span>
        <span className={styles.red}>♥</span>
        <span className={styles.dark}>♣</span>
        <span className={styles.red}>♦</span>
      </div>
      <h1 className={styles.brand}>CARD&nbsp;ROYALE</h1>
      <p className={styles.sub}>Pick your table</p>
    </header>

    <div className={styles.grid}>
      {GAMES.map((g) => (
        <button
          key={g.id}
          className={`${styles.card} ${g.theme}`}
          onClick={() => onSelect(g.id)}
        >
          <div className={styles.shine} />
          <span className={styles.suit}>{g.suit}</span>
          <span className={styles.tag}>{g.tag}</span>
          <h2 className={styles.title}>{g.title}</h2>
          <p className={styles.blurb}>{g.blurb}</p>
          <span className={styles.play}>PLAY ▸</span>
        </button>
      ))}
    </div>

    <footer className={styles.foot}>Tap a game to deal in</footer>
  </div>
);

export default MainMenu;
