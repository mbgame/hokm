// Shared 52-card deck helpers for the Blackjack / Poker games. Ranks/suits match
// the sprite-atlas naming so cards render with the existing Card3D component.
import { SUITS, RANKS } from '../../components/card/atlasLayout';

export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];

export interface PlayingCard {
  type: Suit;   // suit
  number: Rank; // rank
}

export const key = (c: PlayingCard) => `${c.number}_of_${c.type}`;

export function freshDeck(): PlayingCard[] {
  const deck: PlayingCard[] = [];
  for (const type of SUITS) for (const number of RANKS) deck.push({ type, number });
  return deck;
}

// Fisher-Yates, returns a new shuffled array.
export function shuffled(deck: PlayingCard[] = freshDeck()): PlayingCard[] {
  const a = deck.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Numeric rank value, ace high (14). Use for poker comparisons.
const RANK_VALUE: Record<Rank, number> = {
  ace: 14, king: 13, queen: 12, jack: 11,
  '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
};
export const rankValue = (r: Rank) => RANK_VALUE[r];

// Blackjack pip value (ace counted as 11 here; soft/hard handled by caller).
export function blackjackValue(r: Rank): number {
  if (r === 'ace') return 11;
  if (r === 'king' || r === 'queen' || r === 'jack' || r === '10') return 10;
  return parseInt(r, 10);
}

// Best blackjack total for a hand, demoting aces from 11 to 1 as needed.
export function handTotal(cards: PlayingCard[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    total += blackjackValue(c.number);
    if (c.number === 'ace') aces++;
  }
  let soft = aces > 0;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  soft = aces > 0 && total <= 21;
  return { total, soft };
}
