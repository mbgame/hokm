import React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Lightweight card table: a felt top + wooden rim built from primitives.
// Replaces the ~30MB GLTF model. The felt is a small procedural CanvasTexture
// (generated in-browser, no asset download), so load time stays near-zero.
function makeFeltTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#0b5d2e';
  ctx.fillRect(0, 0, size, size);
  // fine speckle to read as cloth
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
  tex.anisotropy = 8; // crisp felt at grazing table angles (cheap)
  return tex;
}

type Props = {
  position?: [number, number, number];
  radius?: number;
  receivedShadow?: boolean;
};

const Table: React.FC<Props> = ({ position = [0, 4.2, 0], radius = 14, receivedShadow = false }) => {
  const felt = React.useMemo(makeFeltTexture, []);

  // shared time uniform driving the felt's animated center glow / sheen
  const uTime = React.useRef({ value: 0 });

  // Patch the standard material so it KEEPS real lighting + shadow receiving
  // (cards cast shadows onto the felt) while adding a soft animated radial glow
  // toward table center. onBeforeCompile injects a few lines of GLSL — far
  // cheaper than a full-screen post-processing pass.
  const onFeltCompile = React.useCallback(
    (shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.uniforms.uTime = uTime.current;
      shader.uniforms.uRadius = { value: radius };
      shader.vertexShader =
        'varying vec2 vFeltXZ;\n' +
        shader.vertexShader.replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vec4 feltWp = modelMatrix * vec4(transformed, 1.0);
           vFeltXZ = feltWp.xz;`,
        );
      shader.fragmentShader =
        'uniform float uTime;\nuniform float uRadius;\nvarying vec2 vFeltXZ;\n' +
        shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>
           float feltDist = length(vFeltXZ) / uRadius;
           float feltGlow = smoothstep(0.95, 0.0, feltDist);
           float feltSheen = 0.5 + 0.5 * sin(uTime * 0.5);
           gl_FragColor.rgb += vec3(0.04, 0.22, 0.11) * feltGlow * (0.55 + 0.35 * feltSheen);`,
        );
    },
    [radius],
  );

  useFrame((_, delta) => {
    uTime.current.value += delta;
  });

  return (
    <group position={position}>
      {/* wooden rim / apron */}
      <mesh position={[0, -0.2, 0]} receiveShadow={receivedShadow}>
        <cylinderGeometry args={[radius + 0.7, radius + 1.1, 0.8, 64]} />
        <meshStandardMaterial color="#5b3a1e" roughness={0.75} metalness={0.05} />
      </mesh>
      {/* felt playing surface */}
      <mesh position={[0, 0.22, 0]} receiveShadow={receivedShadow}>
        <cylinderGeometry args={[radius, radius, 0.25, 64]} />
        <meshStandardMaterial
          map={felt ?? undefined}
          color={felt ? '#ffffff' : '#0b5d2e'}
          roughness={0.95}
          metalness={0}
          onBeforeCompile={onFeltCompile}
        />
      </mesh>
    </group>
  );
};

export default Table;
