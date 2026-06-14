import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// One-shot expanding shockwave ring, laid flat on the table where a card lands.
// Single additive plane, ~0.8s life, then it calls onDone so the parent can
// unmount it. Pure radial fragment math -> cheap.
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uProgress;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float r = uProgress;                          // ring radius grows 0 -> 1
    float ring = smoothstep(0.10, 0.0, abs(d - r));
    float core = smoothstep(0.5, 0.0, d) * (1.0 - smoothstep(0.0, 0.25, uProgress));
    float fade = 1.0 - uProgress;
    float a = (ring + core * 0.6) * fade;
    gl_FragColor = vec4(uColor, a);
  }
`;

const LIFE = 0.8; // seconds

type Props = {
  position: [number, number, number];
  size?: number;
  color?: string;
  onDone?: () => void;
};

const Burst: React.FC<Props> = ({ position, size = 9, color = '#ffe08a', onDone }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const t = useRef(0);
  const done = useRef(false);

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uColor: { value: new THREE.Color(color) },
    }),
    [color],
  );

  useFrame((_, delta) => {
    if (done.current) return;
    t.current += delta;
    const p = Math.min(1, t.current / LIFE);
    if (matRef.current) matRef.current.uniforms.uProgress.value = p;
    if (p >= 1) {
      done.current = true;
      onDone?.();
    }
  });

  // lie flat on the table surface (rotate the plane to face up)
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
      <planeGeometry args={[size, size]} />
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

export default Burst;
