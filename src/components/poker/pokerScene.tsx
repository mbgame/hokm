import React from 'react';
import { OrbitControls, PerspectiveCamera, Environment, Lightformer } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import Card3D from '../card3d/card3d';
import ChipStack from '../chips3d/chipStack';
import Floor from '../floor';
import ThemedTable from '../themed/themedTable';
import ThemedBackdrop from '../themed/themedBackdrop';
import SpotLightWithHelper from '../lights/spotLightHelper';
import type { PokerState } from '../../games/poker/useHoldem';

const TABLE_Y = 4.1;
const CARD_Y = 4.74;
const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0];
const DEALER_BTN: [number, number, number] = [0, 6.5, 0]; // cards fly from center
const HOLE_W = 8;
const HOLE_H = 12;

// seat hole-card anchor (center). seat0 = you (near camera, +z).
const SEAT_ANCHOR: [number, number][] = [
  [0, 9],     // you
  [10, 0],    // right
  [0, -9],    // across
  [-10, 0],   // left
];
const SEAT_SPREAD: [number, number][] = [
  [1.5, 0], [0, 1.5], [1.5, 0], [0, 1.5],
];
// where each seat's committed chips park. front/back seats sit on the
// center axis in front of the seat; the side seats push outward toward
// their bot and nudge forward (+z) so they read in front of the bot
// instead of lining up on the community-board row (z=0).
const BET_ANCHOR: [number, number][] = [
  [0, 6.6],      // you
  [8.5, 1.6],    // right bot
  [0, -6.6],     // across
  [-8.5, 1.6],   // left bot
];

type SceneProps = { state: PokerState; controlsRef?: React.Ref<any> };

const PokerScene: React.FC<SceneProps> = ({ state, controlsRef }) => {
  const winners = new Set(state.results?.winners ?? []);
  const { size } = useThree();
  const portrait = size.height >= size.width;
  const fov = portrait ? 56 : 40;          // widen view on phones
  const tight = portrait ? 0.7 : 1;        // pull hands + board inward
  const comGap = portrait ? 1.9 : 2.5;     // community spacing
  const holeOff = portrait ? 0.42 : 0.5;   // hole-card spread

  return (
    <>
      <ThemedBackdrop top="#1a0309" bottom="#430a18" glow="#c11f3f" />

      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.0} color="#fff0f0" position={[0, 14, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[24, 24, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#ffd0d8" position={[-12, 6, 10]} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#ffe6b0" position={[12, 6, -10]} scale={[10, 10, 1]} />
      </Environment>

      {/* high angled view so every seat + the board read clearly */}
      <PerspectiveCamera makeDefault position={[0, 25, 11]} fov={fov} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.1}
        minDistance={16}
        maxDistance={36}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2.5}
        target={[0, 4.6, 0]}
      />

      <ambientLight color="#ffd9de" intensity={0.4} />
      <SpotLightWithHelper position={[0, 19, 4]} intensity={150} distance={36} angle={0.95} power={90} />
      <SpotLightWithHelper position={[-18, 14, -6]} intensity={220} distance={42} angle={0.6} power={300} />

      <Floor width={100} height={100} texturePath="floor2" textureRepeat={[1, 2]} receivedShadow />
      <ThemedTable position={[0, TABLE_Y, 0]} radius={15} feltColor="#6e0f24" glow={[0.28, 0.05, 0.1]} rimColor="#2a1208" receivedShadow />

      {/* central pot */}
      <ChipStack amount={state.pot} position={[0, 4.62, portrait ? 3 : 2.6]} glow={state.phase === 'handover'} />

      {/* each seat's chips committed this street, parked in front of the seat */}
      {state.players.map((pl, seat) => {
        const [bx, bz] = BET_ANCHOR[seat];
        return (
          <ChipStack
            key={`bet-${seat}`}
            amount={pl.committed}
            position={[bx * tight, 4.55, bz * tight]}
          />
        );
      })}

      {/* community board */}
      {state.community.map((c, i) => (
        <Card3D
          key={`c-${c.number}_${c.type}`}
          type={c.type} number={c.number} width={HOLE_W} height={HOLE_H}
          position={[(i - 2) * comGap, CARD_Y, 0]} rotation={FLAT}
          faceUp
          dealFrom={DEALER_BTN} dealDelay={(i % 3) * 0.13} spin={i % 2 ? 0.4 : -0.4}
        />
      ))}

      {/* each seat's two hole cards */}
      {state.players.map((pl, seat) => {
        const [ax, az] = SEAT_ANCHOR[seat];
        const [sx, sz] = SEAT_SPREAD[seat];
        const faceUp = pl.isHuman || (state.reveal && !pl.folded);
        return pl.hole.map((c, j) => {
          const off = j === 0 ? -holeOff : holeOff;
          const pos: [number, number, number] = [ax * tight + sx * off, CARD_Y + j * 0.01, az * tight + sz * off];
          // stay flat on the felt, but turn the side seats' cards 90° in-plane so
          // each pair lines up with its seat (long edge toward table center).
          const rot: [number, number, number] =
            seat === 1 ? [-Math.PI / 2, 0, Math.PI / 2]
            : seat === 3 ? [-Math.PI / 2, 0, -Math.PI / 2]
            : FLAT;
          return (
            <Card3D
              key={`h-${seat}-${j}`}
              type={c.type} number={c.number} width={HOLE_W} height={HOLE_H}
              position={pos} rotation={rot}
              faceUp={faceUp}
              highlight={winners.has(seat)}
              dealFrom={DEALER_BTN} dealDelay={seat * 0.08 + j * 0.04} spin={j ? 0.4 : -0.4}
            />
          );
        });
      })}
    </>
  );
};

export default PokerScene;
