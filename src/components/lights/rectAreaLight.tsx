import React, { useRef } from 'react';
import { useHelper } from '@react-three/drei';
import { RectAreaLight, Vector3 } from 'three';
// import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';
import * as THREE from 'three';

interface RectAreaLightWithHelperProps {
  lookat?: [number, number, number];
  position?: [number, number, number];
  intensity?: number;
  castShadow?: boolean;
  power?: number;
  width?: number;
  height?: number;
  helper?: boolean;
}

const RectAreaLightWithHelper: React.FC<RectAreaLightWithHelperProps> = ({
  position = [0, 5, 0],
  lookat = [0, 0, 0],
  intensity = 150,
  castShadow = true,
  power = 100,
  width = 10,
  height = 1,
  helper = false,
}) => {
  const rectAreaLightRef = useRef<THREE.RectAreaLight>(null!);

  // useHelper(rectAreaLightRef, RectAreaLightHelper, helper);

  return (
    <rectAreaLight
      ref={rectAreaLightRef}
      position={position}
      intensity={intensity}
      castShadow={castShadow}
      power={power}
      width={width}
      height={height}
      onUpdate={(self) => self.lookAt(new Vector3(...lookat))}
    />
  );
};

export default RectAreaLightWithHelper;