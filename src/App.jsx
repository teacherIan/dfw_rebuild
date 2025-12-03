import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Root, Container, Text } from '@react-three/uikit'
import { Button } from '@react-three/uikit-default'
import Logo_new from './Logo_new.jsx'
import Gallery from './Gallery.jsx'

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
      <Root sizeX={1} sizeY={1} pixelSize={0.01} anchorX="center" anchorY="center">
        <Container flexDirection="column" alignItems="center" width="100%" height="100%" justifyContent="center" gap={10}>
          <Logo_new url="/splats/dfw_rotation_fixed.spz" animating={animating} />
          <Container flexDirection="column" alignItems="center" justifyContent="center" gap={20}>
             <Button variant='outline' positionZ={-50} onClick={() => {
               setAnimating(false)
               // Wait for animation to finish before showing gallery
               setTimeout(() => setShowGallery(true), 1000)
             }}>
               <Text>Enter Gallery</Text>
             </Button>
          </Container>
        </Container>
      </Root>
      <OrbitControls />
    </Canvas>
  )
}

export default App
