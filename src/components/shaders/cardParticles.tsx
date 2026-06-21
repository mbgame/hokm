import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Sparkles drifting up off a playable card. One THREE.Points (single draw call),
// all motion in the vertex shader from a `uTime` uniform -> no per-frame JS.
// Rendered as a child of the card face so it follows the card. raycast disabled
// so it never intercepts taps.
const COUNT = 14;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  attribute float aSeed;
  varying float vTwinkle;

  void main() {
    vec3 p = position;
    float s = aSeed;
    // rise along the face normal (+z local), looping over ~1.4 units
    float rise = mod(uTime * (0.25 + s * 0.25) + s, 1.0);
    p.z += rise * 1.4;
    // gentle lateral sway
    p.x += sin(uTime * 1.6 + s * 6.2831) * 0.06;
    p.y += cos(uTime * 1.3 + s * 6.2831) * 0.06;
    // fade in low, out high; plus a per-particle twinkle
    float life = sin(rise * 3.14159);
    vTwinkle = life * (0.6 + 0.4 * sin(uTime * 5.0 + s * 12.0));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (60.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vTwinkle;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    // soft round spark
    float a = smoothstep(0.5, 0.0, d) * clamp(vTwinkle, 0.0, 1.0);
    gl_FragColor = vec4(uColor, a);
  }
`;

type Props = {
  /** card face size in world units (width, height) */
  size: [number, number];
  color?: string;
};

const CardParticles: React.FC<Props> = ({ size, color = '#ffe08a' }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const t = useRef(0);

  const { geometry, uniforms } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * size[0];
      positions[i * 3 + 1] = (Math.random() - 0.5) * size[1];
      positions[i * 3 + 2] = 0.02; // start just off the face
      seeds[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    return {
      geometry: g,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 4.5 },
        uColor: { value: new THREE.Color(color) },
      },
    };
  }, [size, color]);

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
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default CardParticles;
