// Build a single sprite-atlas webp from the individual card PNGs.
// Run: npx tsx scripts/build-atlas.ts
import sharp from 'sharp';
import path from 'node:path';
import { ORDER, COLS, CELL_W, CELL_H, ATLAS_W, ATLAS_H, ROWS } from '../src/components/card/atlasLayout';

// Source card PNGs live in assets/ (not in public/, so they are not deployed).
const SRC = path.join(process.cwd(), 'assets/cards');
const OUT = path.join(process.cwd(), 'public/textures/cards-atlas.webp');

async function main() {
  const composites: sharp.OverlayOptions[] = [];
  for (let i = 0; i < ORDER.length; i++) {
    const name = ORDER[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const buf = await sharp(path.join(SRC, `${name}.png`))
      .resize(CELL_W, CELL_H, { fit: 'fill' })
      .toBuffer();
    composites.push({ input: buf, left: col * CELL_W, top: row * CELL_H });
  }

  await sharp({
    create: { width: ATLAS_W, height: ATLAS_H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .webp({ quality: 82 })
    .toFile(OUT);

  console.log(`atlas: ${ORDER.length} cards -> ${COLS}x${ROWS} grid, ${ATLAS_W}x${ATLAS_H} -> ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
