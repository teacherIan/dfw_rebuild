import { useState, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { ScrollControls, Scroll, useScroll } from '@react-three/drei'
import { useControls } from 'leva'
import * as THREE from 'three'
import Logo_new from './Logo_new.jsx'
import Gallery from './Gallery.jsx'
import Button3D from './Button3D.jsx'
import Dfw_logo_new from './dfw_logo_new.jsx'
import Chair3D from './Chair3D.jsx'
import CoffeeTable3D from './CoffeeTable3D.jsx'
import SpriteText from './SpriteText.jsx'

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
  const [spriteData, setSpriteData] = useState(null)
  
  // Load spritesheet JSON
  useEffect(() => {
    fetch('/splats/spritesheet/spritesheet.json')
      .then(res => res.json())
      .then(data => setSpriteData(data))
      .catch(err => console.error('Failed to load spritesheet:', err))
  }, [])

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
    <Canvas 
      camera={{ position: [-0.2, 0.6, 1.1], fov: 48 }} 
      gl={{ antialias: false }}
      style={{ scrollSnapType: 'y mandatory' }}
    >
      <CameraController />
      
      {/* ScrollControls wraps everything - 3 pages for 3 sections */}
      <ScrollControls pages={3} damping={0.25}>
        <InteractiveLogo spriteData={spriteData} />
        
        {/* HTML content that scrolls */}
        <Scroll html style={{ width: '100%' }}>
          <div style={{ 
            width: '100vw', 
            pointerEvents: 'none',
            scrollSnapType: 'y mandatory',
            height: '100%'
          }}>
            {/* Section 1 (0-33%): DFW Logo Introduction */}
            <IntroSection />

            {/* Section 2 (33-66%): Chair Showcase */}
            <ChairSection setShowGallery={setShowGallery} />

            {/* Section 3 (66-100%): Table Showcase */}
            <TableSection setShowGallery={setShowGallery} />
          </div>

          {/* Debug indicator */}
          <ScrollDebug />
        </Scroll>
      </ScrollControls>
    </Canvas>
  )
}

// Section 1: DFW Logo Introduction (0-33% scroll)
function IntroSection() {
  const scroll = useScroll()
  const [opacity, setOpacity] = useState(1)
  
  useEffect(() => {
    if (!scroll) return
    const unsubscribe = scroll.onChange(() => {
      const offset = scroll.offset
      // Fade out as we scroll away from first section (0-0.33)
      const fadeOut = offset < 0.33 ? 1 - (offset / 0.33) * 0.7 : 0.3
      setOpacity(fadeOut)
    })
    return () => unsubscribe?.()
  }, [scroll])
  
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      width: '100%',
      scrollSnapAlign: 'start',
      opacity
    }}>
      <div style={{ 
        pointerEvents: 'auto',
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '10px',
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '3rem' }}>Doug's Found Wood</h1>
        <p style={{ margin: '10px 0 0 0', fontSize: '1.2rem' }}>Handcrafted furniture from reclaimed wood</p>
        <p style={{ margin: '20px 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>↓ Scroll to explore ↓</p>
      </div>
    </div>
  )
}

// Section 2: Chair Showcase (33-66% scroll)
function ChairSection({ setShowGallery }) {
  const scroll = useScroll()
  const [opacity, setOpacity] = useState(0)
  const [scale, setScale] = useState(0.8)
  
  useEffect(() => {
    if (!scroll) return
    const unsubscribe = scroll.onChange(() => {
      const offset = scroll.offset
      // Visible between 0.25 and 0.66
      if (offset >= 0.25 && offset <= 0.66) {
        const sectionProgress = (offset - 0.25) / 0.41
        setOpacity(Math.min(1, sectionProgress * 3))
        setScale(0.8 + sectionProgress * 0.2)
      } else if (offset > 0.66) {
        setOpacity(Math.max(0, 1 - (offset - 0.66) * 3))
      } else {
        setOpacity(0)
      }
    })
    return () => unsubscribe?.()
  }, [scroll])
  
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      width: '100%',
      scrollSnapAlign: 'start',
      opacity,
      transform: `scale(${scale})`,
      transition: 'transform 0.1s ease-out'
    }}>
      <div style={{
        pointerEvents: 'auto',
        padding: '30px 40px',
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '12px',
        color: 'white',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '2.5rem' }}>Adirondack Chairs</h2>
        <p style={{ margin: '0 0 25px 0', fontSize: '1.1rem', lineHeight: '1.6' }}>
          Classic comfort meets rustic beauty. Each chair is handcrafted from reclaimed wood.
        </p>
        <button
          onClick={() => setShowGallery(true)}
          style={{
            pointerEvents: 'auto',
            padding: '15px 35px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer',
            background: '#8B4513',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
          onMouseOver={(e) => e.target.style.background = '#A0522D'}
          onMouseOut={(e) => e.target.style.background = '#8B4513'}
        >
          View Chair Gallery
        </button>
      </div>
    </div>
  )
}

// Section 3: Table Showcase (66-100% scroll)
function TableSection({ setShowGallery }) {
  const scroll = useScroll()
  const [opacity, setOpacity] = useState(0)
  const [scale, setScale] = useState(0.8)
  
  useEffect(() => {
    if (!scroll) return
    const unsubscribe = scroll.onChange(() => {
      const offset = scroll.offset
      // Visible from 0.6 onwards
      if (offset >= 0.6) {
        const sectionProgress = (offset - 0.6) / 0.4
        setOpacity(Math.min(1, sectionProgress * 3))
        setScale(0.8 + sectionProgress * 0.2)
      } else {
        setOpacity(0)
      }
    })
    return () => unsubscribe?.()
  }, [scroll])
  }, [scroll])
  
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      width: '100%',
      scrollSnapAlign: 'start',
      opacity,
      transform: `scale(${scale})`,
      transition: 'transform 0.1s ease-out'
    }}>
      <div style={{
        pointerEvents: 'auto',
        padding: '30px 40px',
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '12px',
        color: 'white',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '2.5rem' }}>Coffee Tables</h2>
        <p style={{ margin: '0 0 25px 0', fontSize: '1.1rem', lineHeight: '1.6' }}>
          Functional art for your living space. Crafted from reclaimed wood with character.
        </p>
        <button
          onClick={() => setShowGallery(true)}
          style={{
            pointerEvents: 'auto',
            padding: '15px 35px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer',
            background: '#8B4513',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
          onMouseOver={(e) => e.target.style.background = '#A0522D'}
          onMouseOut={(e) => e.target.style.background = '#8B4513'}
        >
          View Table Gallery
        </button>
      </div>
    </div>
  )
}

// Logo component that responds to scroll
function InteractiveLogo({ spriteData }) {
  const textControls = useControls('Sprite Text', {
    text: { value: 'DOUGS FOUND WOOD', label: 'Text' },
    posX: { value: 0, min: -5, max: 5, step: 0.1, label: 'Position X' },
    posY: { value: -0.5, min: -5, max: 5, step: 0.1, label: 'Position Y' },
    posZ: { value: 0, min: -5, max: 5, step: 0.1, label: 'Position Z' },
    scale: { value: 0.05, min: 0.01, max: 0.5, step: 0.01, label: 'Scale' },
    spacing: { value: 1, min: 0.1, max: 3, step: 0.1, label: 'Letter Spacing' },
    rotX: { value: 0, min: -180, max: 180, step: 1, label: 'Rotation X' },
    rotY: { value: 0, min: -180, max: 180, step: 1, label: 'Rotation Y' },
    rotZ: { value: 0, min: -180, max: 180, step: 1, label: 'Rotation Z' },
    lookAtCamera: { value: true, label: 'Look at Camera' },
    renderOrder: { value: 0, min: -100, max: 100, step: 1, label: 'Render Order' }
  })
  
  return (
    <>
      <Dfw_logo_new url="/splats/dfw_logo_new.spz" />
      <Chair3D url="/splats/chair_no_bg.spz" />
      <CoffeeTable3D url="/splats/coffee_table_fixed.spz" />
      
      {/* Debug cube and sprite text */}
      {spriteData && (
        <>
          <SpriteText 
            text={textControls.text} 
            position={[textControls.posX, textControls.posY, textControls.posZ]}
            scale={textControls.scale} 
            spacing={textControls.spacing}
            rotation={[
              THREE.MathUtils.degToRad(textControls.rotX),
              THREE.MathUtils.degToRad(textControls.rotY),
              THREE.MathUtils.degToRad(textControls.rotZ)
            ]}
            lookAtCamera={textControls.lookAtCamera}
            renderOrder={textControls.renderOrder}
            spriteData={spriteData}
          />
        </>
      )}
    </>
  )
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
