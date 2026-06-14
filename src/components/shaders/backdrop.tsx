import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Full-scene backdrop dome. A single inward-facing sphere with a cheap
// procedural gradient + slow drifting glow. Replaces the flat clear color with
// depth, at the cost of one extra draw call and trivial fragment math (no
// post-processing passes -> stays fast on phones).
const vertexShader = /* glsl */ `
  varying vec3 vWorldDir;
  void main() {
    // direction from camera to vertex, used for a stable vertical gradient
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(wp.xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uTop;
  uniform vec3 uBottom;
  uniform vec3 uGlow;
  varying vec3 vWorldDir;

  void main() {
    // vertical gradient (y of the normalized world direction)
    float h = clamp(vWorldDir.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, h));

    // slow drifting glow band that breathes around the horizon
    float band = sin(vWorldDir.x * 2.0 + uTime * 0.15) * 0.5 + 0.5;
    float halo = smoothstep(0.35, 0.0, abs(h - 0.42)) * band;
    col += uGlow * halo * 0.35;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const Backdrop: React.FC = () => {
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTop: { value: new THREE.Color('#04130b') },     // dark green top
      uBottom: { value: new THREE.Color('#0a3d22') },  // felt-ish horizon
      uGlow: { value: new THREE.Color('#1f7d4a') },     // soft green halo
    }),
    [],
  );

  useFrame((_, delta) => {
    if (matRef.current) matRef.current.uniforms.uTime.value += delta;
  });

  return (
    <mesh frustumCulled={false} raycast={() => null}>
      <sphereGeometry args={[120, 24, 16]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
};

export default Backdrop;
