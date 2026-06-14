import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// GPU confetti: a single THREE.Points cloud (one draw call). All motion runs in
// the vertex shader from a `uTime` uniform — no per-particle JS each frame, so
// it stays cheap even on phones. Mounted only during a win celebration.
const COUNT = 200;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  attribute vec3 aColor;
  attribute float aSeed;
  attribute float aSpeed;
  varying vec3 vColor;
  varying float vFade;

  void main() {
    vColor = aColor;
    vec3 p = position;
    float t = uTime;
    p.y -= t * aSpeed;                          // fall under gravity
    p.x += sin(t * 2.0 + aSeed * 6.2831) * 1.8; // flutter sideways
    p.z += cos(t * 1.7 + aSeed * 6.2831) * 1.8;
    vFade = clamp(1.0 - t / 3.4, 0.0, 1.0);     // fade out over ~3.4s
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (220.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vFade;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (length(c) > 0.5) discard;               // round flakes
    gl_FragColor = vec4(vColor, vFade);
  }
`;

const PALETTE = ['#ffd24a', '#ff5a7a', '#4ad0ff', '#7dff9b', '#c08bff', '#ffffff'];

const Confetti: React.FC<{ center?: [number, number, number] }> = ({ center = [0, 8, 0] }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const t = useRef(0);

  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    const speeds = new Float32Array(COUNT);
    const col = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      // start in a wide canopy above the table
      positions[i * 3 + 0] = center[0] + (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = center[1] + 8 + Math.random() * 18;
      positions[i * 3 + 2] = center[2] + (Math.random() - 0.5) * 40;
      col.set(PALETTE[(Math.random() * PALETTE.length) | 0]);
      colors[i * 3 + 0] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
      seeds[i] = Math.random();
      speeds[i] = 6 + Math.random() * 7;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    return {
      geometry: g,
      uniforms: { uTime: { value: 0 }, uSize: { value: 1.4 } },
    };
  }, [center]);

  useFrame((_, delta) => {
    t.current += delta;
    if (matRef.current) matRef.current.uniforms.uTime.value = t.current;
  });

  return (
    <points geometry={geometry} raycast={() => null} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        depthTest={false}
      />
    </points>
  );
};

export default Confetti;
