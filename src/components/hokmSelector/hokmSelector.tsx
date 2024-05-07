import React from 'react';
import { TextureLoader, Texture } from 'three';
import { useLoader } from '@react-three/fiber';
import { Text } from '@react-three/drei';

type Suit = 'hearts' | 'spades' | 'clubs' | 'diamonds';
const suits: Suit[] = ['hearts', 'spades', 'clubs', 'diamonds'];
type Props = {
    handleHokm: (suit: Suit) => void;
};

const HokmSelector: React.FC<Props> = ({ handleHokm }) => {
    const textures = {
        hearts: useLoader(TextureLoader, `/textures/hokm/heart.png`),
        spades: useLoader(TextureLoader, `/textures/hokm/spade.png`),
        clubs: useLoader(TextureLoader, `/textures/hokm/club.png`),
        diamonds: useLoader(TextureLoader, `/textures/hokm/diamond.png`),
    };

    const createCardMeshWithHandler = (position: [number, number, number], suit: Suit) => (
        <mesh
            onClick={() => handleHokm(suit)}
            position={position}
            rotation={[0, -Math.PI / 2, 0]}
        >
            <boxGeometry args={[2, 0.1, 2]} />
            <meshPhongMaterial color='white' map={textures[suit]} />
        </mesh>
    );

    return (
        <>
            <Text
                color="gold"
                fontSize={1}
                anchorX="center"
                anchorY="middle"
                position={[3, 5, -5]}
                rotation={[-Math.PI / 2, 0, 3 * Math.PI / 2]}
            >
                Select Hokm
            </Text>
            <group
                onPointerOver={() => (document.body.style.cursor = 'pointer')}
                onPointerOut={() => (document.body.style.cursor = 'default')}
            >
                {Object.values(suits).map((suit, index) => (
                    <React.Fragment key={suit}>
                        {createCardMeshWithHandler(index % 2 === 0 ? [1, 5, -3.5 - index * 1.5] : [-2, 5, -2 - index * 1.5], suit)}
                    </React.Fragment>
                ))}
            </group>
        </>
    );
};

export default HokmSelector;