import { Card, Play, PlayerId, Suit } from './types';

export const sameCard = (a: Card, b: Card): boolean =>
  a.type === b.type && a.number === b.number;

/** The suit that was led this trick, or null if no card has been played yet. */
export function ledSuit(trick: Play[]): Suit | null {
  return trick.length > 0 ? trick[0].card.type : null;
}

/**
 * Legal cards a player may play given the trick so far: must follow the led
 * suit if able; otherwise any card. Leading (empty trick) allows any card.
 */
export function legalCards(hand: Card[], trick: Play[]): Card[] {
  const led = ledSuit(trick);
  if (!led) return hand.slice();
  const followers = hand.filter(c => c.type === led);
  return followers.length > 0 ? followers : hand.slice();
}

export function isLegalPlay(hand: Card[], trick: Play[], card: Card): boolean {
  return legalCards(hand, trick).some(c => sameCard(c, card));
}

/**
 * Winner of a completed (or partial) trick: highest trump if any trump was
 * played, otherwise the highest card of the led suit.
 */
export function trickWinner(trick: Play[], trump: Suit | null): PlayerId {
  if (trick.length === 0) throw new Error('trickWinner: empty trick');
  const led = trick[0].card.type;
  const trumps = trump ? trick.filter(p => p.card.type === trump) : [];
  const pool = trumps.length > 0 ? trumps : trick.filter(p => p.card.type === led);
  return pool.reduce((best, p) => (p.card.value > best.card.value ? p : best), pool[0]).player;
}

/** True if `candidate` would currently be beating `trick` if added now. */
export function beats(candidate: Card, trick: Play[], trump: Suit | null): boolean {
  if (trick.length === 0) return true;
  const led = trick[0].card.type;
  const currentWinner = trickWinner(trick, trump);
  const winning = trick.find(p => p.player === currentWinner)!.card;
  const winnerIsTrump = trump != null && winning.type === trump;
  const candIsTrump = trump != null && candidate.type === trump;

  if (winnerIsTrump) return candIsTrump && candidate.value > winning.value;
  if (candIsTrump) return true; // trumping a non-trump lead
  if (candidate.type !== led) return false; // off-suit, no trump -> can't win
  return candidate.value > winning.value;
}
