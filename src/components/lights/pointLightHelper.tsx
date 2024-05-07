import React, { useRef } from 'react';
import { useHelper } from '@react-three/drei';
import { PointLightHelper } from 'three';
import * as THREE from 'three'

interface PointLightWithHelperProps {
  position?: [number, number, number];
  angle?: number;
  intensity?: number;
  castShadow?: boolean;
  distance?: number;
  decay?: number;
  penumbra?: number;
  power?: number;
}

const PointLightWithHelper: React.FC<PointLightWithHelperProps> = ({
  position = [0, 5, 0],
  intensity = 10,
  castShadow = true,
  distance = 20,
  decay = 1,
  power = 1,
}) => {
  const pointLightRef = useRef<THREE.PointLight>(null!);

  useHelper(pointLightRef, PointLightHelper, 0.5); // Change the third argument to the size of the helper sphere

  return (
    <pointLight
      ref={pointLightRef}
      position={position}
      intensity={intensity}
      castShadow={castShadow}
      distance={distance}
      decay={decay}
      power={power}
      shadow-mapSize-width={1024} 
      shadow-mapSize-height={1024}
    />
  );
};

export default PointLightWithHelper;