import React from "react";
import { useThree } from '@react-three/fiber';
import { useGesture } from "@use-gesture/react";
import { useSpring, a } from "@react-spring/three";

type Props = {
  children: string | JSX.Element | JSX.Element[];
};

export function Dragable({children}: Props) {
  const { viewport } = useThree();
  const [spring, set] = useSpring(() => ({ scale: [1, 1, 1], position: [0, 0, 0], rotation: [0, 0, 0], config: { friction: 20 } }));

  // Adjust the sensitivity factor to control how much the object moves in relation to mouse movement.
  const sensitivity = 5000; // Adjust this value to control the drag sensitivity.

  const bind = useGesture({
    onDrag: ({ offset: [x, y] }) => {
      // Convert the drag offset to a more suitable scale for your scene.
      const calculatedX = (x / sensitivity) * viewport.factor;
      const calculatedY = (2 * y / sensitivity) * viewport.factor;

      // Apply the calculated position adjustments.
      // Note: Adjusting these values or adding constraints might be necessary depending on your specific requirements.
      set({ position: [-calculatedX, 0, -calculatedY] });
    },
    onHover: ({ hovering }) => set({ scale: hovering ? [1 , 1, 1 ] : [1, 1, 1] })
  });

  return (
    <mesh></mesh>
    // <mesh {...spring} {...bind()} castShadow>
    //   {children}
    // </mesh>
  );
}