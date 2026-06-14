import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Additive pulsing glow placed just in front of a playable card. Rendered only
// for legal cards (a handful per turn), so the extra draw calls are negligible.
// Fragment math is a single radial falloff -> cheap. Additive blend + no depth
// write keeps it a pure overlay.
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    // distance from center -> soft rim that fades to the edges
    vec2 p = vUv - 0.5;
    float d = length(p) * 2.0;
    float rim = smoothstep(1.0, 0.55, d);          // bright toward edges, soft center
    float pulse = 0.6 + 0.4 * sin(uTime * 4.0);    // breathing
    float a = rim * pulse * 0.9;
    gl_FragColor = vec4(uColor * (0.6 + pulse * 0.6), a);
  }
`;

type Props = {
  /** card face size in world units (width, height) */
  size: [number, number];
  color?: string;
};

const CardGlow: React.FC<Props> = ({ size, color = '#ffd24a' }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
    }),
    [color],
  );

  useFrame((_, delta) => {
    if (matRef.current) matRef.current.uniforms.uTime.value += delta;
  });

  // Placed BEHIND the card face (negative local z) so the clickable face is
  // always the nearest ray hit — the glow can never win the tap. It reads as a
  // halo bleeding onto the felt around the card edges. raycast also disabled as
  // a second guard.
  return (
    <mesh position={[0, 0, -0.06]} raycast={() => null}>
      <planeGeometry args={[size[0] * 1.25, size[1] * 1.18]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

export default CardGlow;
