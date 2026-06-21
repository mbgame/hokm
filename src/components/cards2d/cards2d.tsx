"use client";
import React from 'react';
import styles from './cards2d.module.css';

export type Card2dSuit = 'spades' | 'hearts' | 'clubs' | 'diamonds';
export interface Card2dData { type: Card2dSuit; number: string }

const SUIT_SYMBOL: Record<Card2dSuit, string> = {
  spades: '♠', hearts: '♥', clubs: '♣', diamonds: '♦',
};

const RANK_LABEL: Record<string, string> = {
  ace: 'A', king: 'K', queen: 'Q', jack: 'J', '10': '10',
  '9': '9', '8': '8', '7': '7', '6': '6', '5': '5', '4': '4', '3': '3', '2': '2',
};

// suit groups (low→high within) for a readable, sorted hand
const SUIT_ORDER: Card2dSuit[] = ['clubs', 'diamonds', 'hearts', 'spades'];
const RANK_VALUE: Record<string, number> = {
  ace: 14, king: 13, queen: 12, jack: 11, '10': 10,
  '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
};

export const card2dKey = (c: Card2dData) => `${c.type}-${c.number}`;

export interface Cards2dProps {
  cards: Card2dData[];
  label?: string;
  sort?: boolean;                       // sort into suit groups (player's own hand)
  small?: boolean;                      // smaller cards (board / dealer)
  hiddenFrom?: number;                  // cards at index >= this render face-down
  // interactive (Hokm): a card is tappable only when active and in legalKeys
  legalKeys?: Set<string>;
  active?: boolean;
  onPlay?: (c: Card2dData) => void;
  style?: React.CSSProperties;          // fixed positioning supplied by caller
}

// Flat 2D mirror of a set of cards, pinned to the screen as a DOM overlay
// (outside the 3D canvas) so low-vision players can read the hand. Read-only by
// default; pass legalKeys + onPlay to make legal cards tappable (Hokm).
const Cards2d: React.FC<Cards2dProps> = ({
  cards, label, sort, small, hiddenFrom, legalKeys, active, onPlay, style,
}) => {
  if (!cards || cards.length === 0) return null;

  const list = sort
    ? [...cards].sort(
        (a, b) => SUIT_ORDER.indexOf(a.type) - SUIT_ORDER.indexOf(b.type) ||
          RANK_VALUE[a.number] - RANK_VALUE[b.number],
      )
    : cards;

  const interactive = !!onPlay;

  return (
    <div className={styles.bar} style={style} role="group" aria-label={label || 'cards'}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.row}>
        {list.map((card, i) => {
          const down = hiddenFrom != null && i >= hiddenFrom;
          if (down) {
            return <div key={`back-${i}`} className={`${styles.card} ${styles.back} ${small ? styles.small : ''}`} aria-label="face down card" />;
          }
          const red = card.type === 'hearts' || card.type === 'diamonds';
          const legal = interactive && !!active && !!legalKeys?.has(card2dKey(card));
          const dim = interactive && !legal;
          return (
            <button
              key={card2dKey(card) + '-' + i}
              type="button"
              className={`${styles.card} ${red ? styles.red : styles.black} ${small ? styles.small : ''} ${legal ? styles.legal : ''} ${dim ? styles.dim : ''}`}
              disabled={!legal}
              aria-label={`${RANK_LABEL[card.number]} of ${card.type}`}
              onClick={() => legal && onPlay?.(card)}
            >
              <span className={styles.rank}>{RANK_LABEL[card.number]}</span>
              <span className={styles.suit}>{SUIT_SYMBOL[card.type]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Cards2d;
