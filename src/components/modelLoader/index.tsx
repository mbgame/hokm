import React, { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

type GLTFModelProps = {
  path: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  shadow?: boolean;
  receivedShadow?: boolean;
  onLoaded?: () => void;  // Callback for when loading is complete
};

const ModelLoader: React.FC<GLTFModelProps> = ({
  path,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  shadow = false,
  receivedShadow = false,
  onLoaded
}) => {
  const ref = useRef<any>();
  const { scene, nodes, materials } = useGLTF(path);

  useEffect(() => {
    if (scene) {
      // Setup the model (scale, position, rotation)
      ref.current.scale.set(...scale);
      ref.current.position.set(...position);
      ref.current.rotation.set(...rotation);

      // Apply shadow properties to all mesh children
      scene.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = shadow;
          child.receiveShadow = receivedShadow;
        }
      });

      // Call the onLoaded callback if provided
      if (onLoaded) {
        onLoaded();
      }
    }
  }, [scene, nodes, materials, position, rotation, scale, shadow, receivedShadow, onLoaded]);

  return scene ? (
    <primitive ref={ref} object={scene} dispose={null} />
  ) : null;
};

export default ModelLoader;