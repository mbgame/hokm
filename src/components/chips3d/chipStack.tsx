"use client";
import React from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace, RepeatWrapping, AdditiveBlending, type Texture } from 'three';

// A pile of casino chips broken into denomination columns: the amount is split
// greedily into chip values and each value gets its own coloured column lined up
// in front of the player, just like a real table. Discs are short cylinders
// skinned with a procedurally-drawn chip texture (cached per denomination).

const CHIP_R = 0.4;        // disc radius (small, relative to the cards)
const CHIP_H = 0.1;        // disc thickness
const COL_GAP = CHIP_R * 2 + 0.12;
const MAX_DISCS = 12;      // tallest a single column gets

type Denom = { value: number; label: string; body: string; ring: string; spot: string };

// Largest → smallest. Colours follow standard casino convention.
const DENOMS: Denom[] = [
  { value: 5000, label: '5K', body: '#15171a', ring: '#d4af37', spot: '#d4af37' }, // black / gold
  { value: 1000, label: '1K', body: '#1f63b8', ring: '#ffffff', spot: '#f4f4f0' }, // blue
  { value: 500, label: '500', body: '#1c8347', ring: '#ffffff', spot: '#f4f4f0' }, // green
  { value: 100, label: '100', body: '#bf2f27', ring: '#ffffff', spot: '#ffffff' }, // red
  { value: 25, label: '25', body: '#e9e9e4', ring: '#b8242b', spot: '#b8242b' },    // white
  { value: 5, label: '5', body: '#7d3c98', ring: '#ffffff', spot: '#f0e6f6' },      // purple
];

// Greedy split into { denom, count } columns.
function breakdown(amount: number): { d: Denom; count: number }[] {
  let r = Math.round(amount);
  const out: { d: Denom; count: number }[] = [];
  for (const d of DENOMS) {
    const c = Math.floor(r / d.value);
    if (c > 0) { out.push({ d, count: c }); r -= c * d.value; }
  }
  if (out.length === 0 && amount > 0) out.push({ d: DENOMS[DENOMS.length - 1], count: 1 });
  return out;
}

type ChipTex = { face: Texture; side: Texture };
const texCache = new Map<string, ChipTex>();

function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

function buildTextures(d: Denom): ChipTex {
  // ---- top/bottom face ----
  const S = 256;
  const fc = document.createElement('canvas');
  fc.width = fc.height = S;
  const ctx = fc.getContext('2d')!;
  const cx = S / 2, cy = S / 2, R = S / 2;

  ctx.fillStyle = d.body;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

  // rim spots
  const SPOTS = 12;
  ctx.fillStyle = d.spot;
  for (let i = 0; i < SPOTS; i++) {
    const a = (i / SPOTS) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * R * 0.86, cy + Math.sin(a) * R * 0.86);
    ctx.rotate(a);
    ctx.fillRect(-R * 0.11, -R * 0.05, R * 0.22, R * 0.1);
    ctx.restore();
  }

  // rings
  ctx.strokeStyle = d.ring;
  ctx.lineWidth = R * 0.05;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.7, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = R * 0.03;
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.6, 0, Math.PI * 2); ctx.stroke();

  // center medallion + denomination
  ctx.fillStyle = shade(d.body, -18);
  ctx.beginPath(); ctx.arc(cx, cy, R * 0.5, 0, Math.PI * 2); ctx.fill();
  const lightChip = d.body === '#e9e9e4';
  ctx.fillStyle = lightChip ? '#1a1a1a' : '#ffffff';
  ctx.font = `bold ${R * 0.46}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(d.label, cx, cy + R * 0.02);

  const face = new CanvasTexture(fc);
  face.colorSpace = SRGBColorSpace;
  face.anisotropy = 4;

  // ---- side / rim ----
  const sc = document.createElement('canvas');
  sc.width = 256; sc.height = 16;
  const sctx = sc.getContext('2d')!;
  sctx.fillStyle = d.body; sctx.fillRect(0, 0, 256, 16);
  sctx.fillStyle = d.spot;
  const bars = 16;
  for (let i = 0; i < bars; i++) if (i % 2 === 0) sctx.fillRect((i / bars) * 256, 0, (256 / bars) * 0.5, 16);
  const side = new CanvasTexture(sc);
  side.colorSpace = SRGBColorSpace;
  side.wrapS = side.wrapT = RepeatWrapping;
  side.repeat.set(6, 1);

  return { face, side };
}

function getTextures(d: Denom): ChipTex {
  let t = texCache.get(d.label);
  if (!t) { t = buildTextures(d); texCache.set(d.label, t); }
  return t;
}

// One denomination column of discs, with a drop-in intro + pulse-on-change.
const Column: React.FC<{ d: Denom; count: number; x: number; glow: boolean; pulseRef: React.MutableRefObject<number> }> = ({ d, count, x, glow, pulseRef }) => {
  const { face, side } = getTextures(d);
  const discs = Math.min(MAX_DISCS, count);
  const grp = React.useRef<any>(null);
  const born = React.useRef<number>(0);
  if (born.current === 0) born.current = (typeof performance !== 'undefined' ? performance.now() : 0);

  useFrame(() => {
    const g = grp.current;
    if (!g) return;
    const now = performance.now();
    // intro: ease-out drop from above + scale up
    const t = Math.min(1, (now - born.current) / 420);
    const ease = 1 - Math.pow(1 - t, 3);
    // pulse: short scale bump whenever the amount last changed
    const since = now - pulseRef.current;
    const bump = since < 320 ? Math.sin((since / 320) * Math.PI) * 0.14 * (1 - since / 320) : 0;
    g.scale.setScalar(ease * (1 + bump));
    g.position.set(x, (1 - ease) * 1.4, 0);
  });

  return (
    <group ref={grp} position={[x, 0, 0]}>
      {Array.from({ length: discs }, (_, i) => (
        <mesh key={i} position={[0, i * CHIP_H + CHIP_H / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[CHIP_R, CHIP_R, CHIP_H, 40]} />
          <meshStandardMaterial attach="material-0" map={side} roughness={0.55} metalness={0.1} />
          <meshStandardMaterial
            attach="material-1" map={face} roughness={0.4} metalness={0.12}
            emissive={glow ? '#7a5a10' : '#000000'} emissiveIntensity={glow ? 0.35 : 0}
          />
          <meshStandardMaterial attach="material-2" map={face} roughness={0.4} metalness={0.12} />
        </mesh>
      ))}
    </group>
  );
};

// Soft additive glow pad lying on the felt under a pile. Pulses gently; brighter
// for a highlighted pot.
let glowTex: Texture | null = null;
function getGlowTex(): Texture {
  if (glowTex) return glowTex;
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,235,170,0.9)');
  g.addColorStop(0.5, 'rgba(255,210,120,0.35)');
  g.addColorStop(1, 'rgba(255,200,90,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  glowTex = new CanvasTexture(c);
  glowTex.colorSpace = SRGBColorSpace;
  return glowTex;
}

const GlowPad: React.FC<{ width: number; glow: boolean }> = ({ width, glow }) => {
  const mat = React.useRef<any>(null);
  const tex = getGlowTex();
  useFrame(({ clock }) => {
    if (!mat.current) return;
    const base = glow ? 0.85 : 0.4;
    mat.current.opacity = base + Math.sin(clock.elapsedTime * 2.4) * (glow ? 0.18 : 0.1);
  });
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, width * 0.6]} />
      <meshBasicMaterial ref={mat} map={tex} transparent blending={AdditiveBlending} depthWrite={false} />
    </mesh>
  );
};

type Props = {
  amount: number;
  /** felt position of the pile base (chips grow +y, columns spread along x). */
  position: [number, number, number];
  /** highlight ring (e.g. winning pot). */
  glow?: boolean;
};

const ChipStack: React.FC<Props> = ({ amount, position, glow = false }) => {
  const cols = React.useMemo(() => breakdown(amount), [amount]);
  // timestamp of the last amount change -> drives the per-column scale pulse
  const pulseRef = React.useRef<number>(0);
  React.useEffect(() => { pulseRef.current = performance.now(); }, [amount]);

  if (amount <= 0 || cols.length === 0) return null;

  const startX = -((cols.length - 1) / 2) * COL_GAP;
  const padW = cols.length * COL_GAP + CHIP_R * 3;

  return (
    <group position={position}>
      <GlowPad width={padW} glow={glow} />
      {cols.map((c, i) => (
        <Column key={c.d.label} d={c.d} count={c.count} x={startX + i * COL_GAP} glow={glow} pulseRef={pulseRef} />
      ))}
    </group>
  );
};

export default ChipStack;
