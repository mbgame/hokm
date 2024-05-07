import React from 'react';
import { Text } from '@react-three/drei';


type Props = {
    helperIndex: number;
    reorderCards: () => void;
    startDealing: () => void;
    collectCard: () => void;
};

const GameText: React.FC<Props> = ({ helperIndex, reorderCards, startDealing, collectCard }) => {
  return (
    <>
        <Text
            color="#f7c815" // Default color
            fontSize={2}
            anchorX="center" // Horizontal center alignment of the text
            anchorY="middle" // Vertical center alignment of the text
            position={[0, 5, 0]} // Position of the text in 3D space
            rotation={[-Math.PI/2,0,2 * Math.PI]}
        >
            HOKM
        </Text>
        <Text
            color="gray" // Default color
            fontSize={0.7}
            letterSpacing={0.3}
            anchorX="center" // Horizontal center alignment of the text
            anchorY="middle" // Vertical center alignment of the text
            position={[0, 5, 1.1]} // Position of the text in 3D space
            rotation={[-Math.PI/2,0,2 * Math.PI]}
        >
            By MBGame
        </Text>

    

    { helperIndex === 0 && 
       <Text
            color="pink" // Default color
            fontSize={0.5}
            anchorX="center" // Horizontal center alignment of the text
            anchorY="middle" // Vertical center alignment of the text
            position={[0, 5, 2]} // Position of the text in 3D space
            rotation={[-Math.PI/2,0,2 * Math.PI]}
            scale={[2,2,2]}
            onClick={startDealing}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = 'default')}
        >
            Start the Game
        </Text>
    }


       

        {helperIndex === 2 && 
        <>
                <Text
                    color="gold" // Default color
                    fontSize={1}
                    anchorX="center" // Horizontal center alignment of the text
                    anchorY="middle" // Vertical center alignment of the text
                    position={[0, 5, -5]} // Position of the text in 3D space
                    rotation={[-Math.PI/2,0, 3 * Math.PI/2]}
                    onPointerOver={() => (document.body.style.cursor = 'pointer')}
                    onPointerOut={() => (document.body.style.cursor = 'default')}
                    onClick={collectCard}
                >
                    Next Turn
                </Text>
            </>
        }

  

        <Text
            color="gold" // Default color
            fontSize={0.5}
            anchorX="center" // Horizontal center alignment of the text
            anchorY="middle" // Vertical center alignment of the text
            position={[-8.5, 5, 6]} // Position of the text in 3D space
            rotation={[-Math.PI/2,0, 3 * Math.PI/2]}
            onClick={reorderCards}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = 'default')}
        >
            Sort Cards
        </Text>
    </>
  );
};

export default GameText;