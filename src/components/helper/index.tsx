import React, { useRef, useEffect } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type HelperPointerProps = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  animationSpeed: number;
};

const HelperPointer: React.FC<HelperPointerProps> = ({
  position,
  rotation,
  scale,
  color,
  animationSpeed,
}) => {
  const meshRef = useRef<THREE.Group>(null!);

  useEffect(() => {
    const myMesh = meshRef.current;
    return () => {
      if (myMesh) {
        myMesh.scale.y = 1;
      }
    };
  }, [meshRef]);

  let speed = 0;
  useFrame(() => {
    if (meshRef.current) {
        speed += animationSpeed;

    //   meshRef.current.scale.z = Math.sin(Math.PI * speed);
      meshRef.current.scale.y =  Math.cos(Math.PI * speed) + 4;
    }
  });

  return (
    <group ref={meshRef}  
            position={position}
            rotation={rotation}
            scale={scale}>
        <mesh>
        <coneGeometry args={[0.5,0.5, 32]} />
        <meshPhongMaterial color={color} />
        </mesh>
    </group>
   
  );
};

export default HelperPointer;