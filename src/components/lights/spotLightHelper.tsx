import React, { useRef } from 'react';
import { SpotLight, useHelper } from '@react-three/drei';
import { SpotLight as SpotLightImpl } from 'three';
import { SpotLightHelper } from 'three';
import * as THREE from 'three';

interface SpotLightWithHelperProps {
  position?: [number, number, number];
  angle?: number;
  intensity?: number;
  castShadow?: boolean;
  distance?: number;
  decay?: number;
  penumbra?: number;
  power?: number;
  showHelper?: boolean; // Add the showHelper prop
}

const SpotLightWithHelper: React.FC<SpotLightWithHelperProps> = ({
  position = [0, 5, 0],
  angle = 0.4,
  intensity = 10,
  castShadow = false,
  distance = 20,
  decay = 1,
  penumbra = 2,
  power = 1,
  showHelper = false, // Default value for showHelper
}) => {
  const spotLightRef = useRef<THREE.SpotLight>(null!);

    // useHelper(spotLightRef, SpotLightHelper, 'teal');


  return (
    <SpotLight
      ref={spotLightRef}
      position={position}
      angle={angle}
      intensity={intensity}
      castShadow={castShadow}
      distance={distance}
      decay={decay}
      penumbra={penumbra}
      power={power}
    />
  );
};

export default SpotLightWithHelper;