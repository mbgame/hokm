import React, { useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, DoubleSide } from 'three';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ATLAS_URL, cardName, indexOf, uvFor } from '../card/atlasLayout';
import CardParticles from '../shaders/cardParticles';

// Generic 3D playing card for the Blackjack / Poker scenes. Pure presentational:
// give it a target position/rotation + faceUp and it lerps there every frame.
// Optional `dealFrom` makes it fly in from a deck/shoe origin with a small arc
// (hop) + spin settle — the "thrown card" feel. Hokm code is never touched.

function atlasCell(atlas: THREE.Texture, name: string): THREE.Texture {
  const t = atlas.clone();
  const uv = uvFor(indexOf(name));
  t.repeat.set(uv.repeatX, uv.repeatY);
  t.offset.set(uv.offsetX, uv.offsetY);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

export interface Card3DProps {
  type: string;
  number: string;
  width?: number;
  height?: number;
  position: [number, number, number];     // target world position (lerped)
  rotation: [number, number, number];      // target world rotation (lerped)
  faceUp?: boolean;
  lerp?: number;
  highlight?: boolean;
  onClick?: () => void;
  shadow?: boolean;
  dealFrom?: [number, number, number];      // spawn origin -> card flies to target
  dealDelay?: number;                       // seconds before this card is released
  spin?: number;                            // extra z spin at spawn, unwinds on flight
}

const Card3D: React.FC<Card3DProps> = ({
  type, number, width = 7, height = 10.5, position, rotation,
  faceUp = true, lerp = 0.16, highlight = false, onClick, shadow = true,
  dealFrom, dealDelay = 0, spin = 0,
}) => {
  const atlas = useLoader(TextureLoader, ATLAS_URL);
  const frontTexture = useMemo(() => atlasCell(atlas, cardName(type, number)), [atlas, type, number]);
  const backTexture = useMemo(() => atlasCell(atlas, 'back'), [atlas]);
  const meshRef = useRef<THREE.Mesh>(null!);
  const hop = useRef({ v: 0 });
  const released = useRef(!dealFrom);

  // place the card at its spawn BEFORE first paint (no origin flash)
  useLayoutEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    const sp = dealFrom ?? position;
    m.position.set(sp[0], sp[1], sp[2]);
    m.rotation.set(rotation[0], rotation[1], rotation[2] + (dealFrom ? spin : 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // release after the stagger delay, then kick the arc hop
  useEffect(() => {
    if (!dealFrom) return;
    const t = setTimeout(() => {
      released.current = true;
      hop.current.v = 2.6;
      gsap.to(hop.current, { v: 0, duration: 0.5, ease: 'power2.out' });
    }, dealDelay * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    const m = meshRef.current;
    if (!m || !released.current) return;
    m.position.x += (position[0] - m.position.x) * lerp;
    m.position.z += (position[2] - m.position.z) * lerp;
    m.position.y += (position[1] + hop.current.v - m.position.y) * lerp;
    m.rotation.x += (rotation[0] - m.rotation.x) * lerp;
    m.rotation.y += (rotation[1] - m.rotation.y) * lerp;
    m.rotation.z += (rotation[2] - m.rotation.z) * lerp;
  });

  return (
    <mesh
      ref={meshRef}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
      onPointerOver={onClick ? (e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; } : undefined}
      onPointerOut={onClick ? () => { document.body.style.cursor = 'auto'; } : undefined}
    >
      <Plane args={[width / 10, height / 10]} castShadow={shadow}>
        <meshStandardMaterial
          attach="material"
          map={faceUp ? frontTexture : backTexture}
          side={DoubleSide}
          roughness={0.6}
          metalness={0.0}
          envMapIntensity={0.3}
        />
        {/* drifting sparkles instead of an emissive glow on highlighted cards */}
        {highlight && <CardParticles size={[width / 10, height / 10]} />}
      </Plane>
      <Plane args={[width / 10, height / 10]} position={[0, 0, -0.01]}>
        <meshStandardMaterial
          attach="material"
          map={faceUp ? backTexture : frontTexture}
          side={DoubleSide}
          roughness={0.6}
          metalness={0.0}
          envMapIntensity={0.3}
        />
      </Plane>
    </mesh>
  );
};

export default Card3D;
