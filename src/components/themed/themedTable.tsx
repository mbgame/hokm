import React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Parametric felt table (felt color + center-glow color configurable) for the
// Blackjack / Poker scenes. Mirrors the Hokm `Table` look but lets each game
// pick its own theme. Hokm's own Table component is left untouched.

function makeFeltTexture(base: string): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  const dots = Math.floor(size * size * 0.35);
  for (let i = 0; i < dots; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const light = Math.random() > 0.5;
    ctx.fillStyle = light ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, 1, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.anisotropy = 8;
  return tex;
}

type Props = {
  position?: [number, number, number];
  radius?: number;
  receivedShadow?: boolean;
  feltColor?: string;       // base felt color
  glow?: [number, number, number]; // additive center-glow rgb (0..1)
  rimColor?: string;
};

const ThemedTable: React.FC<Props> = ({
  position = [0, 4.2, 0], radius = 15, receivedShadow = false,
  feltColor = '#0b5d2e', glow = [0.04, 0.22, 0.11], rimColor = '#5b3a1e',
}) => {
  const felt = React.useMemo(() => makeFeltTexture(feltColor), [feltColor]);
  const uTime = React.useRef({ value: 0 });

  const onFeltCompile = React.useCallback(
    (shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uTime = uTime.current;
      shader.uniforms.uRadius = { value: radius };
      shader.uniforms.uGlow = { value: new THREE.Vector3(glow[0], glow[1], glow[2]) };
      shader.vertexShader =
        'varying vec2 vFeltXZ;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vec4 feltWp = modelMatrix * vec4(transformed, 1.0);
           vFeltXZ = feltWp.xz;`,
        );
      shader.fragmentShader =
        'uniform float uTime;\nuniform float uRadius;\nuniform vec3 uGlow;\nvarying vec2 vFeltXZ;\n' +
        shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>
           float feltDist = length(vFeltXZ) / uRadius;
           float feltGlow = smoothstep(0.95, 0.0, feltDist);
           float feltSheen = 0.5 + 0.5 * sin(uTime * 0.5);
           gl_FragColor.rgb += uGlow * feltGlow * (0.55 + 0.35 * feltSheen);`,
        );
    },
    [radius, glow],
  );

  useFrame((_, delta) => { uTime.current.value += delta; });

  return (
    <group position={position}>
      <mesh position={[0, -0.2, 0]} receiveShadow={receivedShadow}>
        <cylinderGeometry args={[radius + 0.7, radius + 1.1, 0.8, 64]} />
        <meshStandardMaterial color={rimColor} roughness={0.75} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.22, 0]} receiveShadow={receivedShadow}>
        <cylinderGeometry args={[radius, radius, 0.25, 64]} />
        <meshStandardMaterial
          map={felt ?? undefined}
          color={felt ? '#ffffff' : feltColor}
          roughness={0.95}
          metalness={0}
          onBeforeCompile={onFeltCompile}
        />
      </mesh>
    </group>
  );
};

export default ThemedTable;
