import React from 'react';
import { Text } from '@react-three/drei';

type Props = {
    names?: [string,string,string,string];
    color?: string;
};

const PlayersName: React.FC<Props> = ({ names = ['player1','player2','player3','player4'],color= '#84a02b' }) => {
   
    return (
    <group>
      <Text
        color={color} // Default color
        fontSize={0.5}
        anchorX="center" // Horizontal center alignment of the text
        anchorY="middle" // Vertical center alignment of the text
        position={[-6, 5, 0]} // Position of the text in 3D space
        rotation={[-Math.PI/2,0, 3 * Math.PI/2]}
      >
        {names[0]}
      </Text>
      <Text
        color={color}  // Default color
        fontSize={0.5}
        anchorX="center" // Horizontal center alignment of the text
        anchorY="middle" // Vertical center alignment of the text
        position={[0, 5, 9]} // Position of the text in 3D space
        rotation={[-Math.PI/2,0, -2 * Math.PI]}
      >
        {names[1]}
      </Text>
      <Text
        color={color}  // Default color
        fontSize={0.5}
        anchorX="center" // Horizontal center alignment of the text
        anchorY="middle" // Vertical center alignment of the text
        position={[6, 5, 0]} // Position of the text in 3D space
        rotation={[-Math.PI/2,0,  Math.PI/2]}
      >
        {[names[2]]}
      </Text>      
      <Text
        color={color}  // Default color
        fontSize={0.5}
        anchorX="center" // Horizontal center alignment of the text
        anchorY="middle" // Vertical center alignment of the text
        position={[0, 5, -9]} // Position of the text in 3D space
        rotation={[-Math.PI/2,0, 3 * Math.PI]}
      >
        {names[3]}
      </Text>
    </group>
    );
};

export default PlayersName;