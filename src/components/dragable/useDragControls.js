import React, { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { useThree } from '@react-three/fiber';

export function useDragControls(objects, enabled = true) {
  const controlsRef = useRef();
  const { gl, camera, scene } = useThree();

  useLayoutEffect(() => {
    if (enabled && objects.length > 0) {
      const controls = new DragControls(objects, camera, gl.domElement);

      controls.addEventListener('dragstart', () => {
        console.log('Drag started');
      });

      controls.addEventListener('drag', () => {
        console.log('Dragging');
      });

      controls.addEventListener('dragend', () => {
        console.log('Drag ended');
      });

      controlsRef.current = controls;

      return () => {
        controls.dispose();
      };
    }
  }, [enabled, objects]);

  useLayoutEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  }, [scene]);

  return controlsRef;
}