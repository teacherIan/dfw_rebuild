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
import { SCENE_ORDER, clamp01, useScrollOffsetValue, useScrollSnap } from './scrollSync.js'

// Hook for centralized scene sync controls
function useSceneSyncControls() {
  return useControls('Scene Sync', {
    // Logo/Intro timing
    logoFadeStart: { value: 0.25, min: 0, max: 0.5, step: 0.01, label: 'Logo Fade Start' },
    logoFadeEnd: { value: 0.45, min: 0.2, max: 0.6, step: 0.01, label: 'Logo Fade End' },
    
    // Chair timing  
    chairEnterStart: { value: 0.30, min: 0.1, max: 0.5, step: 0.01, label: 'Chair Enter Start' },
    chairEnterEnd: { value: 0.50, min: 0.3, max: 0.7, step: 0.01, label: 'Chair Enter End' },
    chairExitStart: { value: 0.70, min: 0.5, max: 0.9, step: 0.01, label: 'Chair Exit Start' },
    chairExitEnd: { value: 0.85, min: 0.6, max: 1.0, step: 0.01, label: 'Chair Exit End' },
    
    // Table timing
    tableEnterStart: { value: 0.65, min: 0.5, max: 0.9, step: 0.01, label: 'Table Enter Start' },
    tableEnterEnd: { value: 0.85, min: 0.6, max: 1.0, step: 0.01, label: 'Table Enter End' },
  })
}

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
        <ScrollSceneManager />
        <InteractiveLogo spriteData={spriteData} />
        
        {/* HTML content that scrolls */}
        <Scroll html style={{ width: '100%' }}>
          <HtmlSections setShowGallery={setShowGallery} />

          {/* Debug indicator */}
          <ScrollDebug />
        </Scroll>
      </ScrollControls>
    </Canvas>
  )
}

function ScrollSceneManager() {
  useScrollSnap(SCENE_ORDER)
  return null
}

function HtmlSections({ setShowGallery }) {
  const offset = useScrollOffsetValue()

  return (
    <div style={{ 
      width: '100vw', 
      pointerEvents: 'none',
      scrollSnapType: 'y mandatory',
      height: '100%'
    }}>
      <IntroSection offset={offset} />
      <ChairSection offset={offset} setShowGallery={setShowGallery} />
      <TableSection offset={offset} setShowGallery={setShowGallery} />
    </div>
  )
}

// Section 1: DFW Logo Introduction
function IntroSection({ offset }) {
  // Fade out as we scroll past 30%
  const opacity = clamp01(1 - (offset / 0.35))
  
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

// Section 2: Chair Showcase
function ChairSection({ offset, setShowGallery }) {
  // Visible between 30% and 70% scroll
  const enterProgress = clamp01((offset - 0.30) / 0.20)
  const exitProgress = clamp01((offset - 0.70) / 0.15)
  const presence = enterProgress * (1 - exitProgress)
  const opacity = presence
  const scale = 0.8 + presence * 0.2
  
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

// Section 3: Table Showcase
function TableSection({ offset, setShowGallery }) {
  // Visible from 65% scroll onwards (last scene, stays visible)
  const enterProgress = clamp01((offset - 0.65) / 0.20)
  const opacity = enterProgress
  const scale = 0.8 + enterProgress * 0.2

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
  const offset = useScrollOffsetValue()
  const sync = useSceneSyncControls()
  
  // Calculate presence for each object based on scroll offset and sync controls
  // Logo: visible at start, fades out during logoFadeStart -> logoFadeEnd
  const logoFadeProgress = clamp01((offset - sync.logoFadeStart) / Math.max(0.01, sync.logoFadeEnd - sync.logoFadeStart))
  const logoPresence = clamp01(1 - logoFadeProgress)
  
  // Chair: enters during chairEnterStart -> chairEnterEnd, exits during chairExitStart -> chairExitEnd
  const chairEnterProgress = clamp01((offset - sync.chairEnterStart) / Math.max(0.01, sync.chairEnterEnd - sync.chairEnterStart))
  const chairExitProgress = clamp01((offset - sync.chairExitStart) / Math.max(0.01, sync.chairExitEnd - sync.chairExitStart))
  const chairPresence = clamp01(chairEnterProgress * (1 - chairExitProgress))
  
  // Table: enters during tableEnterStart -> tableEnterEnd, stays visible
  const tableEnterProgress = clamp01((offset - sync.tableEnterStart) / Math.max(0.01, sync.tableEnterEnd - sync.tableEnterStart))
  const tablePresence = tableEnterProgress
  
  // Progress values for animations (0-1 within each object's active window)
  const introProgress = clamp01(offset / Math.max(0.01, sync.logoFadeEnd))
  const chairProgress = chairEnterProgress
  const tableProgress = tableEnterProgress

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
      <Dfw_logo_new 
        url="/splats/dfw_logo_new.spz" 
        sceneProgress={introProgress} 
        presence={logoPresence}
      />
      <Chair3D 
        url="/splats/chair_no_bg.spz" 
        sceneProgress={chairProgress} 
        presence={chairPresence}
        enterProgress={chairEnterProgress}
        exitProgress={chairExitProgress}
      />
      <CoffeeTable3D 
        url="/splats/coffee_table_fixed.spz" 
        sceneProgress={tableProgress} 
        presence={tablePresence}
        enterProgress={tableEnterProgress}
      />
      
      {/* Sprite text for each scene */}
      {spriteData && (
        <>
          {[
            {
              key: 'intro',
              text: textControls.text,
              position: [textControls.posX, textControls.posY, textControls.posZ],
              scale: textControls.scale,
              spacing: textControls.spacing,
              rotation: [
                THREE.MathUtils.degToRad(textControls.rotX),
                THREE.MathUtils.degToRad(textControls.rotY),
                THREE.MathUtils.degToRad(textControls.rotZ)
              ],
              lookAtCamera: textControls.lookAtCamera,
              renderOrder: textControls.renderOrder,
              progress: introProgress,
              presence: logoPresence
            },
            {
              key: 'chairs',
              text: 'ADIRONDACK CHAIRS',
              position: [0.05, -0.35, 0],
              scale: 0.07,
              spacing: 0.7,
              rotation: [0, 0, 0],
              lookAtCamera: true,
              renderOrder: textControls.renderOrder + 1,
              progress: chairProgress,
              presence: chairPresence
            },
            {
              key: 'tables',
              text: 'COFFEE TABLES',
              position: [-0.05, -0.35, 0],
              scale: 0.07,
              spacing: 0.7,
              rotation: [0, 0, 0],
              lookAtCamera: true,
              renderOrder: textControls.renderOrder + 2,
              progress: tableProgress,
              presence: tablePresence
            }
          ].map((config) => (
            <SpriteText
              key={config.key}
              text={config.text}
              position={config.position}
              scale={config.scale}
              spacing={config.spacing}
              rotation={config.rotation}
              lookAtCamera={config.lookAtCamera}
              renderOrder={config.renderOrder}
              spriteData={spriteData}
              progress={config.progress}
              presence={config.presence}
            />
          ))}
        </>
      )}
    </>
  )
}

// Debug component - shows scroll position and snap points
function ScrollDebug() {
  const scroll = useScroll()
  const offset = scroll.offset ?? 0
  
  // Snap points are at 0, 0.5, 1 (3 scenes)
  const currentScene = offset < 0.33 ? 'Intro' : offset < 0.66 ? 'Chairs' : 'Tables'
  
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0, 0, 0, 0.85)',
      color: 'white',
      padding: '12px',
      borderRadius: '5px',
      fontFamily: 'monospace',
      fontSize: '11px',
      zIndex: 1000,
      lineHeight: '1.6'
    }}>
      <div>Scroll: {(offset * 100).toFixed(1)}%</div>
      <div style={{ color: '#4f4', marginTop: '4px' }}>Scene: {currentScene}</div>
    </div>
  )
}

export default App
