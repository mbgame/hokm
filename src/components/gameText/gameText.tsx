import React from 'react';
import { Text } from '@react-three/drei';


type Props = {
    helperIndex: number;
    reorderCards: () => void;
    startDealing: () => void;
    collectCard: () => void;
    canSort?: boolean;
};

const GameText: React.FC<Props> = ({ helperIndex, reorderCards, startDealing, collectCard, canSort = true }) => {
  return (
    <>
        <Text
            color="#f7c815" // Default color
            fontSize={2}
            anchorX="center" // Horizontal center alignment of the text
            anchorY="middle" // Vertical center alignment of the text
            position={[0, 4.55, 0]} // on the felt, below the cards (no z-fight)
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
            position={[0, 4.55, 1.1]} // on the felt, below the cards (no z-fight)
            rotation={[-Math.PI/2,0,2 * Math.PI]}
        >
            By MBGame
        </Text>

    

    {/* Start moved to a 2D overlay (StartOverlay) */}


       

        {helperIndex === 2 && 
        <>
                <Text
                    color="gold" // Default color
                    fontSize={1}
                    anchorX="center" // Horizontal center alignment of the text
                    anchorY="middle" // Vertical center alignment of the text
                    position={[0, 4.55, -5]} // on the felt, below the cards (no z-fight)
                    rotation={[-Math.PI/2,0, 3 * Math.PI/2]}
                    onPointerOver={() => (document.body.style.cursor = 'pointer')}
                    onPointerOut={() => (document.body.style.cursor = 'default')}
                    onClick={collectCard}
                >
                    Next Turn
                </Text>
            </>
        }

  

        {/* Sort moved to a 2D HUD button (GameHud) so it is reachable on phones */}
    </>
  );
};

export default GameText;