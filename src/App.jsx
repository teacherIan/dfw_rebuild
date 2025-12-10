import { useState, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { useControls } from 'leva'
import Logo_new from './Logo_new.jsx'
import Gallery from './Gallery.jsx'
import Button3D from './Button3D.jsx'
import Dfw_logo_new from './dfw_logo_new.jsx'

function CameraController() {
  const { camera } = useThree()
  
  const cameraControls = useControls('Camera', {
    positionX: { value: -0.2, min: -5, max: 5, step: 0.1, label: 'Position X' },
    positionY: { value: 0.6, min: -5, max: 5, step: 0.1, label: 'Position Y' },
    positionZ: { value: 1.1, min: -5, max: 5, step: 0.1, label: 'Position Z' },
    fov: { value: 48, min: 10, max: 120, step: 1, label: 'Field of View' }
  })
  
  camera.position.set(
    cameraControls.positionX,
    cameraControls.positionY,
    cameraControls.positionZ
  )
  camera.fov = cameraControls.fov
  camera.updateProjectionMatrix()
  
  return null
}

function App() {
  const [animating, setAnimating] = useState(true)
  const [showGallery, setShowGallery] = useState(false)

  if (showGallery) {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'auto', background: '#111' }}>
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={() => {
              setShowGallery(false)
              setAnimating(true)
            }}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              background: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Back to 3D View
          </button>
        </div>
        <Gallery />
      </div>
    )
  }

  return (
    <Canvas camera={{ position: [0, 0, 1], fov: 60 }}>
      <CameraController />
      {/* <Logo_new url="/splats/dfw_rotation_fixed.spz" animating={animating} /> */}
      <Dfw_logo_new url="/splats/dfw_logo_new.spz" animating={animating} />
      
      
      {/* <group position={[0, -0.3, 0]}>
        <mesh
          onClick={() => {
            setAnimating(false)
            setTimeout(() => setShowGallery(true), 1000)
          }}
          onPointerOver={(e) => {
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={(e) => {
            document.body.style.cursor = 'default'
          }}
        >
          <planeGeometry args={[1.5, 0.4]} />
          <meshBasicMaterial 
            color="#000000"
            transparent
            opacity={0.85}
            depthTest={true}
            depthWrite={true}
          />
        </mesh>
        
        <Text
          position={[0, 0, 0.001]}
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="middle"
          depthTest={true}
          depthWrite={true}
        >
          Enter Gallery
        </Text>
      </group> */}
      
      <OrbitControls />
    </Canvas>
  )
}

export default App
