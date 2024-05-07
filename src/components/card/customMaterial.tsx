import * as THREE from 'three';

const CustomMaterialTwoTextures = {
  uniforms: {
    frontTexture: { value: null },
    backTexture: { value: null },
  },
  vertexShader: `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D frontTexture;
    uniform sampler2D backTexture;
    varying vec2 vUv;
    
    void main() {
      if (vUv.x > 1) {
        gl_FragColor = texture2D(frontTexture, vUv);
      } else {
        gl_FragColor = texture2D(backTexture, vUv);
      }
    }
  `,
};

export default CustomMaterialTwoTextures;