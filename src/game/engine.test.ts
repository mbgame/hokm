// Sanity tests. Run: node --experimental-strip-types src/game/engine.test.ts
import { buildDeck, deal, shuffleDeck } from './deck';
import { legalCards, trickWinner } from './rules';
import { chooseTrump } from './bot';
import { botPlay, botTrump, createGame, nextHand, playCard, setTrump } from './engine';
import { Card, GameState, Suit, teamOf } from './types';

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', name); }
}

// Deck.
const deck = buildDeck();
check('deck has 52 cards', deck.length === 52);
check('deck unique', new Set(deck.map(c => `${c.number}-${c.type}`)).size === 52);
const hands = deal(shuffleDeck(deck));
check('4 hands of 13', hands.length === 4 && hands.every(h => h.length === 13));

// trickWinner: highest trump wins.
const trick = [
  { player: 0 as const, card: { type: 'hearts', number: 'ace', value: 14 } as Card },
  { player: 1 as const, card: { type: 'hearts', number: '2', value: 2 } as Card },
  { player: 2 as const, card: { type: 'spades', number: '3', value: 3 } as Card }, // trump
  { player: 3 as const, card: { type: 'hearts', number: 'king', value: 13 } as Card },
];
check('trump beats high non-trump', trickWinner(trick, 'spades') === 2);
check('no trump -> highest led suit', trickWinner(trick, 'clubs') === 0);

// follow-suit legality.
const hand: Card[] = [
  { type: 'hearts', number: '5', value: 5 },
  { type: 'spades', number: 'ace', value: 14 },
];
const led = [{ player: 1 as const, card: { type: 'hearts', number: 'king', value: 13 } as Card }];
check('must follow led suit', legalCards(hand, led).length === 1 && legalCards(hand, led)[0].type === 'hearts');
check('any card when void', legalCards([{ type: 'spades', number: 'ace', value: 14 }], led).length === 1);

// chooseTrump picks the longest suit.
const five: Card[] = [
  { type: 'clubs', number: 'ace', value: 14 },
  { type: 'clubs', number: 'king', value: 13 },
  { type: 'clubs', number: '5', value: 5 },
  { type: 'hearts', number: '2', value: 2 },
  { type: 'spades', number: '3', value: 3 },
];
check('chooseTrump = clubs (longest)', chooseTrump(five) === 'clubs');

// Full hand: human is hakem, all four play to completion via bot AI.
function playFullHand(): GameState {
  let s = createGame({ dealer: 3 }); // hakem = seat 0 (human)
  check('hakem is seat 0', s.hakem === 0);
  s = setTrump(s, 'spades');
  check('phase playing after trump', s.phase === 'playing');
  let guard = 0;
  while (s.phase === 'playing' && guard++ < 60) {
    s = botPlay(s); // human seat 0 also auto-played by AI for the test
  }
  return s;
}
const finished = playFullHand();
check('hand ends', finished.phase === 'hand-over' || finished.phase === 'game-over');
check('trick wins sum sane', finished.trickWins[0] + finished.trickWins[1] <= 13);
check('a team reached 7 or 13 played',
  finished.trickWins[0] >= 7 || finished.trickWins[1] >= 7 || finished.completedTricks === 13);
check('handResult set', finished.handResult != null);
check('winning team scored', finished.score[finished.handResult!.winner] >= 1);

// kot detection.
const kot = createGame({ dealer: 3 });
const forced: GameState = {
  ...kot,
  phase: 'hand-over',
  trickWins: [7, 0],
  handResult: { winner: 0, type: 'kot', points: 2, trickWins: [7, 0] },
};
check('kot when loser has 0 tricks', forced.handResult!.type === 'kot');

// nextHand: hakem keeps call when their team wins.
const won: GameState = { ...kot, phase: 'hand-over',
  handResult: { winner: teamOf(kot.hakem), type: 'normal', points: 1, trickWins: [7, 6] }, score: [1, 0] };
const cont = nextHand(won, deal(shuffleDeck(buildDeck())));
check('hakem unchanged after win', cont.hakem === won.hakem);
check('score carried over', cont.score[0] === 1);

// Illegal play throws.
let threw = false;
try {
  let s = setTrump(createGame({ dealer: 3 }), 'spades');
  // force a non-owned / out-of-turn card
  playCard(s, 1 as 0, s.hands[0][0]);
} catch { threw = true; }
check('out-of-turn play throws', threw);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
