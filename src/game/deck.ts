import { Card, Rank, Suit } from './types';

const SUITS: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];

const RANK_VALUE: Record<Rank, number> = {
  ace: 14, king: 13, queen: 12, jack: 11,
  '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2,
};

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const number of Object.keys(RANK_VALUE) as Rank[]) {
    for (const type of SUITS) {
      deck.push({ type, number, value: RANK_VALUE[number] });
    }
  }
  return deck;
}

/** Fisher–Yates shuffle (returns a new array, leaves input untouched). */
export function shuffleDeck(deck: Card[]): Card[] {
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Deal 52 cards into 4 hands of 13 (player p gets deck[13p .. 13p+12]). */
export function deal(deck: Card[]): Card[][] {
  const hands: Card[][] = [[], [], [], []];
  for (let i = 0; i < 4; i++) {
    hands[i] = deck.slice(i * 13, i * 13 + 13);
  }
  return hands;
}
