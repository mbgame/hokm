import React, {useRef, useState, useEffect, useMemo} from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, DoubleSide } from 'three';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ATLAS_URL, cardName, indexOf, uvFor } from './atlasLayout';
import CardGlow from '../shaders/cardGlow';

// Build a texture sampling one cell of the shared atlas (clones share the GPU
// image, so the whole deck is a single texture upload).
function atlasCell(atlas: THREE.Texture, name: string): THREE.Texture {
  const t = atlas.clone();
  const uv = uvFor(indexOf(name));
  t.repeat.set(uv.repeatX, uv.repeatY);
  t.offset.set(uv.offsetX, uv.offsetY);
  t.colorSpace = THREE.SRGBColorSpace;
  // anisotropic filtering keeps the face crisp at grazing angles (cheap)
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

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
  canPlay?:boolean;
  onAnimationComplete: () => void;
  setPlayerCard: (type:any,number:any) => void;
}

const Card: React.FC<CardProps> = ({ type, number , width = 10, height = 15,  position = [0, 0, 0], rotation = [0, 0, 0] ,
    scale = [1, 1, 1], shadow = false , animate = false, animatePos= [0,0,0], animateRotation = [0,0,0], onAnimationComplete,setPlayerCard,
   cardIndex , gameIndex , animationIndex, currentSet=false, canPlay=true}) => {
  const atlas = useLoader(TextureLoader, ATLAS_URL);
  const frontTexture = useMemo(() => atlasCell(atlas, cardName(type, number)), [atlas, type, number]);
  const backTexture = useMemo(() => atlasCell(atlas, 'back'), [atlas]);
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
      if(gameIndex === 1 && cardIndex <=12 && canPlay){
        setPlayerCard(type,number);
        setIsAnimating(true);
      }
    }}
>
      <Plane args={[width / 10, height / 10]} castShadow = {shadow}>
        {/* standard material + a soft env reflection instead of the costly
            clearcoat lobe — cards are flat so the clearcoat was invisible. */}
        <meshStandardMaterial
          attach="material"
          map={frontTexture}
          side={DoubleSide}
          roughness={0.6}
          metalness={0.0}
          envMapIntensity={0.3}
        />
        {/* pulsing halo on cards the human may legally play this turn */}
        {gameIndex === 1 && cardIndex <= 12 && canPlay && (
          <CardGlow size={[width / 10, height / 10]} />
        )}
      </Plane>
      <Plane args={[width / 10, height / 10]} position={[0, 0, -0.01]}>
        <meshStandardMaterial
          attach="material"
          map={backTexture}
          side={DoubleSide}
          roughness={0.6}
          metalness={0.0}
          envMapIntensity={0.3}
        />
      </Plane>
    </mesh>
  );
};

export default Card;