// Shared sprite-atlas layout, used by both the build script (scripts/build-atlas.ts)
// and the Card component so the packing order can never drift.
//
// The atlas is a COLS x ROWS grid of card cells. Order: every rank of each suit,
// then the card back at the final index.

export const SUITS = ['spades', 'hearts', 'clubs', 'diamonds'] as const;
export const RANKS = ['ace', 'king', 'queen', 'jack', '10', '9', '8', '7', '6', '5', '4', '3', '2'] as const;

export const ORDER: string[] = [];
for (const suit of SUITS) {
  for (const rank of RANKS) {
    ORDER.push(`${rank}_of_${suit}`);
  }
}
ORDER.push('back'); // index 52

export const COLS = 8;
export const ROWS = Math.ceil(ORDER.length / COLS); // 7
export const CELL_W = 250; // downscaled from source 500
export const CELL_H = 363; // downscaled from source 726
export const ATLAS_W = COLS * CELL_W;
export const ATLAS_H = ROWS * CELL_H;
export const ATLAS_URL = '/textures/cards-atlas.webp';

export const cardName = (type: string, number: string) => `${number}_of_${type}`;

export const indexOf = (name: string) => ORDER.indexOf(name);

/** UV transform (repeat + offset) for a grid index, assuming TextureLoader flipY=true. */
export function uvFor(index: number) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const repeatX = 1 / COLS;
  const repeatY = 1 / ROWS;
  return {
    repeatX,
    repeatY,
    offsetX: col * repeatX,
    offsetY: 1 - (row + 1) * repeatY,
  };
}
