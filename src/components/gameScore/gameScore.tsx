import React from 'react';
import { Text } from '@react-three/drei';

interface GameScore {
    [key: string]: number;
  }

type Props = {
  gameScore?: GameScore;
  color?: string;
  title?: string;
  titleColor?: string;
  names?: [string,string,string,string];
  /** When provided, show team totals (You+Partner vs Opponents) instead of 4 players. */
  teams?: { yours: number; opponent: number };
  collectCard: () => void;
};

const GameScore: React.FC<Props> = ({
    collectCard, gameScore = { player1: 0, player2: 0, player3: 0, player4: 0 },
    color = '#84a02b', names = ['player1','player2','player3','player4'] ,
    title = 'Game Score',titleColor = 'green', teams
}) => {
  if (teams) {
    return (
      <group>
        <Text color={titleColor} fontSize={0.7} anchorX="center" anchorY="middle"
          position={[-2, 5, -5]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]} onClick={collectCard}>
          {title}
        </Text>
        <Text color={color} fontSize={0.6} anchorX="center" anchorY="middle"
          position={[-3.2, 5, -5]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]} onClick={collectCard}>
          {`Your Team : ${teams.yours}`}
        </Text>
        <Text color="#c0532b" fontSize={0.6} anchorX="center" anchorY="middle"
          position={[-4.2, 5, -5]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]} onClick={collectCard}>
          {`Opponent : ${teams.opponent}`}
        </Text>
      </group>
    );
  }
  return (
    <group>
      <Text
        color={titleColor} // Default color
        fontSize={0.7}
        anchorX="center" // Horizontal center alignment of the text
        anchorY="middle" // Vertical center alignment of the text
        position={[-2, 5, -5]} // Position of the text in 3D space
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        onClick={collectCard}
      >
        ${title}
      </Text>
      <Text
        color={color} // Default color
        fontSize={0.5}
        anchorX="center" // Horizontal center alignment of the text
        anchorY="middle" // Vertical center alignment of the text
        position={[-3, 5, -5]} // Position of the text in 3D space
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        onClick={collectCard}
      >
        {`${names[0]} : ${gameScore.player1}`}
      </Text>
      <Text
        color={color} // Default color
        fontSize={0.5}
        anchorX="center" // Horizontal center alignment of the text
        anchorY="middle" // Vertical center alignment of the text
        position={[-4, 5, -5]} // Position of the text in 3D space
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        onClick={collectCard}
      >
        {`${names[1]} : ${gameScore.player2}`}
      </Text>
      <Text
        color={color} // Default color
        fontSize={0.5}
        anchorX="center" // Horizontal center alignment of the text
        anchorY="middle" // Vertical center alignment of the text
        position={[-5, 5, -5]} // Position of the text in 3D space
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        onClick={collectCard}
      >
        {`${names[2]} : ${gameScore.player3}`}
      </Text>
      <Text
        color={color} // Default color
        fontSize={0.5}
        anchorX="center" // Horizontal center alignment of the text
        anchorY="middle" // Vertical center alignment of the text
        position={[-6, 5, -5]} // Position of the text in 3D space
        rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
        onClick={collectCard}
      >
        {`${names[3]} : ${gameScore.player4}`}
      </Text>
    </group>
  );
};

export default GameScore;