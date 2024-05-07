// Floor.tsx
import { PlaneGeometry } from 'three'
import { useTexture } from "@react-three/drei";
import * as THREE from 'three'

interface FloorProps {
  width: number
  height: number
  texturePath: string
  textureRepeat: [number, number]
  receivedShadow?: boolean
}

const Floor = ({ width, height, texturePath, receivedShadow = false, textureRepeat }: FloorProps) => {

  const props = useTexture({
    map: `/textures/${texturePath}/albedo.png`,
    displacementMap: `/textures/${texturePath}/height.png`,
    normalMap: `/textures/${texturePath}/normal.png`,
    roughnessMap: `/textures/floor/roughness.png`,
    aoMap: `/textures/${texturePath}/ao.png`,
  })

  return (
    <mesh
      geometry={new PlaneGeometry(width, height)}
      position={[0, -2.3, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow= {receivedShadow}
    >
    <meshStandardMaterial
          {...props}
          side={THREE.DoubleSide}
        />
    </mesh>
  )
}

export default Floor