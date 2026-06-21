// 5-of-7 poker hand evaluator. Returns a comparable score so hands can be ranked
// with a simple numeric compare. Category is the high digit; the rest are
// tiebreak kickers packed base-15.
import { PlayingCard, Rank, rankValue } from '../shared/deck';

export const CATEGORY = [
  'High Card', 'Pair', 'Two Pair', 'Three of a Kind', 'Straight',
  'Flush', 'Full House', 'Four of a Kind', 'Straight Flush',
] as const;

export interface HandRank {
  score: number;      // higher = better
  category: number;   // 0..8 index into CATEGORY
  label: string;
}

function pack(category: number, kickers: number[]): number {
  // category dominates; up to 5 kickers in base-15
  let s = category;
  for (let i = 0; i < 5; i++) s = s * 15 + (kickers[i] || 0);
  return s;
}

// Best straight high card from a set of distinct rank values (ace can be low).
function straightHigh(values: number[]): number {
  const set = new Set(values);
  if (set.has(14)) set.add(1); // wheel A-2-3-4-5
  const sorted = Array.from(set).sort((a, b) => b - a);
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] - 1) {
      run++;
      if (run >= 5) return sorted[i] + 4;
    } else {
      run = 1;
    }
  }
  return 0;
}

// Evaluate the best 5-card hand out of any number of cards (5..7).
export function evaluate(cards: PlayingCard[]): HandRank {
  const values = cards.map(c => rankValue(c.number));
  const bySuit: Record<string, number[]> = {};
  for (const c of cards) (bySuit[c.type] ||= []).push(rankValue(c.number));

  // counts per rank value
  const counts: Record<number, number> = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const groups = Object.entries(counts)
    .map(([v, n]) => ({ v: +v, n }))
    .sort((a, b) => b.n - a.n || b.v - a.v);

  // flush?
  let flushSuit: string | null = null;
  for (const s in bySuit) if (bySuit[s].length >= 5) flushSuit = s;

  // straight flush
  if (flushSuit) {
    const sfHigh = straightHigh(bySuit[flushSuit]);
    if (sfHigh) return { score: pack(8, [sfHigh]), category: 8, label: CATEGORY[8] };
  }

  // four of a kind
  if (groups[0].n === 4) {
    const quad = groups[0].v;
    const kicker = Math.max(...values.filter(v => v !== quad));
    return { score: pack(7, [quad, kicker]), category: 7, label: CATEGORY[7] };
  }

  // full house (trips + pair, or two trips)
  if (groups[0].n === 3 && (groups[1] && groups[1].n >= 2)) {
    return { score: pack(6, [groups[0].v, groups[1].v]), category: 6, label: CATEGORY[6] };
  }

  // flush
  if (flushSuit) {
    const top5 = bySuit[flushSuit].sort((a, b) => b - a).slice(0, 5);
    return { score: pack(5, top5), category: 5, label: CATEGORY[5] };
  }

  // straight
  const sHigh = straightHigh(values);
  if (sHigh) return { score: pack(4, [sHigh]), category: 4, label: CATEGORY[4] };

  // trips
  if (groups[0].n === 3) {
    const kick = values.filter(v => v !== groups[0].v).sort((a, b) => b - a).slice(0, 2);
    return { score: pack(3, [groups[0].v, ...kick]), category: 3, label: CATEGORY[3] };
  }

  // two pair
  if (groups[0].n === 2 && groups[1] && groups[1].n === 2) {
    const hi = groups[0].v, lo = groups[1].v;
    const kick = Math.max(...values.filter(v => v !== hi && v !== lo));
    return { score: pack(2, [hi, lo, kick]), category: 2, label: CATEGORY[2] };
  }

  // pair
  if (groups[0].n === 2) {
    const kick = values.filter(v => v !== groups[0].v).sort((a, b) => b - a).slice(0, 3);
    return { score: pack(1, [groups[0].v, ...kick]), category: 1, label: CATEGORY[1] };
  }

  // high card
  const top5 = [...values].sort((a, b) => b - a).slice(0, 5);
  return { score: pack(0, top5), category: 0, label: CATEGORY[0] };
}

// Rough 0..1 strength of two hole cards pre-flop (Chen-ish, normalized).
export function preflopStrength(hole: PlayingCard[]): number {
  if (hole.length < 2) return 0;
  const [a, b] = hole;
  const hi = Math.max(rankValue(a.number), rankValue(b.number));
  const lo = Math.min(rankValue(a.number), rankValue(b.number));
  let pts = hi / 14 * 5; // top card weight
  if (a.number === b.number) pts = Math.max(5, hi / 2 + 2) + 4; // pair bonus
  if (a.type === b.type) pts += 2;        // suited
  const gap = hi - lo;
  if (gap === 1) pts += 1; else if (gap === 2) pts -= 1; else if (gap >= 3) pts -= 2 + gap * 0.3;
  return Math.max(0, Math.min(1, pts / 14));
}
