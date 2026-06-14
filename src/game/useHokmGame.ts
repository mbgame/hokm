import { useCallback, useEffect, useRef, useState } from 'react';
import { chooseCard } from './bot';
import { legalCards } from './rules';
import {
  botPlay,
  botTrump,
  createGame,
  NewGameOptions,
  nextHand,
  playCard,
  setTrump,
} from './engine';
import { Card, GameState, HUMAN, Play, Suit } from './types';

export interface UseHokmGame {
  state: GameState;
  /** True while waiting for the human (seat 0) to act. */
  isHumanTurn: boolean;
  /** Cards the human may legally play right now ([] if not their turn). */
  humanLegalCards: Card[];
  /** Human is the hakem and must declare trump. */
  needsHumanTrump: boolean;
  selectTrump: (suit: Suit) => void;
  playHuman: (card: Card) => void;
  /** Notified each time any player commits a card (for animation hooks). */
  onPlay?: (play: Play) => void;
  /** Start the next hand (call after phase === 'hand-over'). */
  startNextHand: (hands?: Card[][]) => void;
  reset: (opts?: NewGameOptions) => void;
}

export interface HokmGameConfig extends NewGameOptions {
  /** ms between automated bot actions, for pacing the UI. */
  botDelayMs?: number;
  onPlay?: (play: Play) => void;
}

/**
 * Single-player Court Piece controller: the human is seat 0, seats 1-3 are
 * bots that act automatically. Trump for a bot hakem is auto-declared. The
 * loop pauses whenever it is the human's turn or the human must call trump.
 */
export function useHokmGame(config: HokmGameConfig = {}): UseHokmGame {
  const { botDelayMs = 700, onPlay } = config;
  const [state, setState] = useState<GameState>(() => createGame(config));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onPlayRef = useRef(onPlay);
  onPlayRef.current = onPlay;

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  // Drive automated actors: bot trump call, then bot card plays.
  useEffect(() => {
    clearTimer();
    if (state.phase === 'awaiting-trump' && state.hakem !== HUMAN) {
      timer.current = setTimeout(() => setState(s => botTrump(s)), botDelayMs);
    } else if (state.phase === 'playing' && state.turn !== HUMAN) {
      timer.current = setTimeout(() => {
        setState(s => {
          if (s.phase !== 'playing' || s.turn === HUMAN) return s;
          const card = chooseCard(s, s.turn);
          onPlayRef.current?.({ player: s.turn, card });
          return playCard(s, s.turn, card);
        });
      }, botDelayMs);
    }
    return clearTimer;
  }, [state, botDelayMs]);

  const selectTrump = useCallback((suit: Suit) => {
    setState(s => (s.phase === 'awaiting-trump' && s.hakem === HUMAN ? setTrump(s, suit) : s));
  }, []);

  const playHuman = useCallback((card: Card) => {
    setState(s => {
      if (s.phase !== 'playing' || s.turn !== HUMAN) return s;
      if (!legalCards(s.hands[HUMAN], s.currentTrick).some(c => c.type === card.type && c.number === card.number)) {
        return s; // ignore illegal click (must follow suit)
      }
      onPlayRef.current?.({ player: HUMAN, card });
      return playCard(s, HUMAN, card);
    });
  }, []);

  const startNextHand = useCallback((hands?: Card[][]) => {
    setState(s => (s.phase === 'hand-over' ? nextHand(s, hands) : s));
  }, []);

  const reset = useCallback((opts?: NewGameOptions) => {
    clearTimer();
    setState(createGame(opts));
  }, []);

  const isHumanTurn = state.phase === 'playing' && state.turn === HUMAN;
  const needsHumanTrump = state.phase === 'awaiting-trump' && state.hakem === HUMAN;

  return {
    state,
    isHumanTurn,
    humanLegalCards: isHumanTurn ? legalCards(state.hands[HUMAN], state.currentTrick) : [],
    needsHumanTrump,
    selectTrump,
    playHuman,
    startNextHand,
    reset,
  };
}
