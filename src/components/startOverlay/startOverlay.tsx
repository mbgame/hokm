import React from 'react';
import { Html } from '@react-three/drei';
import styles from './startOverlay.module.css';

type Props = {
  onStart: () => void;
};

// Gamish 2D start screen, centered in front of the camera, with a pulsing
// attention button.
const StartOverlay: React.FC<Props> = ({ onStart }) => (
  <Html fullscreen zIndexRange={[130, 0]} style={{ pointerEvents: 'none' }}>
    <div className={styles.overlay}>
      <button className={styles.startBtn} onClick={onStart}>Start Game</button>
    </div>
  </Html>
);

export default StartOverlay;
