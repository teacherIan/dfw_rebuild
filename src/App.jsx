import { useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ScrollControls, Scroll, useScroll } from '@react-three/drei'
import { useControls } from 'leva'
import Logo_new from './Logo_new.jsx'
import Gallery from './Gallery.jsx'
import Button3D from './Button3D.jsx'
import Dfw_logo_new from './dfw_logo_new.jsx'

function CameraController() {
  const { camera } = useThree()
  
  const cameraControls = useControls('Camera', {
    enableScrollCamera: { value: false, label: 'Enable Scroll Camera' },
    positionX: { value: -0.2, min: -5, max: 5, step: 0.1, label: 'Position X' },
    positionY: { value: 0.6, min: -5, max: 5, step: 0.1, label: 'Position Y' },
    positionZ: { value: 1.1, min: -5, max: 5, step: 0.1, label: 'Position Z' },
    fov: { value: 48, min: 10, max: 120, step: 1, label: 'Field of View' }
  })
  
  // Only control camera if scroll camera is disabled or for manual positioning
  if (!cameraControls.enableScrollCamera) {
    camera.position.set(
      cameraControls.positionX,
      cameraControls.positionY,
      cameraControls.positionZ
    )
  }
  
  camera.fov = cameraControls.fov
  camera.updateProjectionMatrix()
  
  return null
}

function App() {
  const [showGallery, setShowGallery] = useState(false)

  if (showGallery) {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'auto', background: '#111' }}>
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={() => setShowGallery(false)}
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
    <Canvas camera={{ position: [-0.2, 0.6, 1.1], fov: 48 }} gl={{ antialias: false }}>
      <CameraController />
      
      {/* ScrollControls wraps everything - 3 pages for 3 sections */}
      <ScrollControls pages={3} damping={0.2}>
        <InteractiveLogo />
        
        {/* HTML content that scrolls */}
        <Scroll html style={{ width: '100%' }}>
          <div style={{ width: '100vw', pointerEvents: 'none', touchAction: 'pan-y' }}>
            {/* Section 1 - Initial view */}
            <IntroText />

            {/* Section 2 - Animation phase */}
            <div style={{ height: '100vh', pointerEvents: 'none' }}></div>

            {/* Section 3 - Final view with button */}
            <GalleryButton setShowGallery={setShowGallery} />
          </div>

          {/* Debug indicator */}
          <ScrollDebug />
        </Scroll>
      </ScrollControls>
    </Canvas>
  )
}

// Separate component for intro text with scroll-based fade
function IntroText() {
  const scroll = useScroll()
  
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      width: '100%'
    }}>
      <div style={{ 
        pointerEvents: 'auto',
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '10px',
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '3rem' }}>DFW</h1>
        <p style={{ margin: '10px 0 0 0' }}>Scroll to explore</p>
      </div>
    </div>
  )
}

// Gallery button with scroll-based fade in
function GalleryButton({ setShowGallery }) {
  const scroll = useScroll()
  
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      pointerEvents: 'auto', 
      width: '100%'
    }}>
      <button
        onClick={() => setShowGallery(true)}
        style={{
          pointerEvents: 'auto',
          padding: '20px 40px',
          fontSize: '24px',
          fontWeight: '600',
          cursor: 'pointer',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}
      >
        Enter Gallery
      </button>
    </div>
  )
}

// Logo component that responds to scroll
function InteractiveLogo() {
  return <Dfw_logo_new url="/splats/dfw_logo_new.spz" />
}

// Debug component
function ScrollDebug() {
  const scroll = useScroll()
  
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 1000
    }}>
      Scroll: {(scroll.offset * 100).toFixed(1)}%
    </div>
  )
}

export default App
