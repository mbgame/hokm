import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { OrbitControls, PerspectiveCamera, useTexture, Environment, Lightformer } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { ATLAS_URL } from '../card/atlasLayout';
import { Vector3 } from 'three';
import { shuffle } from '../../utils/shuffle';
import { cardData } from '../../mockData/cards';
import { dealerAnim } from '../../mockData/animations';
import { randNumber } from '../../utils/randNumber';
import Card from '../card/card';
import SpotLightWithHelper from '../lights/spotLightHelper';
import Floor from '../floor';
import Table from '../table';
import HokmSelector from '../hokmSelector/hokmSelector';
import PlayersName from '../playersName/playersName';
import GameText from '../gameText/gameText';
import Backdrop from '../shaders/backdrop';
import Burst from '../shaders/burst';
import Confetti from '../shaders/confetti';
import GameHud, { type Quality } from '../gameHud/gameHud';
import StartOverlay from '../startOverlay/startOverlay';
import { initAudio, resumeAudio, sfx } from '../../audio/audio';
import { chooseCard, chooseTrump } from '../../game/bot';
import { trickWinner, legalCards, beats } from '../../game/rules';
import { teamOf, type Suit, type GameState, type Play } from '../../game/types';

// Warm the texture cache at module load (during the loading screen) so mounting
// the deck / hokm selector / floor never suspends the canvas mid-game — that
// suspense was the "blink" right after tapping Start.
useTexture.preload(ATLAS_URL);
['heart', 'spade', 'club', 'diamond'].forEach(s => useTexture.preload(`/textures/hokm/${s}.png`));
useTexture.preload('/textures/floor2/albedo.png');
useTexture.preload('/textures/floor2/normal.png');

type AnimStep = { rotation: [number, number, number]; position: [number, number, number] };

// Layout for the human's 13-card hand (deck indices 0..12), dealt left→right so
// the starter cards read naturally in front of the camera. Phones/portrait use
// two shorter rows so the hand doesn't overflow the screen. Returns the full
// 52-entry deal animation with only the human seat replaced.
function buildHumanDeal(small: boolean): AnimStep[] {
  const ROT: [number, number, number] = [-Math.PI / 2, 0, Math.PI / 2];
  const Z = 1.0;
  const Z_OFFSET = 0; // hand centered
  const human: AnimStep[] = [];

  if (small) {
    const ROW0 = 7; // front row holds 7, back row holds 6
    const rows = [
      { x: -7.0, count: ROW0, start: 0 },
      { x: -8.4, count: 13 - ROW0, start: ROW0 },
    ];
    rows.forEach(r => {
      const zStart = -((r.count - 1) / 2) * Z + Z_OFFSET; // index 0 at most-negative z (screen left)
      for (let k = 0; k < r.count; k++) {
        const i = r.start + k;
        human[i] = { rotation: ROT, position: [r.x, 5 + i / 300, zStart + k * Z] };
      }
    });
  } else {
    const zStart = -((13 - 1) / 2) * Z + Z_OFFSET; // index 0 on the left
    for (let i = 0; i < 13; i++) {
      human[i] = { rotation: ROT, position: [-7, 5 + i / 300, zStart + i * Z] };
    }
  }

  return dealerAnim.map((step, i) => (i < 13 ? human[i] : (step as AnimStep)));
}

// Pool of realistic names for the three bots (seat 0 is always "You").
const NAME_POOL = ['Ava', 'Liam', 'Mia', 'Noah', 'Sara', 'Reza', 'Omid', 'Nima', 'Leo', 'Kai', 'Sofia', 'Hugo', 'Yusuf', 'Lena', 'Arman', 'Dina'];

// True on narrow / portrait viewports where a 13-card row would overflow.
const isSmallScreen = () =>
  typeof window !== 'undefined' && (window.innerWidth < 820 || window.innerHeight > window.innerWidth);

interface Card {
    type: 'spades' | 'hearts' | 'clubs' | 'diamonds';
    number: 'ace' | 'king' | 'queen' | 'jack' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';
    value:number;
  }

const Scene: React.FC = () => {
    const [animationIndex, setAnimationIndex] = React.useState<number>(-1);
    const [animation, setAnimation] = React.useState(dealerAnim);
    const [reserveAnimation, setReserveAnimation] = React.useState(dealerAnim);
    const [gameIndex,setGameIndex] = React.useState<number>(0);
    const [winnerCardIndex,setWinnerCardIndex] = React.useState<Array<number>>([]);
    const [currentSet,setCurrentSet] = React.useState<boolean>(false);
    const [playerCardSets,setPlayerCardSets] = React.useState<any>([]);
    const [playedCardSets,setPlayedCardSets] = React.useState<any>([]);
    const [hokm,selectHokm] = React.useState('');
    const [helperIndex,setHelperIndex] = React.useState(0);
    // Court Piece team trick counts: index 0 = you + partner (seats 0,2),
    // index 1 = opponents (seats 1,3). Used to decide the hand (7+ tricks).
    const [teamTricks,setTeamTricks] = React.useState<[number,number]>([0,0]);
    // match score: games won per team. First team to MATCH_TARGET games wins.
    const [gamesWon,setGamesWon] = React.useState<[number,number]>([0,0]);
    const [gameOver,setGameOver] = React.useState<boolean>(false);   // a game (7 tricks) ended
    const [matchOver,setMatchOver] = React.useState<boolean>(false); // a team reached 7 games
    const [winningTeam,setWinningTeam] = React.useState<0 | 1>(0);
    const [resultBadge,setResultBadge] = React.useState<string>('');
    const teamTricksRef = React.useRef<[number,number]>([0,0]);
    const gamesWonRef = React.useRef<[number,number]>([0,0]);
    const TRICK_TARGET = 7;
    const MATCH_TARGET = 7;

    // restore match score across reloads
    React.useEffect(() => {
      try {
        const saved = localStorage.getItem('hokm_match');
        if (saved) {
          const gw = JSON.parse(saved) as [number,number];
          gamesWonRef.current = gw;
          setGamesWon(gw);
        }
      } catch {}
    }, []);
    const persistGames = (gw: [number,number]) => {
      try { localStorage.setItem('hokm_match', JSON.stringify(gw)); } catch {}
    };
    // true only while it is the human's (seat 0) turn to play.
    const [humanTurn,setHumanTurn] = React.useState<boolean>(false);
    // suit led in the current trick (null when nobody has played yet / human leads).
    const [ledSuitState,setLedSuitState] = React.useState<Suit | null>(null);
    // keys ("type-number") of the cards the human may legally play this turn,
    // computed from the true hand (handsRef) the moment their turn starts.
    const [humanLegal,setHumanLegal] = React.useState<Set<string>>(new Set());
    // false until the first card of the current game is played (gates Sort).
    const [played,setPlayed] = React.useState<boolean>(false);
    // graphic quality -> renderer pixel ratio (perf vs sharpness)
    const QUALITY_DPR: Record<Quality, number> = { low: 1, medium: 1.5, high: 2 };
    const [quality,setQuality] = React.useState<Quality>(() => {
      try {
        const q = localStorage.getItem('hokm_quality');
        if (q === 'low' || q === 'medium' || q === 'high') return q;
      } catch {}
      return 'medium';
    });
    const setDpr = useThree(s => s.setDpr);
    React.useEffect(() => { setDpr(QUALITY_DPR[quality]); }, [quality]);
    const onQuality = (q: Quality) => {
      setQuality(q);
      try { localStorage.setItem('hokm_quality', q); } catch {}
    };
    // true while the settings popup is open -> freeze camera/orbit so slider
    // drags don't move the camera.
    const [settingsOpen,setSettingsOpen] = React.useState<boolean>(false);
    // transient "nice move" shockwave on the table (keyed so each one remounts).
    const [burst,setBurst] = React.useState<{ id: number; pos: [number, number, number] } | null>(null);
    // confetti shown for a few seconds after the human's team wins a game.
    const [celebrate,setCelebrate] = React.useState<boolean>(false);
    // mutable per-trick scratch shared across the staggered setTimeout chain.
    // HAKEM = the player who calls trump and leads the first trick. Game 1 is
    // the human (seat 0). After a game the hakem keeps the role if their team
    // won, otherwise it passes one seat clockwise.
    const [hakem,setHakem] = React.useState<number>(0);
    const hakemRef = React.useRef<number>(0);
    const leaderRef = React.useRef<number>(0);          // seat that leads current trick
    const trickRef = React.useRef<Play[]>([]);          // plays committed this trick
    // single source of truth for live hands, mutated in place as cards are
    // played. Never rebuilt from React state (which lags a render behind).
    const handsRef = React.useRef<Card[][]>([]);
    // refs used by the auto-collect chain (state setters are async, so the
    // collect step must not read stale state captured in the same tick)
    const winnerIdxRef = React.useRef<number[]>([]);    // deck indices of the trick just won
    const reserveAnimRef = React.useRef<any>(dealerAnim); // animation moving the trick to the pile
      const shuffleCards = React.useMemo(() => {
        return shuffle(cardData);
        }, []);
        const [cards, setCards] = React.useState(shuffleCards);
        const cardsRef = React.useRef(shuffleCards); // latest deck for deal-layout
        // seat 0 = You; bots get random distinct names (fixed for the session)
        const playerNames = React.useMemo<[string, string, string, string]>(() => {
          const pool = [...NAME_POOL];
          const pick = () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
          return ['You', pick(), pick(), pick()];
        }, []);


      React.useEffect(()=>{
        const playerCards: any = [];
        for (let i = 0; i < 4; i++) {
            playerCards.push(cards.slice(i * 13, (i + 1) * 13));
        }
        setPlayerCardSets(playerCards);
        setPlayedCardSets(playerCards);
        // live hands = independent mutable copy (playerCardSets stays the stable
        // original deal used for animation slot lookup in animIndexOf).
        handsRef.current = playerCards.map((h: Card[]) => h.slice());
        cardsRef.current = cards;
      },[cards])



  const handleAnimationComplete = () => {
    if(gameIndex === 0){
        sfx.deal();   // card flick on each dealt card

        if(!hokm){
            if(animationIndex >=0 && animationIndex <4){
                setAnimationIndex(animationIndex + 1);
            }
            else if(animationIndex === 4){
                setAnimationIndex(13);
            }
    
            if(animationIndex >=13 && animationIndex <17){
                setAnimationIndex(animationIndex + 1);
            }
            else if(animationIndex === 17){
                setAnimationIndex(26);
            }
            if(animationIndex >=26 && animationIndex <30){
                setAnimationIndex(animationIndex + 1);
            }
            else if(animationIndex === 30){
                setAnimationIndex(39)
            }
    
            if(animationIndex >=39 && animationIndex <43){
                setAnimationIndex(animationIndex + 1);
            }
            else if(animationIndex === 43){
                setAnimationIndex(-1);
            }

        }
        else{
            setAnimationIndex(animationIndex + 1);
        }
       
        
        if(animationIndex === 51){
            setGameIndex(1);
            setAnimationIndex(-1);
        }
    }
   
  };

  const winnerCardCollector = (winner:string,playerCards:Array<Card>) => {
    type AnimationStep = {
        rotation: [number, number, number];
        position: [number, number, number];
      };
      
    type PlayAnimation = Array<AnimationStep>;
    let newAnimation: PlayAnimation = [...animation];
    
    let winnerCardsIndex:Array<number> = [];
    playerCards.map(card=>{
        winnerCardsIndex.push(cards.findIndex(item=>item.type === card.type && item.number === card.number));
    })

    winnerCardsIndex.map((cardIndex,index)=>{
        newAnimation[cardIndex] = {
            rotation : [(-Math.PI/ 2),Math.PI,  ( Math.PI/2)],
            position: [4,5 + index/300,3.5]
            }
    })

    reserveAnimRef.current = newAnimation;
    winnerIdxRef.current = winnerCardsIndex;
    setReserveAnimation(newAnimation);
    setWinnerCardIndex(winnerCardsIndex);
    setAnimationIndex(-1);

  }

  const collectCard = () => {
    if (gameOver) return; // game finished; leave the result on screen
    const idxs = winnerIdxRef.current;           // read from refs, never stale
    sfx.sweep();
    setAnimation(reserveAnimRef.current);
    setAnimationIndex(-1);

    setTimeout(() => {
      for (let i = 0; i < idxs.length; i++) {
        // Use a closure to capture the current index for each timeout
        (function(index) {
          setTimeout(() => {
            setAnimationIndex(idxs[index]);
            if (index === 0) {
              setHelperIndex(3); // back to the play camera
            }
          }, index * 100); // Adjust delay based on index
        })(i);
      }
      // After the pile is collected, the trick winner leads the next trick.
      setTimeout(() => beginTrick(leaderRef.current), idxs.length * 100 + 300);
    }, 100); // Initial delay
  };

  // Global deck index (= Card component key) for a card, so it can be animated.
  // playerCardSets keeps the original 13-card slots per seat (stable), so
  // animationIndex = 13 * seat + slot.
  const animIndexOf = (card: Card): number => {
    for (let seat = 0; seat < 4; seat++) {
      const slot = playerCardSets[seat].findIndex(
        (c: Card) => c.type === card.type && c.number === card.number,
      );
      if (slot >= 0) return 13 * seat + slot;
    }
    return -1;
  };

  const trumpSuit = () => (hokm || null) as Suit | null;

  const cardKey = (c: Card) => `${c.type}-${c.number}`;

  const botView = (remaining: Card[][], plays: Play[]): GameState =>
    ({ hands: remaining, currentTrick: plays.slice(), trump: trumpSuit() } as unknown as GameState);

  // A "nice move": the card overtakes a trick an OPPONENT was winning, either by
  // cutting in with trump (off-suit ruff) or slamming a king/ace on top. Used to
  // reward slick plays with an encouraging sound + a shockwave on the table.
  const niceMove = (card: Card, plays: Play[], player: number): boolean => {
    if (plays.length === 0) return false;
    const trump = trumpSuit();
    if (!beats(card as any, plays, trump)) return false;
    const prevWinner = trickWinner(plays, trump);
    const stoleFromOpponent = teamOf(player as 0 | 1 | 2 | 3) !== teamOf(prevWinner as 0 | 1 | 2 | 3);
    const led = plays[0].card.type;
    const trumpCut = !!trump && card.type === (trump as any) && led !== trump;
    const bigCard = card.value >= 13; // king or ace
    return stoleFromOpponent && (trumpCut || bigCard);
  };

  // Fire the encourage SFX + a one-shot shockwave ring where the cards land.
  const triggerNice = () => {
    sfx.nice();
    setBurst({ id: Date.now(), pos: [0, 4.75, 0] });
  };

  // Resolve a completed 4-card trick: pick winner (trump + team rules), animate
  // the pile toward the winner, tally team tricks. Auto-continues to the next
  // trick; only stops to show the result screen when a team reaches 7 tricks.
  const resolveTrick = (plays: Play[]) => {
    setPlayedCardSets(handsRef.current.map(h => h.slice()));

    const orderedCards = [0, 1, 2, 3].map(p => plays.find(t => t.player === p)!.card);
    const winnerSeat = trickWinner(plays, trumpSuit());
    leaderRef.current = winnerSeat;                 // winner leads the next trick
    winnerCardCollector('player' + (winnerSeat + 1), orderedCards);

    const tt: [number, number] = [...teamTricksRef.current] as [number, number];
    tt[teamOf(winnerSeat as 0 | 1 | 2 | 3)] += 1;
    teamTricksRef.current = tt;
    setTeamTricks(tt);

    const gameDone = tt[0] >= TRICK_TARGET || tt[1] >= TRICK_TARGET || tt[0] + tt[1] === 13;
    if (!gameDone) {
      // brief beat so the player sees the trick, then collect + next trick
      setTimeout(() => collectCard(), 1200);
      return;
    }

    // A game is won. Update match score, decide kot/baavni, maybe end the match.
    const winTeam: 0 | 1 = tt[0] > tt[1] ? 0 : 1;
    const top = Math.max(tt[0], tt[1]);
    const bottom = Math.min(tt[0], tt[1]);
    const badge = top === 13 ? 'BAAVNI' : bottom === 0 ? 'KOT' : '';

    const gw: [number, number] = [...gamesWonRef.current] as [number, number];
    gw[winTeam] += 1;
    gamesWonRef.current = gw;
    setGamesWon(gw);
    persistGames(gw);

    // Hakem for the next game: stays if the hakem's team won, else passes one
    // seat clockwise.
    const curHakem = hakemRef.current;
    const newHakem = winTeam === teamOf(curHakem as 0 | 1 | 2 | 3) ? curHakem : (curHakem + 1) % 4;
    hakemRef.current = newHakem;
    setHakem(newHakem);

    setWinningTeam(winTeam);
    setResultBadge(badge);
    setMatchOver(gw[winTeam] >= MATCH_TARGET);
    setGameOver(true);
    if (winTeam === 0) {
      sfx.cheer();
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 4000); // confetti runs ~4s then clears
    } else {
      sfx.lose();
    }
  };

  // Play one bot card for `seat` and schedule its fly-to-center animation.
  const playBot = (plays: Play[], seat: number, delay: number) => {
    setPlayed(true);
    const hands = handsRef.current;
    const card = chooseCard(botView(hands, plays), seat as 0 | 1 | 2 | 3);
    const nice = niceMove(card as Card, plays, seat);
    plays.push({ player: seat as 0 | 1 | 2 | 3, card });
    hands[seat] = hands[seat].filter((c: Card) => c !== card);
    const idx = animIndexOf(card);
    setTimeout(() => { setAnimationIndex(idx); sfx.card(); if (nice) triggerNice(); }, delay);
  };

  // Start a trick led by `leaderSeat`. Bots before the human auto-play; then we
  // hand control to the human. If the human leads, we wait immediately.
  const beginTrick = (leaderSeat: number) => {
    leaderRef.current = leaderSeat;
    const plays: Play[] = [];
    trickRef.current = plays;

    setHumanTurn(false);
    setCurrentSet(true);

    let seat = leaderSeat;
    let delay = 0;
    while (seat !== 0 && plays.length < 4) {
      delay += 1000;
      playBot(plays, seat, delay);
      seat = (seat + 1) % 4;
    }

    const led: Suit | null = plays.length ? plays[0].card.type : null;
    setTimeout(() => {
      setLedSuitState(led);
      // legal cards derived from the actual remaining hand + the trick so far
      const legal = legalCards(handsRef.current[0] || [], trickRef.current);
      setHumanLegal(new Set(legal.map(cardKey)));
      setHumanTurn(true);     // human's turn to play (lead or follow)
      setCurrentSet(false);
    }, delay + 200);
  };

  // Human (seat 0) commits a card; bots after the human auto-play; trick resolves.
  const setPlayerCard = (type: Suit, number: Card['number']) => {
    if (!humanTurn) return;
    setPlayed(true);
    setHumanTurn(false);
    setCurrentSet(true);

    const hands = handsRef.current;
    const plays = trickRef.current;
    const humanCard = hands[0].find((c: Card) => c.type === type && c.number === number) as Card;
    if (!humanCard) { setHumanTurn(true); setCurrentSet(false); return; } // re-enable, never stall

    const nice = niceMove(humanCard, plays, 0);
    plays.push({ player: 0, card: humanCard });
    hands[0] = hands[0].filter((c: Card) => c !== humanCard);
    setPlayedCardSets(hands.map(h => h.slice()));

    // Throw the card to the table center. Sort rewrites animation[0..12] to the
    // hand-slot positions, so we must give the played card an explicit center
    // target here instead of reusing the (possibly stale) animation entry —
    // otherwise it would "animate" to its own slot and appear not to move.
    const idx = animIndexOf(humanCard);
    setAnimation(prev => {
      const next = prev.map((s: any) => ({ rotation: [...s.rotation], position: [...s.position] }));
      next[idx] = {
        rotation: [-Math.PI / 2, 0, (idx + 1) * (Math.PI / 2)],
        position: [randNumber(-2, 2), 5 + idx / 300, randNumber(-2, 2)],
      };
      return next as typeof prev;
    });
    setAnimationIndex(idx);
    sfx.card();
    if (nice) setTimeout(triggerNice, 250); // sync the cheer with the card landing

    let seat = (leaderRef.current + plays.length) % 4;
    let delay = 0;
    while (plays.length < 4) {
      delay += 1000;
      playBot(plays, seat, delay);
      seat = (seat + 1) % 4;
    }

    setTimeout(() => resolveTrick(plays), delay + 1000);
  };

  const startDealing = () => {
    // deal human hand left→right; two rows on phones so it fits the screen
    setAnimation(buildHumanDeal(isSmallScreen()));
    setHelperIndex(1);
    setAnimationIndex(0);
  }

  // Start button: a user gesture, so this is where audio is unlocked/started.
  const onStart = () => {
    initAudio();
    resumeAudio();
    sfx.click();
    startDealing();
  };
  const startPlaying = () => {
    setAnimationIndex(-1);
  }

  // Display-only sort: re-arrange the human's own cards into sorted slots by
  // animating them — never reorders the `cards` array or touches other seats'
  // hands, so it's safe and never resurrects played cards.
  const reorderCards = () => {
    const hand: Card[] = handsRef.current[0] || [];
    if (gameIndex !== 1 || hand.length === 0) return;
    sfx.click();
    const typeOrder = ['clubs', 'diamonds', 'hearts', 'spades'];
    const sorted = [...hand].sort(
      (a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type) || a.value - b.value,
    );
    const slots = buildHumanDeal(isSmallScreen());            // physical hand slots 0..12 (left→right)
    const next = animation.map((s: any) => ({ rotation: [...s.rotation], position: [...s.position] }));
    const targets: number[] = [];
    // Only the human's 13 cards live at deck indices 0..12 — search ONLY there so
    // no other seat's card can ever be moved.
    const humanDeck = cards.slice(0, 13);
    sorted.forEach((card, j) => {
      const d = humanDeck.findIndex((c: Card) => c.type === card.type && c.number === card.number);
      if (d < 0) return;
      next[d] = { rotation: slots[j].rotation, position: slots[j].position };
      targets.push(d);
    });
    setAnimation(next as typeof animation);
    targets.forEach((d, k) => setTimeout(() => setAnimationIndex(d), k * 60));
  }

  // Reset the board for a fresh game (new deal + trump call). Keeps match score.
  const resetBoardForNewGame = () => {
    teamTricksRef.current = [0, 0];
    setTeamTricks([0, 0]);
    setGameOver(false);
    setMatchOver(false);
    setResultBadge('');
    setHumanTurn(false);
    setCurrentSet(true);
    setLedSuitState(null);
    setPlayed(false);                       // sorting allowed again until first play
    leaderRef.current = hakemRef.current;   // hakem leads the new game's first trick
    trickRef.current = [];
    handsRef.current = [];
    setWinnerCardIndex([]);
    selectHokm('');
    setAnimation(dealerAnim);
    setReserveAnimation(dealerAnim);
    setCards(shuffle([...cardData]));   // reshuffle -> re-deals via the cards effect
    setGameIndex(0);
    setTimeout(() => startDealing(), 200);
  };

  // Gather EVERY card (last trick + any cards still in hands when the game ended
  // at 7 tricks) into the dealer pile, then run `after` (reshuffle + deal). Done
  // while gameIndex is still 1 so handleAnimationComplete's deal state-machine
  // stays idle.
  const startNextRound = (after: () => void) => {
    setGameOver(false);  // hide result modal
    const pile: AnimStep[] = Array.from({ length: 52 }, (_, i) => ({
      rotation: [-Math.PI / 2, Math.PI, Math.PI / 2],
      position: [4, 5 + i / 200, 3.5],
    }));
    setAnimation(pile as typeof animation);
    const STEP = 35; // > one frame (~16ms) so every card's gsap tween actually starts
    for (let i = 0; i < 52; i++) {
      ((idx) => setTimeout(() => setAnimationIndex(idx), idx * STEP))(i);
    }
    setTimeout(() => { setAnimationIndex(-1); after(); }, 52 * STEP + 700);
  };

  const nextGame = () => { sfx.click(); sfx.sweep(); startNextRound(resetBoardForNewGame); };

  const playAgain = () => {
    sfx.click();
    startNextRound(() => {
      gamesWonRef.current = [0, 0];
      setGamesWon([0, 0]);
      persistGames([0, 0]);
      hakemRef.current = 0;      // new match -> human is hakem again
      setHakem(0);
      resetBoardForNewGame();
    });
  };

  React.useEffect(() => {
    if (gameIndex === 1) {
      console.log("The game started!"); // Consistent message format
      startPlaying();

      type AnimationStep = {
        rotation: [number, number, number];
        position: [number, number, number];
        };
      type PlayAnimation = Array<AnimationStep>;

      // Create animation steps outside the loop for efficiency
      const animationSteps: PlayAnimation = Array.from({ length: 52 }, (_, i) => ({
        rotation: [(-Math.PI / 2), 0, (i + 1) * (Math.PI / 2)],
        position: [randNumber(-2, 2), 5 + i / 300, randNumber(-2, 2)],
      }));
  
      setAnimation(animationSteps);

      // The hakem (who called trump) leads the first trick.
      setTimeout(() => beginTrick(hakemRef.current), 500);
    }
  }, [gameIndex]);

  // When the hakem is a bot, it auto-calls trump once the initial cards are
  // dealt (the deal pauses at animationIndex -1, helperIndex 1, hokm unset).
  React.useEffect(() => {
    if (gameIndex === 0 && !hokm && helperIndex === 1 && animationIndex === -1 && hakemRef.current !== 0) {
      const hand = handsRef.current[hakemRef.current] || [];
      if (hand.length) {
        const suit = chooseTrump(hand.slice(0, 5));
        const t = setTimeout(() => handleHokm(suit), 900);
        return () => clearTimeout(t);
      }
    }
  }, [gameIndex, hokm, helperIndex, animationIndex]);

  const handleHokm = (hokm:string) => {
    sfx.click();
    selectHokm(hokm);
    setAnimationIndex(0);
    setHelperIndex(3);
  }

  // useFrame(({ camera }, delta) => {
  //   if (helperIndex === 0) {
  //       let target = new Vector3(-15,15,15)
  //     camera.position.lerp(target,0.03);
  //     camera.lookAt(0, 0, 0);
  //   }

  //   if (helperIndex === 1) {
  //       let target = new Vector3(-13,12,-5)
  //       camera.position.lerp(target,0.01);
  //       camera.lookAt(-8,8,-5)
  //     }

  //     if (helperIndex === 2) {
  //       let target = new Vector3(-10,12,-5)
  //       camera.position.lerp(target,0.08);
  //       camera.lookAt(-5,8,-5)
  //     }

  //     if (helperIndex === 3) {
  //       let target = new Vector3(-13,12,0)
  //       camera.position.lerp(target,0.08);
  //       camera.lookAt(0,2,-0)
  //     }



  // });

  useFrame(({ camera, size }) => {
    const cameraPositions = [
      new Vector3(-15, 15, 15),
      new Vector3(-14, 12, -3),   // deal/hokm: framed on the player's cards
      new Vector3(-10, 12, -5),
      new Vector3(-13, 12, 0)
    ];

    const cameraTargets = [
      new Vector3(0, 0, 0),
      new Vector3(-6, 4, -4),     // look at the human hand row
      new Vector3(-5, 8, -5),
      new Vector3(0, 2, 0)
    ];

    const lerpFactor = 0.04; // smoothness of the camera movement

    // On the player's turn let them orbit the table freely (OrbitControls drives
    // the camera; don't fight it).
    if (gameIndex === 1 && humanTurn && !gameOver) return;

    if (helperIndex >= 0 && helperIndex < cameraPositions.length) {
      // On narrow / portrait screens (phones) pull the camera back so the whole
      // table and all four hands stay in frame.
      const aspect = size.width / Math.max(1, size.height);
      const zoom = aspect < 1 ? Math.min(2.4, Math.max(1, 1 / aspect)) : 1;
      const target = cameraTargets[helperIndex].clone();
      const base = cameraPositions[helperIndex].clone();
      // Phones: nudge the deal/hokm shot right so all 5 starter cards + the hokm
      // selector are visible.
      if (helperIndex === 1 && aspect < 1) { target.z += 5; base.z += 5; }
      const scaled = target.clone().add(base.clone().sub(target).multiplyScalar(zoom));
      camera.position.lerp(scaled, lerpFactor);
      camera.lookAt(target);
    }
  });

  // A human card is clickable only on the human's turn and only if it is in the
  // pre-computed legal set (true hand + follow-suit rule). Derived from handsRef
  // so it can never disagree with what setPlayerCard will accept.
  const canPlayCard = (card: Card): boolean => humanTurn && humanLegal.has(cardKey(card));


  return (
    <>
        {/* shader backdrop dome (gradient + slow drift) replaces the flat color ------------*/}
        <Backdrop />

        {/* procedural reflection env (baked once, no HDR download) -> soft PBR sheen on
            cards + felt. resolution low + frames=1 keeps it near-free. ------------------*/}
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={2.0} color="#fff6e6" position={[0, 14, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[24, 24, 1]} />
          <Lightformer form="rect" intensity={0.7} color="#bfe9ff" position={[-12, 6, 10]} scale={[10, 10, 1]} />
          <Lightformer form="rect" intensity={0.6} color="#ffe6b0" position={[12, 6, -10]} scale={[10, 10, 1]} />
        </Environment>

        {/* "nice move" shockwave + game-win confetti (shader VFX) ---------------------------*/}
        {burst && <Burst key={burst.id} position={burst.pos} onDone={() => setBurst(null)} />}
        {celebrate && <Confetti />}

        {/* default camera of scene ---------------------------------------------------------*/}
        <PerspectiveCamera makeDefault position={[ -50 , 30, -50]}  />

        {/* world light system --------------------------------------------------------------*/}
        <ambientLight color ="white" intensity={0.3} />
        <SpotLightWithHelper  position ={ [0, 15, 0]} intensity={70} distance={18} angle ={ 0.9} power={32}  />
        {/* <SpotLightWithHelper   position ={ [30, 15, 0]} intensity={300} distance={40} angle ={ 0.6} power={400}  /> */}
        <SpotLightWithHelper  position ={ [-30, 15, 0]} intensity={300} distance={40} angle ={ 0.6} power={400}  />

        {/* orbit enabled only on the player's turn, so they can look around the table */}
        <OrbitControls
          enabled={gameIndex === 1 && humanTurn && !gameOver && !settingsOpen}
          enablePan={false}
          enableDamping
          dampingFactor={0.1}
          minDistance={10}
          maxDistance={48}
          maxPolarAngle={Math.PI / 2.15}
          target={[0, 2, 0]}
        />

        {/* gamish 2D start screen ------------------------------------------------------------*/}
        {gameIndex === 0 && helperIndex === 0 && <StartOverlay onStart={onStart} />}

        {/* add Game Texts to scene ----------------------------------------------------------*/}
        <GameText helperIndex={helperIndex} startDealing={startDealing} collectCard={collectCard} reorderCards={reorderCards} canSort={gameIndex === 1 && !played} />

        {/* add Players Name to scene ---------------------------------------------------------*/}
        <PlayersName names={playerNames} />

        {/* add Hokm selector to scene --------------------------------------------------------*/}
        {helperIndex === 1 && hakem === 0 && <HokmSelector handleHokm={handleHokm} />  }

        {/* HUD: scoreboard + sort + mute + result modal (one DOM overlay) -------------------*/}
        { helperIndex >= 1 && <GameHud
            gamesWon={gamesWon} teamTricks={teamTricks} hokm={hokm} hakemSeat={hakem}
            trickTarget={TRICK_TARGET} matchTarget={MATCH_TARGET}
            gameOver={gameOver} matchOver={matchOver}
            winningTeam={winningTeam} resultBadge={resultBadge}
            showScore={gameIndex === 1} canSort={gameIndex === 1 && (playedCardSets[0]?.length === 13)} onSort={reorderCards}
            quality={quality} onQuality={onQuality} onResetGame={playAgain}
            onSettingsOpenChange={setSettingsOpen}
            onNext={nextGame} onPlayAgain={playAgain} /> }

        {/* add Floor to scene ----------------------------------------------------------------*/}
        <Floor width ={100} height={100} texturePath='floor2' textureRepeat={[1,2]} receivedShadow />

        {/* lightweight table (primitives + procedural felt) instead of a 30MB model -------*/}
        <Table position={[0, 4.1, 0]} radius={15} receivedShadow />

        {/* discard / burned-cards tray ------------------------------------------------------*/}
        <mesh position={[4, 4.6, 3.5]} receiveShadow>
          <boxGeometry args={[2.6, 0.25, 3.4]} />
          <meshStandardMaterial color="#3a2414" roughness={0.8} metalness={0.05} />
        </mesh>

        {/* add cards to scene ----------------------------------------------------------------*/}
        {cards.length &&
                cards.map((card,cardIndex)=>{
                    // CARD_DROP lowers every card so it rests just above the felt
                    // (not floating). Applied to both the resting and animated y.
                    const CARD_DROP = 0.4;
                    const aPos = animation[cardIndex].position;
                    return <Card key={cardIndex} type={card.type} number={card.number} width={7} height={10.5}
                    rotation={[-Math.PI/ 2,Math.PI, Math.PI/2]} position={[4, 5 + cardIndex/200 - CARD_DROP, 3.5]}
                    animate={animationIndex === cardIndex} onAnimationComplete={handleAnimationComplete}
                    animateRotation={animation[cardIndex].rotation} animatePos={[aPos[0], aPos[1] - CARD_DROP, aPos[2]]}
                    gameIndex={gameIndex} animationIndex={animationIndex} cardIndex={cardIndex} setPlayerCard={setPlayerCard}
                    currentSet={currentSet} canPlay={cardIndex <= 12 && canPlayCard(card)} />
                })
        }
         
    </>
  );
};

export default Scene;