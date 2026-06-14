// Procedural audio (no asset files): card-like SFX from filtered noise + a
// self-generated looping chord pad for background music. Must be initialised
// from a user gesture (the Start button) per autoplay rules.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;
let muted = false;
let started = false;

// Per-channel volumes (0..1), restored from localStorage. SFX routes through
// sfxGain, background music through musicGain; both feed `master` (the mute bus).
function loadVol(key: string, fallback: number): number {
  try {
    const v = parseFloat(localStorage.getItem(key) || '');
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback;
  } catch { return fallback; }
}
let sfxVol = loadVol('hokm_sfx_vol', 0.8);
let musicVol = loadVol('hokm_music_vol', 0.5);

function makeNoise(c: AudioContext): AudioBuffer {
  const len = Math.floor(c.sampleRate * 0.3);
  const b = c.createBuffer(1, len, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

export function initAudio() {
  if (started) return;
  started = true;
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = sfxVol;
    sfxGain.connect(master);
    noiseBuf = makeNoise(ctx);
    startMusic();
  } catch { /* no webaudio */ }
}

export function resumeAudio() {
  ctx?.resume().catch(() => {});
}

// ---- card SFX: a short filtered-noise "flick / snap" ----
function flick(hp: number, lp: number, dur: number, vol: number) {
  if (!ctx || !sfxGain || !noiseBuf || muted) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.playbackRate.value = 0.85 + Math.random() * 0.3;
  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = hp;
  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.value = lp;
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(hpf).connect(lpf).connect(g).connect(sfxGain);
  src.start(t);
  src.stop(t + dur + 0.02);
}

// A softer card "slide / swish": noise with a downward low-pass sweep.
function swish(vol: number, dur: number) {
  if (!ctx || !sfxGain || !noiseBuf || muted) return;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.playbackRate.value = 0.55 + Math.random() * 0.25;
  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.value = 350;
  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  const t = ctx.currentTime;
  lpf.frequency.setValueAtTime(5500, t);
  lpf.frequency.exponentialRampToValueAtTime(800, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(hpf).connect(lpf).connect(g).connect(sfxGain);
  src.start(t);
  src.stop(t + dur + 0.03);
}

let lastDeal = 0;

function tone(freq: number, dur: number, type: OscillatorType, vol: number) {
  if (!ctx || !sfxGain || muted) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(sfxGain);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  // soft card slide, rate-limited so fast dealing doesn't machine-gun
  deal: () => {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (now - lastDeal < 150) return;
    lastDeal = now;
    swish(0.2, 0.18);
  },
  card: () => flick(1200, 7000, 0.11, 0.34),                // softer play snap
  sweep: () => { flick(900, 6000, 0.14, 0.28); setTimeout(() => flick(1100, 7000, 0.1, 0.22), 60); setTimeout(() => flick(800, 5000, 0.12, 0.2), 120); },
  win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.26, 'triangle', 0.26), i * 110)),
  lose: () => [392, 330, 262].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sine', 0.2), i * 130)),
  click: () => flick(2500, 11000, 0.05, 0.25),
  // bright "nice play!" sparkle: a quick rising arpeggio + a little shimmer
  nice: () => {
    [784, 988, 1318, 1568].forEach((f, i) => setTimeout(() => tone(f, 0.14, 'triangle', 0.22), i * 55));
    setTimeout(() => flick(4000, 12000, 0.06, 0.18), 120);
  },
  // longer celebratory fanfare for winning a game
  cheer: () => {
    [523, 659, 784, 1046, 1318, 1046, 1318, 1568].forEach((f, i) =>
      setTimeout(() => tone(f, 0.22, 'triangle', 0.24), i * 90));
    [330, 392].forEach((f, i) => setTimeout(() => tone(f, 0.5, 'sine', 0.16), i * 360)); // bass swell
  },
};

// ---- self-generated background music: a slow looping chord pad + bass ----
const PROG = [
  [220.0, 261.6, 329.6], // Am
  [174.6, 220.0, 261.6], // F
  [261.6, 329.6, 392.0], // C
  [196.0, 246.9, 392.0], // G
];

function padNote(freq: number, dur: number, t: number, vol: number, type: OscillatorType = 'sine') {
  if (!ctx || !musicGain) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.5);   // soft attack
  g.gain.linearRampToValueAtTime(0.0001, t + dur); // long release
  o.connect(g).connect(musicGain);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function startMusic() {
  if (!ctx || !master || musicTimer) return;
  musicGain = ctx.createGain();
  musicGain.gain.value = musicVol;
  musicGain.connect(master);
  let i = 0;
  const bar = () => {
    if (!ctx) return;
    const t = ctx.currentTime + 0.05;
    const chord = PROG[i % PROG.length];
    chord.forEach(f => padNote(f, 2.4, t, 0.06, 'sine'));
    padNote(chord[0] / 2, 2.4, t, 0.08, 'triangle'); // bass
    i++;
  };
  bar();
  musicTimer = setInterval(bar, 2200);
}

export function toggleMute(): boolean {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 1;
  return muted;
}

export function isMuted() { return muted; }

// ---- per-channel volume (0..1), persisted ----
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function setSfxVolume(v: number) {
  sfxVol = clamp01(v);
  if (sfxGain) sfxGain.gain.value = sfxVol;
  try { localStorage.setItem('hokm_sfx_vol', String(sfxVol)); } catch {}
}
export function setMusicVolume(v: number) {
  musicVol = clamp01(v);
  if (musicGain) musicGain.gain.value = musicVol;
  try { localStorage.setItem('hokm_music_vol', String(musicVol)); } catch {}
}
export function getSfxVolume() { return sfxVol; }
export function getMusicVolume() { return musicVol; }
