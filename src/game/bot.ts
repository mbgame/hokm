import { beats, legalCards, ledSuit, trickWinner } from './rules';
import { Card, GameState, PlayerId, Suit, teamOf } from './types';

const SUITS: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];

const lowest = (cards: Card[]): Card =>
  cards.reduce((m, c) => (c.value < m.value ? c : m), cards[0]);

const highest = (cards: Card[]): Card =>
  cards.reduce((m, c) => (c.value > m.value ? c : m), cards[0]);

/**
 * Pick a trump suit from the first 5 cards: the suit with the most cards,
 * breaking ties by total strength. Used when a bot is hakem.
 */
export function chooseTrump(firstFive: Card[]): Suit {
  let best: Suit = 'spades';
  let bestScore = -1;
  for (const suit of SUITS) {
    const cards = firstFive.filter(c => c.type === suit);
    const score = cards.length * 100 + cards.reduce((s, c) => s + c.value, 0);
    if (score > bestScore) {
      bestScore = score;
      best = suit;
    }
  }
  return best;
}

/**
 * Heuristic card choice for a bot.
 * Leading: prefer a high card of a long non-trump suit, hoard trumps.
 * Following: win as cheaply as possible when it helps; otherwise dump low and
 * never waste a high card or trump when the partner is already winning.
 */
export function chooseCard(state: GameState, player: PlayerId): Card {
  const hand = state.hands[player];
  const trick = state.currentTrick;
  const trump = state.trump;
  const options = legalCards(hand, trick);
  if (options.length === 1) return options[0];

  // Leading the trick.
  if (trick.length === 0) {
    const nonTrump = options.filter(c => trump == null || c.type !== trump);
    const pool = nonTrump.length > 0 ? nonTrump : options;
    // Lead the strongest card of the longest suit in the pool.
    const bySuit = new Map<Suit, Card[]>();
    for (const c of pool) {
      const arr = bySuit.get(c.type) ?? [];
      arr.push(c);
      bySuit.set(c.type, arr);
    }
    let chosenSuit = pool[0].type;
    let longest = -1;
    for (const [suit, cards] of bySuit) {
      if (cards.length > longest) {
        longest = cards.length;
        chosenSuit = suit;
      }
    }
    return highest(pool.filter(c => c.type === chosenSuit));
  }

  // Following.
  const winnerSeat = trickWinner(trick, trump);
  const partnerWinning = teamOf(winnerSeat) === teamOf(player);
  const winners = options.filter(c => beats(c, trick, trump));

  if (partnerWinning) {
    // Partner already winning: throw the lowest card, never trump in.
    const led = ledSuit(trick);
    const followers = options.filter(c => c.type === led);
    return lowest(followers.length > 0 ? followers : options);
  }

  if (winners.length > 0) {
    // Opponent winning and we can beat them -> win as cheaply as possible.
    return lowest(winners);
  }

  // Can't win: dump the lowest card, prefer not to discard a trump.
  const nonTrump = options.filter(c => trump == null || c.type !== trump);
  return lowest(nonTrump.length > 0 ? nonTrump : options);
}
