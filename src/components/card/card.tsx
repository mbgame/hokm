import React, {useRef, useState, useEffect} from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, DoubleSide } from 'three';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';

interface CardProps {

  type: string; // Type of card (heart, spade , ..)
  number: string; // number of card (e.g., Ace, King, Queen, numbers)
  width?: number; // Width of the card
  height?: number; // Height of the card
  shadow?:boolean;
  position?: [number, number, number]; // Position of the card in 3D space (default: [0, 0, 0])
  rotation?: [number, number, number]; // Rotation of the card in 3D space (default: [0, 0, 0])
  scale?: [number, number, number]; // Scale of the card in 3D space (default: [1, 1, 1])
  animate?: boolean;
  animatePos?: [number,number, number];
  animateRotation?: [number,number, number];
  cardIndex:number;
  gameIndex:number;
  animationIndex:number;
  currentSet?:boolean;
  onAnimationComplete: () => void;
  setPlayerCard: (type:any,number:any) => void;
}

const Card: React.FC<CardProps> = ({ type, number , width = 10, height = 15,  position = [0, 0, 0], rotation = [0, 0, 0] , 
    scale = [1, 1, 1], shadow = false , animate = false, animatePos= [0,0,0], animateRotation = [0,0,0], onAnimationComplete,setPlayerCard,
   cardIndex , gameIndex , animationIndex, currentSet=false}) => {
  const frontTexture = useLoader(TextureLoader, `/textures/cards/${number}_of_${type}.png`);
  const backTexture = useLoader(TextureLoader, `/textures/cards/back.png`);
  const meshRef = useRef<THREE.Mesh>(null!);
  const [isAnimating, setIsAnimating] = useState(animate);

  useEffect(() => {
    setIsAnimating(animate);
  }, [animate]);


  useFrame(({ clock }) => {
    if (isAnimating) {
      gsap.timeline({
        onComplete: onAnimationComplete, // notify parent component when animation completes
      })
        .to(meshRef.current.position, {
          duration: gameIndex ? 0.5 : 0.1,
          delay: 0.1,
          x: animatePos[0],
          y: animatePos[1],
          z: animatePos[2],
        })

        gsap.to(meshRef.current.rotation, {
          duration: gameIndex ? 0.5 : 0.1,
          delay: 0.01,
          x: animateRotation[0],
          y: animateRotation[1],
          z: animateRotation[2],
        })

    }
  });

 
  return (
<mesh position={position} rotation={rotation} scale={scale} ref={meshRef}
    onClick={(event) => {
      console.log(currentSet)
      event.stopPropagation();
      if(gameIndex === 1 && cardIndex <=12 && !currentSet){
        setPlayerCard(type,number);
        setIsAnimating(true);
      }
    }}
>
      <Plane args={[width / 10, height / 10]} castShadow = {shadow}>
        <meshPhysicalMaterial
          attach="material"
          map={frontTexture}
          side={DoubleSide}
          clearcoat={1.0} // this makes the material fully reflective like a clear coat of varnish. Range is 0-1.
          clearcoatRoughness={0.0} // this makes the clear coat perfectly smooth for sharp reflections. Range is 0-1.
          metalness={0.0} // this makes the material non-metallic. Range is 0-1.
        />
      </Plane>
      <Plane args={[width / 10, height / 10]} position={[0, 0, -0.01]}>
        <meshPhysicalMaterial
          attach="material"
          map={backTexture}
          side={DoubleSide}
          clearcoat={1.0} // this makes the material fully reflective like a clear coat of varnish. Range is 0-1.
          clearcoatRoughness={0.0} // this makes the clear coat perfectly smooth for sharp reflections. Range is 0-1.
          metalness={0.0} // this makes the material non-metallic. Range is 0-1.
        />
      </Plane>
    </mesh>
  );
};

export default Card;