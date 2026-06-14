// Court Piece (Hokm) core domain types.
// Seating is 0-indexed and fixed crosswise:
//   0 = You (human / South)
//   1 = Right opponent (East)
//   2 = Partner, sits across from you (North)
//   3 = Left opponent (West)
// Teams: seats {0,2} = team 0 (you + partner), seats {1,3} = team 1 (opponents).

export type Suit = 'spades' | 'hearts' | 'clubs' | 'diamonds';

export type Rank =
  | 'ace' | 'king' | 'queen' | 'jack'
  | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

export interface Card {
  type: Suit;
  number: Rank;
  /** Court Piece strength: ace=14, king=13, ... 2=2. Higher wins. */
  value: number;
}

export type PlayerId = 0 | 1 | 2 | 3;
export type TeamId = 0 | 1;

export interface Play {
  player: PlayerId;
  card: Card;
}

export type GamePhase = 'awaiting-trump' | 'playing' | 'hand-over' | 'game-over';

export type HandResultType = 'normal' | 'kot' | 'baavni';

export interface HandResult {
  winner: TeamId;
  type: HandResultType;
  points: number;
  trickWins: [number, number];
}

export interface ScoringConfig {
  normal: number;
  kot: number;
  baavni: number;
  /** Cumulative team points needed to win the match. */
  matchTarget: number;
}

export interface GameState {
  hands: Card[][];                 // hands[playerId] -> remaining cards
  trump: Suit | null;
  hakem: PlayerId;                 // trump caller for this hand
  dealer: PlayerId;
  leader: PlayerId;                // who leads the current trick
  turn: PlayerId;                  // whose turn it is right now
  currentTrick: Play[];            // plays this trick, in play order
  trickWins: [number, number];     // tricks won per team this hand
  completedTricks: number;
  phase: GamePhase;
  lastTrick: { plays: Play[]; winner: PlayerId } | null;
  handResult: HandResult | null;
  score: [number, number];         // cumulative match score per team
  scoring: ScoringConfig;
}

export const HUMAN: PlayerId = 0;

export const teamOf = (p: PlayerId): TeamId => (p % 2 === 0 ? 0 : 1);

export const partnerOf = (p: PlayerId): PlayerId => ((p + 2) % 4) as PlayerId;

export const nextSeat = (p: PlayerId): PlayerId => ((p + 1) % 4) as PlayerId;

export const DEFAULT_SCORING: ScoringConfig = {
  normal: 1,
  kot: 2,
  baavni: 3,
  matchTarget: 7,
};
