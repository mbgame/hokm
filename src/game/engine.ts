import { chooseCard, chooseTrump } from './bot';
import { buildDeck, deal, shuffleDeck } from './deck';
import { isLegalPlay, sameCard, trickWinner } from './rules';
import {
  Card,
  DEFAULT_SCORING,
  GameState,
  HandResult,
  HUMAN,
  nextSeat,
  PlayerId,
  ScoringConfig,
  Suit,
  teamOf,
} from './types';

const TRICKS_TO_WIN = 7;

export interface NewGameOptions {
  hands?: Card[][];          // supply a deal (e.g. matching the 3D scene); else shuffle
  dealer?: PlayerId;
  scoring?: ScoringConfig;
  score?: [number, number];
}

/** Start a fresh hand. Hakem is the player after the dealer. */
export function createGame(opts: NewGameOptions = {}): GameState {
  const hands = opts.hands ?? deal(shuffleDeck(buildDeck()));
  const dealer = opts.dealer ?? 3;
  const hakem = nextSeat(dealer);
  return {
    hands: hands.map(h => h.slice()),
    trump: null,
    hakem,
    dealer,
    leader: hakem,
    turn: hakem,
    currentTrick: [],
    trickWins: [0, 0],
    completedTricks: 0,
    phase: 'awaiting-trump',
    lastTrick: null,
    handResult: null,
    score: opts.score ?? [0, 0],
    scoring: opts.scoring ?? DEFAULT_SCORING,
  };
}

/** Hakem declares trump; play then begins with the hakem leading. */
export function setTrump(state: GameState, suit: Suit): GameState {
  if (state.phase !== 'awaiting-trump') throw new Error('setTrump: not awaiting trump');
  return {
    ...state,
    trump: suit,
    phase: 'playing',
    leader: state.hakem,
    turn: state.hakem,
  };
}

function computeHandResult(state: GameState): HandResult {
  const [a, b] = state.trickWins;
  const winner = a > b ? 0 : 1;
  const winnerTricks = Math.max(a, b);
  const loserTricks = Math.min(a, b);
  let type: HandResult['type'] = 'normal';
  if (winnerTricks === 13) type = 'baavni';
  else if (loserTricks === 0) type = 'kot';
  const points = state.scoring[type];
  return { winner, type, points, trickWins: [a, b] };
}

/**
 * Play one card for the player whose turn it is. Resolves the trick when the
 * fourth card lands, and ends the hand when a team reaches 7 tricks (or all 13
 * are played). Pure: returns a new state.
 */
export function playCard(state: GameState, player: PlayerId, card: Card): GameState {
  if (state.phase !== 'playing') throw new Error('playCard: not in playing phase');
  if (player !== state.turn) throw new Error(`playCard: not player ${player}'s turn`);
  if (!isLegalPlay(state.hands[player], state.currentTrick, card)) {
    throw new Error('playCard: illegal card (must follow suit)');
  }

  const hands = state.hands.map((h, i) =>
    i === player ? h.filter(c => !sameCard(c, card)) : h,
  );
  const currentTrick = [...state.currentTrick, { player, card }];

  // Trick still in progress.
  if (currentTrick.length < 4) {
    return { ...state, hands, currentTrick, turn: nextSeat(player) };
  }

  // Trick complete -> resolve.
  const winner = trickWinner(currentTrick, state.trump);
  const trickWins: [number, number] = [...state.trickWins] as [number, number];
  trickWins[teamOf(winner)] += 1;
  const completedTricks = state.completedTricks + 1;
  const lastTrick = { plays: currentTrick, winner };

  const handOver =
    trickWins[0] >= TRICKS_TO_WIN || trickWins[1] >= TRICKS_TO_WIN || completedTricks === 13;

  const base: GameState = {
    ...state,
    hands,
    currentTrick: [],
    trickWins,
    completedTricks,
    lastTrick,
    leader: winner,
    turn: winner,
  };

  if (!handOver) return base;

  const handResult = computeHandResult(base);
  const score: [number, number] = [...base.score] as [number, number];
  score[handResult.winner] += handResult.points;
  const phase = score[handResult.winner] >= base.scoring.matchTarget ? 'game-over' : 'hand-over';

  return { ...base, handResult, score, phase };
}

/** Convenience: the bot whose turn it is plays its chosen card. */
export function botPlay(state: GameState): GameState {
  const card = chooseCard(state, state.turn);
  return playCard(state, state.turn, card);
}

/** Bot hakem auto-declares trump from its first 5 cards. */
export function botTrump(state: GameState): GameState {
  return setTrump(state, chooseTrump(state.hands[state.hakem].slice(0, 5)));
}

/**
 * Begin the next hand after one ends. Hakem keeps the call if their team won;
 * otherwise it passes to the next seat. Dealer advances with the hakem.
 */
export function nextHand(state: GameState, hands?: Card[][]): GameState {
  if (state.phase !== 'hand-over') throw new Error('nextHand: hand not over');
  const hakemTeamWon = state.handResult!.winner === teamOf(state.hakem);
  const dealer = hakemTeamWon ? state.dealer : nextSeat(state.dealer);
  return createGame({
    hands,
    dealer,
    scoring: state.scoring,
    score: state.score,
  });
}

export { HUMAN, teamOf };
