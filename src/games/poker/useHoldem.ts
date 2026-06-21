import { useCallback, useEffect, useRef, useState } from 'react';
import { PlayingCard, shuffled } from '../shared/deck';
import { evaluate, preflopStrength } from './evaluate';
import { sfx } from '../../audio/audio';

// Minimal wallet surface this hook needs (the human's seat IS the bankroll).
interface WalletLike { balance: number; setBalance: (n: number) => void; }

// Casual 4-handed No-Limit Texas Hold'em vs 3 bots. Single main pot (no side
// pots) to keep it approachable. Seat 0 is the human ("You").

export type PokerPhase = 'idle' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'handover';

export interface PokerPlayer {
  name: string;
  chips: number;
  hole: PlayingCard[];
  committed: number;   // chips put in THIS street
  folded: boolean;
  allIn: boolean;
  acted: boolean;      // has acted since the last raise this street
  isHuman: boolean;
  lastAction: string;  // shown as a small label
}

export interface PokerState {
  players: PokerPlayer[];
  community: PlayingCard[];
  deck: PlayingCard[];
  pot: number;
  phase: PokerPhase;
  button: number;
  toAct: number;       // seat to act, -1 when none
  currentBet: number;  // max committed this street
  minRaise: number;
  message: string;
  results: { winners: number[]; label: string } | null;
  reveal: boolean;     // show all hole cards (showdown)
}

const SEATS = 4;
const START_CHIPS = 1000;
const SB = 10;
const BB = 20;
const NAMES = ['You', 'Rocco', 'Vera', 'Sloane'];

const STRENGTH_BY_CAT = [0.16, 0.34, 0.54, 0.66, 0.78, 0.85, 0.92, 0.97, 0.995];

function postStrength(hole: PlayingCard[], community: PlayingCard[]): number {
  const r = evaluate([...hole, ...community]);
  return STRENGTH_BY_CAT[r.category] ?? 0.2;
}

function newPlayers(prev?: PokerPlayer[]): PokerPlayer[] {
  return Array.from({ length: SEATS }, (_, i) => ({
    name: NAMES[i],
    chips: prev ? prev[i].chips : START_CHIPS,
    hole: [],
    committed: 0,
    folded: false,
    allIn: false,
    acted: false,
    isHuman: i === 0,
    lastAction: '',
  }));
}

function nextActive(state: PokerState, after: number): number {
  for (let k = 1; k <= SEATS; k++) {
    const s = (after + k) % SEATS;
    const p = state.players[s];
    if (!p.folded && !p.allIn) return s;
  }
  return -1;
}

// First seat that still needs to act this street (unmatched bet or not acted).
function needsAction(state: PokerState, after: number): number {
  for (let k = 1; k <= SEATS; k++) {
    const s = (after + k) % SEATS;
    const p = state.players[s];
    if (p.folded || p.allIn) continue;
    if (!p.acted || p.committed < state.currentBet) return s;
  }
  return -1;
}

function activeCount(state: PokerState): number {
  return state.players.filter(p => !p.folded).length;
}

function collectToPot(state: PokerState) {
  for (const p of state.players) { state.pot += p.committed; p.committed = 0; p.acted = false; }
  state.currentBet = 0;
  state.minRaise = BB;
}

function dealStreet(state: PokerState) {
  if (state.phase === 'preflop') { state.community.push(state.deck.pop()!, state.deck.pop()!, state.deck.pop()!); state.phase = 'flop'; }
  else if (state.phase === 'flop') { state.community.push(state.deck.pop()!); state.phase = 'turn'; }
  else if (state.phase === 'turn') { state.community.push(state.deck.pop()!); state.phase = 'river'; }
}

function showdown(state: PokerState) {
  collectToPot(state);
  state.phase = 'showdown';
  state.reveal = true;
  state.toAct = -1;
  const contenders = state.players
    .map((p, i) => ({ i, p }))
    .filter(x => !x.p.folded);
  let best = -1;
  let label = '';
  let winners: number[] = [];
  for (const { i, p } of contenders) {
    const r = evaluate([...p.hole, ...state.community]);
    if (r.score > best) { best = r.score; winners = [i]; label = r.label; }
    else if (r.score === best) winners.push(i);
  }
  const share = Math.floor(state.pot / winners.length);
  for (const w of winners) state.players[w].chips += share;
  state.results = { winners, label };
  const names = winners.map(w => state.players[w].name).join(' & ');
  state.message = `${names} win ${state.pot} with ${label}`;
  state.pot = 0;
  state.phase = 'handover';
}

function awardLast(state: PokerState) {
  collectToPot(state);
  const w = state.players.findIndex(p => !p.folded);
  state.players[w].chips += state.pot;
  state.results = { winners: [w], label: 'others folded' };
  state.message = `${state.players[w].name} wins ${state.pot}`;
  state.pot = 0;
  state.phase = 'handover';
  state.toAct = -1;
  state.reveal = false;
}

// Advance the game after an action: end hand if only one left, else move to the
// next actor or open the next street.
function progress(state: PokerState) {
  if (activeCount(state) === 1) { awardLast(state); return; }

  const nxt = needsAction(state, state.toAct);
  if (nxt !== -1) { state.toAct = nxt; return; }

  // street complete
  collectToPot(state);
  // if <=1 player can still act (rest all-in), run out the board to showdown
  if (state.phase === 'river') { showdown(state); return; }
  dealStreet(state);
  // first to act post-flop is first active player left of the button
  const first = nextActive(state, state.button);
  // if nobody can act (all all-in), run the rest of the board to showdown
  if (first === -1 || state.players.filter(p => !p.folded && !p.allIn).length < 2) {
    runOut(state);
    return;
  }
  state.toAct = first;
}

// Everyone all-in: deal remaining streets then showdown.
function runOut(state: PokerState) {
  while (state.phase !== 'river' && state.phase !== 'showdown') dealStreet(state);
  showdown(state);
}

function clone(state: PokerState): PokerState {
  return {
    ...state,
    players: state.players.map(p => ({ ...p, hole: p.hole.slice() })),
    community: state.community.slice(),
    deck: state.deck.slice(),
    results: state.results ? { ...state.results, winners: state.results.winners.slice() } : null,
  };
}

export function useHoldem(wallet: WalletLike) {
  const [state, setState] = useState<PokerState>(() => {
    const players = newPlayers();
    players[0].chips = wallet.balance; // human stack = shared casino bankroll
    return {
      players,
      community: [],
      deck: [],
      pot: 0,
      phase: 'idle' as PokerPhase,
      button: 0,
      toAct: -1,
      currentBet: 0,
      minRaise: BB,
      message: 'Tap Deal to start the hand',
      results: null,
      reveal: false,
    };
  });
  const ref = useRef(state);
  ref.current = state;
  // wallet read inside memoized callbacks via ref; lastSync avoids redundant writes
  const walletRef = useRef(wallet);
  walletRef.current = wallet;
  const lastSyncRef = useRef(wallet.balance);

  // Push the human's live stack back to the shared wallet after every change.
  const syncWallet = (players: PokerPlayer[]) => {
    const chips = players[0].chips;
    if (chips !== lastSyncRef.current) {
      lastSyncRef.current = chips;
      walletRef.current.setBalance(chips);
    }
  };

  const commit = (next: PokerState) => { ref.current = next; setState(next); syncWallet(next.players); };

  const startHand = useCallback(() => {
    const cur = ref.current;
    // carry stacks across hands; human seat = bankroll, bots auto-rebuy when short
    const players = newPlayers(cur.players);
    players[0].chips = walletRef.current.balance;
    for (let i = 1; i < SEATS; i++) if (players[i].chips < BB) players[i].chips = START_CHIPS;
    lastSyncRef.current = players[0].chips;
    const deck = shuffled();
    const button = cur.phase === 'idle' ? 0 : (cur.button + 1) % SEATS;

    for (let i = 0; i < SEATS; i++) players[i].hole = [deck.pop()!, deck.pop()!];

    const sb = (button + 1) % SEATS;
    const bb = (button + 2) % SEATS;
    const post = (seat: number, amt: number) => {
      const pay = Math.min(amt, players[seat].chips);
      players[seat].chips -= pay;
      players[seat].committed = pay;
      if (players[seat].chips === 0) players[seat].allIn = true;
    };
    post(sb, SB);
    post(bb, BB);

    const next: PokerState = {
      players,
      community: [],
      deck,
      pot: 0,
      phase: 'preflop',
      button,
      toAct: (button + 3) % SEATS, // UTG acts first 4-handed
      currentBet: BB,
      minRaise: BB,
      message: 'Pre-flop',
      results: null,
      reveal: false,
    };
    sfx.deal();
    commit(next);
  }, []);

  // ---- action application (shared by human + bots) ----
  const apply = (seat: number, action: 'fold' | 'check' | 'call' | 'raise', raiseTo?: number) => {
    const s = clone(ref.current);
    if (s.toAct !== seat) return;
    const p = s.players[seat];
    const toCall = s.currentBet - p.committed;

    if (action === 'fold') {
      p.folded = true; p.acted = true; p.lastAction = 'Fold';
      sfx.card();
    } else if (action === 'check') {
      if (toCall > 0) return; // illegal
      p.acted = true; p.lastAction = 'Check';
      sfx.card();
    } else if (action === 'call') {
      const pay = Math.min(toCall, p.chips);
      p.chips -= pay; p.committed += pay; p.acted = true;
      if (p.chips === 0) p.allIn = true;
      p.lastAction = pay === 0 ? 'Check' : 'Call';
      sfx.card();
    } else if (action === 'raise') {
      let target = raiseTo ?? s.currentBet + s.minRaise;
      const maxTarget = p.committed + p.chips;       // all-in ceiling
      target = Math.min(target, maxTarget);
      const minTarget = s.currentBet + s.minRaise;
      if (target < minTarget && target < maxTarget) target = minTarget;
      const add = target - p.committed;
      p.chips -= add; p.committed = target;
      if (p.chips === 0) p.allIn = true;
      s.minRaise = Math.max(s.minRaise, target - s.currentBet);
      s.currentBet = target;
      // a raise reopens the action for everyone else
      for (const q of s.players) if (q !== p && !q.folded && !q.allIn) q.acted = false;
      p.acted = true;
      p.lastAction = p.allIn ? 'All-in' : `Raise ${target}`;
      sfx.nice();
    }

    progress(s);
    if (s.phase === 'preflop' || s.phase === 'flop' || s.phase === 'turn' || s.phase === 'river') {
      s.message = s.phase[0].toUpperCase() + s.phase.slice(1);
    }
    commit(s);
  };

  // ---- bot brain ----
  const botAct = (seat: number) => {
    const s = ref.current;
    const p = s.players[seat];
    const toCall = s.currentBet - p.committed;
    const strength = s.community.length ? postStrength(p.hole, s.community) : preflopStrength(p.hole);
    const r = Math.random();
    const potNow = s.pot + s.players.reduce((a, q) => a + q.committed, 0);
    const raiseSize = () => {
      const want = s.currentBet + Math.max(s.minRaise, Math.round(potNow * (0.5 + r * 0.4)));
      return Math.min(want, p.committed + p.chips);
    };

    if (toCall === 0) {
      // can check or bet
      if (strength > 0.62 && r < 0.75) return apply(seat, 'raise', raiseSize());
      if (strength > 0.4 && r < 0.22) return apply(seat, 'raise', raiseSize()); // semi-bluff
      return apply(seat, 'check');
    }

    // facing a bet
    const potOdds = toCall / (potNow + toCall);
    if (strength > 0.82) {
      if (r < 0.6) return apply(seat, 'raise', raiseSize());
      return apply(seat, 'call');
    }
    if (strength > 0.5) {
      if (r < 0.12) return apply(seat, 'raise', raiseSize());
      if (potOdds < 0.45) return apply(seat, 'call');
      return r < 0.5 ? apply(seat, 'call') : apply(seat, 'fold');
    }
    if (strength > 0.3) {
      if (potOdds < 0.22 || r < 0.18) return apply(seat, 'call');
      return apply(seat, 'fold');
    }
    // weak: mostly fold, rare bluff
    if (toCall <= BB && r < 0.12) return apply(seat, 'call');
    if (r < 0.05) return apply(seat, 'raise', raiseSize()); // bluff
    return apply(seat, 'fold');
  };

  // drive bot turns
  useEffect(() => {
    const betting = state.phase === 'preflop' || state.phase === 'flop' || state.phase === 'turn' || state.phase === 'river';
    if (!betting) return;
    const seat = state.toAct;
    if (seat < 0) return;
    if (state.players[seat].isHuman) return;
    const t = setTimeout(() => botAct(seat), 850 + Math.random() * 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.toAct, state.phase]);

  // ---- human-facing helpers ----
  const human = state.players[0];
  const toCall = Math.max(0, state.currentBet - human.committed);
  const isHumanTurn =
    (state.phase === 'preflop' || state.phase === 'flop' || state.phase === 'turn' || state.phase === 'river') &&
    state.toAct === 0 && !human.folded && !human.allIn;

  const actions = {
    deal: startHand,
    fold: () => apply(0, 'fold'),
    check: () => apply(0, 'check'),
    call: () => apply(0, 'call'),
    raise: (to: number) => apply(0, 'raise', to),
  };

  return { state, isHumanTurn, toCall, minRaise: state.minRaise, bigBlind: BB, actions };
}
