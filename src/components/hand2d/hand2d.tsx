"use client";
import React from 'react';
import Cards2d, { type Card2dData } from '../cards2d/cards2d';

export interface Hand2dCard {
  type: 'spades' | 'hearts' | 'clubs' | 'diamonds';
  number: 'ace' | 'king' | 'queen' | 'jack' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';
  value: number;
}

export interface Hand2dState {
  hand: Hand2dCard[];
  legalKeys: Set<string>;
  humanTurn: boolean;
  gameStarted: boolean;
  play: (type: Hand2dCard['type'], number: Hand2dCard['number']) => void;
}

// Hokm's interactive 2D hand bar (low-vision aid): mirrors the human's hand at
// the bottom of the screen and routes taps through the same play rules as the
// 3D table. Thin wrapper over the shared Cards2d strip.
const Hand2d: React.FC<{ state: Hand2dState | null }> = ({ state }) => {
  if (!state || !state.gameStarted || state.hand.length === 0) return null;
  return (
    <Cards2d
      cards={state.hand as Card2dData[]}
      sort
      legalKeys={state.legalKeys}
      active={state.humanTurn}
      onPlay={c => state.play(c.type as Hand2dCard['type'], c.number as Hand2dCard['number'])}
      style={{ bottom: 'max(8px, env(safe-area-inset-bottom))' }}
    />
  );
};

export default Hand2d;
