import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Button3D({ onClick, position = [0, -0.3, 0], text = "Enter Gallery" }) {
  const meshRef = useRef()
  const textRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current && hovered) {
      // Subtle hover animation
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.02)
    }
  })

  return (
    <group position={position}>
      {/* Button background plane */}
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <planeGeometry args={[1.2, 0.3]} />
        <meshBasicMaterial 
          color={hovered ? "#1a1a1a" : "#000000"}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Text */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[1.15, 0.25]} />
        <meshBasicMaterial transparent opacity={0}>
          <canvasTexture 
            attach="map" 
            ref={textRef}
            image={createTextCanvas(text, hovered)}
          />
        </meshBasicMaterial>
      </mesh>
    </group>
  )
}

function createTextCanvas(text, hovered) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext('2d')

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw text
  ctx.fillStyle = hovered ? '#ffffff' : '#dddddd'
  ctx.font = 'bold 48px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)

  return canvas
}

export default Button3D
