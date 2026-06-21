import { useCallback, useRef, useState } from 'react';
import { PlayingCard, shuffled, handTotal } from '../shared/deck';
import { sfx } from '../../audio/audio';

export type BJPhase = 'betting' | 'dealing' | 'player' | 'dealer' | 'result';
export type BJOutcome = '' | 'blackjack' | 'win' | 'lose' | 'push' | 'bust';

export interface BJState {
  phase: BJPhase;
  player: PlayingCard[];
  dealer: PlayingCard[];
  holeHidden: boolean;     // dealer's 2nd card face-down until reveal
  bet: number;
  outcome: BJOutcome;
  message: string;
}

const CHIPS = [10, 25, 50, 100];

const initial: BJState = {
  phase: 'betting',
  player: [],
  dealer: [],
  holeHidden: true,
  bet: 0,
  outcome: '',
  message: 'Place your bet',
};

// Texas-felt single-deck blackjack vs a stand-on-17 dealer. Stakes are drawn
// from the shared casino wallet: `balance` is the live bankroll and `onDelta`
// pushes each hand's net win/loss back to the wallet.
export function useBlackjack(balance: number, onDelta: (delta: number) => void) {
  const [state, setState] = useState<BJState>(initial);
  const deckRef = useRef<PlayingCard[]>([]);
  const busyRef = useRef(false);
  // latest bankroll + sink, read inside setState callbacks (which are memoized)
  const balRef = useRef(balance);
  balRef.current = balance;
  const deltaRef = useRef(onDelta);
  deltaRef.current = onDelta;

  const settleWallet = (delta: number) => {
    if (delta !== 0) deltaRef.current(delta);
    if (delta > 0) sfx.win(); else if (delta < 0) sfx.lose();
  };

  const draw = (): PlayingCard => {
    if (deckRef.current.length < 6) deckRef.current = shuffled();
    return deckRef.current.pop()!;
  };

  const addChip = useCallback((amt: number) => {
    setState(s => {
      if (s.phase !== 'betting') return s;
      if (s.bet + amt > balRef.current) return s;
      sfx.click();
      return { ...s, bet: s.bet + amt };
    });
  }, []);

  const clearBet = useCallback(() => {
    setState(s => (s.phase === 'betting' ? { ...s, bet: 0 } : s));
  }, []);

  const settle = useCallback((player: PlayingCard[], dealer: PlayingCard[], bet: number) => {
    const p = handTotal(player).total;
    const d = handTotal(dealer).total;
    let outcome: BJOutcome;
    let delta = 0;
    if (p > 21) { outcome = 'bust'; delta = -bet; }
    else if (d > 21 || p > d) { outcome = 'win'; delta = bet; }
    else if (p < d) { outcome = 'lose'; delta = -bet; }
    else { outcome = 'push'; delta = 0; }
    settleWallet(delta);
    const msg = outcome === 'win' ? `You win +${delta}`
      : outcome === 'bust' ? 'Bust! Dealer wins'
      : outcome === 'lose' ? 'Dealer wins'
      : 'Push — bet returned';
    setState(s => ({ ...s, phase: 'result', holeHidden: false, outcome, message: msg }));
    busyRef.current = false;
  }, []);

  // Dealer draws to 17 then settle, with a small delay per card for animation.
  const playDealer = useCallback((player: PlayingCard[], dealerStart: PlayingCard[], bet: number) => {
    const dealer = dealerStart.slice();
    setState(s => ({ ...s, phase: 'dealer', holeHidden: false, dealer: dealer.slice(), message: "Dealer's turn" }));
    const step = () => {
      const { total } = handTotal(dealer);
      if (total < 17) {
        dealer.push(draw());
        sfx.card();
        setState(s => ({ ...s, dealer: dealer.slice() }));
        setTimeout(step, 650);
      } else {
        setTimeout(() => settle(player, dealer, bet), 500);
      }
    };
    setTimeout(step, 650);
  }, [settle]);

  const deal = useCallback(() => {
    setState(s => {
      if (s.phase !== 'betting' && s.phase !== 'result') return s;
      const bet = s.bet > 0 ? s.bet : Math.min(25, balRef.current);
      if (bet <= 0 || bet > balRef.current) return s;
      busyRef.current = true;
      if (deckRef.current.length < 12) deckRef.current = shuffled();
      const player = [draw(), draw()];
      const dealer = [draw(), draw()];
      sfx.card();
      const pt = handTotal(player).total;
      const dt = handTotal(dealer).total;
      // naturals resolve immediately
      if (pt === 21 || dt === 21) {
        setTimeout(() => {
          let outcome: BJOutcome; let delta = 0; let msg = '';
          if (pt === 21 && dt === 21) { outcome = 'push'; msg = 'Both blackjack — push'; }
          else if (pt === 21) { outcome = 'blackjack'; delta = Math.round(bet * 1.5); msg = `Blackjack! +${delta}`; }
          else { outcome = 'lose'; delta = -bet; msg = 'Dealer blackjack'; }
          settleWallet(delta);
          setState(x => ({ ...x, phase: 'result', holeHidden: false, outcome, message: msg }));
          busyRef.current = false;
        }, 700);
      }
      return {
        ...s,
        phase: pt === 21 || dt === 21 ? 'dealing' : 'player',
        player, dealer, holeHidden: true, bet, outcome: '',
        message: pt === 21 || dt === 21 ? 'Checking…' : 'Hit or Stand?',
      };
    });
  }, []);

  const hit = useCallback(() => {
    setState(s => {
      if (s.phase !== 'player') return s;
      const player = [...s.player, draw()];
      sfx.card();
      const { total } = handTotal(player);
      if (total > 21) {
        settleWallet(-s.bet);
        busyRef.current = false;
        return { ...s, player, phase: 'result', holeHidden: false, outcome: 'bust', message: 'Bust! Dealer wins' };
      }
      return { ...s, player, message: total === 21 ? 'Stand?' : 'Hit or Stand?' };
    });
  }, []);

  const stand = useCallback(() => {
    setState(s => {
      if (s.phase !== 'player') return s;
      playDealer(s.player, s.dealer, s.bet);
      return { ...s, phase: 'dealer', holeHidden: false, message: "Dealer's turn" };
    });
  }, [playDealer]);

  // back to betting for the next hand
  const nextHand = useCallback(() => {
    setState(s => (s.phase === 'result' ? { ...initial, bet: 0 } : s));
  }, []);

  return { state, chips: CHIPS, actions: { addChip, clearBet, deal, hit, stand, nextHand } };
}
