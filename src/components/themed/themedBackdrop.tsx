import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Parametric backdrop dome (top/bottom gradient + drifting glow band). Same
// shader as Hokm's Backdrop but colors are props so each game gets its own mood.

const vertexShader = /* glsl */ `
  varying vec3 vWorldDir;
  void main() {
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
    float h = clamp(vWorldDir.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(uBottom, uTop, smoothstep(0.0, 1.0, h));
    float band = sin(vWorldDir.x * 2.0 + uTime * 0.15) * 0.5 + 0.5;
    float halo = smoothstep(0.35, 0.0, abs(h - 0.42)) * band;
    col += uGlow * halo * 0.35;
    gl_FragColor = vec4(col, 1.0);
  }
`;

type Props = { top?: string; bottom?: string; glow?: string };

const ThemedBackdrop: React.FC<Props> = ({
  top = '#04130b', bottom = '#0a3d22', glow = '#1f7d4a',
}) => {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTop: { value: new THREE.Color(top) },
      uBottom: { value: new THREE.Color(bottom) },
      uGlow: { value: new THREE.Color(glow) },
    }),
    [top, bottom, glow],
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

export default ThemedBackdrop;
