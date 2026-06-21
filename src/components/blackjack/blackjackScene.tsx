import React from 'react';
import { OrbitControls, PerspectiveCamera, Environment, Lightformer } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import Card3D from '../card3d/card3d';
import ChipStack from '../chips3d/chipStack';
import Floor from '../floor';
import ThemedTable from '../themed/themedTable';
import ThemedBackdrop from '../themed/themedBackdrop';
import SpotLightWithHelper from '../lights/spotLightHelper';
import type { BJState } from '../../games/blackjack/useBlackjack';

const TABLE_Y = 4.1;
const CARD_Y = 4.74;
const FLAT: [number, number, number] = [-Math.PI / 2, 0, 0]; // lying flat, face up
const SHOE: [number, number, number] = [13.5, 5.6, -7];       // cards fly from here
const CARD_W = 9.5;
const CARD_H = 14;

// Fan a hand along x, centered, near (+z) or far (-z) side of the table.
function layout(n: number, z: number, gap: number): [number, number, number][] {
  const start = -((n - 1) / 2) * gap;
  return Array.from({ length: n }, (_, i) => [start + i * gap, CARD_Y + i * 0.01, z]);
}

type SceneProps = { state: BJState; controlsRef?: React.Ref<any> };

const BlackjackScene: React.FC<SceneProps> = ({ state, controlsRef }) => {
  const { size } = useThree();
  const portrait = size.height >= size.width;       // phones held upright
  const gap = portrait ? 1.7 : 2.7;                 // tighter fan on narrow screens
  const fov = portrait ? 54 : 38;                   // widen view so it all fits
  const playerPos = layout(state.player.length, 6, gap);
  const dealerPos = layout(state.dealer.length, -6, gap);

  return (
    <>
      <ThemedBackdrop top="#03101f" bottom="#0a2a4d" glow="#1f6dcb" />

      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.0} color="#eaf3ff" position={[0, 14, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[24, 24, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#bfe9ff" position={[-12, 6, 10]} scale={[10, 10, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#ffe6b0" position={[12, 6, -10]} scale={[10, 10, 1]} />
      </Environment>

      {/* high, gently angled view so both hands read clearly */}
      <PerspectiveCamera makeDefault position={[0, 21, 9]} fov={fov} />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.1}
        minDistance={14}
        maxDistance={32}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2.6}
        target={[0, 4.6, 0]}
      />

      <ambientLight color="#cfe4ff" intensity={0.4} />
      <SpotLightWithHelper position={[0, 18, 4]} intensity={140} distance={34} angle={0.9} power={80} />
      <SpotLightWithHelper position={[-18, 14, -6]} intensity={220} distance={40} angle={0.6} power={300} />

      <Floor width={100} height={100} texturePath="floor2" textureRepeat={[1, 2]} receivedShadow />
      <ThemedTable position={[0, TABLE_Y, 0]} radius={13} feltColor="#0b3d6e" glow={[0.05, 0.14, 0.28]} rimColor="#3a2a14" receivedShadow />

      {/* dealer hand (far side); hole card face-down until reveal */}
      {state.dealer.map((c, i) => (
        <Card3D
          key={`d-${c.number}_${c.type}-${i}`}
          type={c.type} number={c.number} width={CARD_W} height={CARD_H}
          position={dealerPos[i]} rotation={FLAT}
          faceUp={!(i === 1 && state.holeHidden)}
          dealFrom={SHOE} dealDelay={i * 0.13 + 0.06} spin={i % 2 ? 0.5 : -0.5}
        />
      ))}

      {/* live bet chips sitting on the felt in front of the player's cards */}
      <ChipStack amount={state.bet} position={[0, 4.5, portrait ? 3.6 : 3.4]} />

      {/* player hand (near side) */}
      {state.player.map((c, i) => (
        <Card3D
          key={`p-${c.number}_${c.type}-${i}`}
          type={c.type} number={c.number} width={CARD_W} height={CARD_H}
          position={playerPos[i]} rotation={FLAT}
          faceUp
          highlight={state.outcome === 'blackjack' || state.outcome === 'win'}
          dealFrom={SHOE} dealDelay={i * 0.13} spin={i % 2 ? -0.5 : 0.5}
        />
      ))}
    </>
  );
};

export default BlackjackScene;
