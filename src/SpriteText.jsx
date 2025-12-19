import { useMemo, useRef } from 'react'
import { useLoader, useFrame, useThree } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'

// Load and parse spritesheet data once
const useSpritesheet = () => {
  const texture = useLoader(THREE.TextureLoader, '/splats/spritesheet/spritesheet.png')
  
  return useMemo(() => {
    // Import the JSON directly in production, or fetch it
    // For now we'll use fetch since it's in public
    return {
      texture,
      // We'll pass the sprite data as props or fetch it
      // Texture settings for crisp pixel art
      setup: () => {
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.generateMipmaps = false
      }
    }
  }, [texture])
}

// Individual sprite letter component
function SpriteLetter({ letter, position, scale = 1, spriteData, texture, renderOrder }) {
  const sprite = spriteData.frames[`${letter.toUpperCase()}.png`]
  
  if (!sprite) {
    console.warn(`Letter "${letter}" not found in spritesheet`)
    return null
  }
  
  const geometry = useMemo(() => {
    const { frame, sourceSize } = sprite
    const sheetWidth = spriteData.meta.size.w
    const sheetHeight = spriteData.meta.size.h
    
    // Calculate UV coordinates (origin is bottom-left in OpenGL)
    const u1 = frame.x / sheetWidth
    const u2 = (frame.x + frame.w) / sheetWidth
    const v1 = 1 - (frame.y / sheetHeight) // Flip V
    const v2 = 1 - ((frame.y + frame.h) / sheetHeight) // Flip V
    
    const geo = new THREE.PlaneGeometry(1, 1)
    const uvs = geo.attributes.uv
    
    // Set custom UVs for this letter - swapped v1/v2 to fix vertical flip
    uvs.setXY(0, u1, v1) // bottom-left (v swapped)
    uvs.setXY(1, u2, v1) // bottom-right (v swapped)
    uvs.setXY(2, u1, v2) // top-left (v swapped)
    uvs.setXY(3, u2, v2) // top-right (v swapped)
    
    return geo
  }, [sprite, spriteData])
  
  // Calculate aspect ratio for correct scaling
  const aspectRatio = sprite.sourceSize.w / sprite.sourceSize.h
  const width = scale * aspectRatio
  const height = scale
  
  return (
    <mesh position={position} scale={[width, height, 1]} geometry={geometry} renderOrder={renderOrder}>
      <meshBasicMaterial 
        map={texture} 
        transparent 
        alphaTest={0.1}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// Main component to render text
export default function SpriteText({ 
  text = "DOUGS FOUND WOOD", 
  position = [0, -0.5, 0.5], 
  scale = 0.15,
  spacing = 0.7,
  spriteData,
  rotation = [0, 0, 0], // Optional rotation [x, y, z] in radians
  lookAtCamera = true, // Optional: make text always face camera
  renderOrder = 0 // Higher numbers render on top
}) {
  const { texture, setup } = useSpritesheet()
  const groupRef = useRef()
  const { camera } = useThree()
  
  useMemo(() => {
    setup()
  }, [setup])
  
  // Make text face camera if enabled
  useFrame(() => {
    if (lookAtCamera && groupRef.current) {
      groupRef.current.lookAt(camera.position)
    }
  })
  
  if (!spriteData) {
    console.error('spriteData is required')
    return null
  }
  
  // Calculate positions for each letter
  const letters = text.split('')
  const spaceWidth = scale * 0.5 // Width for spaces (adjust as needed)
  
  const totalWidth = letters.reduce((sum, letter) => {
    if (letter === ' ') return sum + (spaceWidth * spacing)
    const sprite = spriteData.frames[`${letter.toUpperCase()}.png`]
    if (!sprite) return sum
    const aspectRatio = sprite.sourceSize.w / sprite.sourceSize.h
    return sum + (scale * aspectRatio * spacing)
  }, 0)
  
  // Center the text
  const startX = -totalWidth / 2
  
  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {letters.map((letter, index) => {
        // Handle spaces
        if (letter === ' ') return null
        
        const sprite = spriteData.frames[`${letter.toUpperCase()}.png`]
        if (!sprite) return null
        
        const aspectRatio = sprite.sourceSize.w / sprite.sourceSize.h
        const letterWidth = scale * aspectRatio
        
        // Calculate cumulative offset including spaces
        const offsetX = letters.slice(0, index).reduce((sum, prevLetter) => {
          if (prevLetter === ' ') return sum + (spaceWidth * spacing)
          const prevSprite = spriteData.frames[`${prevLetter.toUpperCase()}.png`]
          if (!prevSprite) return sum
          const prevAspect = prevSprite.sourceSize.w / prevSprite.sourceSize.h
          return sum + (scale * prevAspect * spacing)
        }, 0)
        
        return (
          <SpriteLetter
            key={index}
            letter={letter}
            position={[startX + offsetX + letterWidth / 2, 0, 0]}
            scale={scale}
            spriteData={spriteData}
            texture={texture}
            renderOrder={renderOrder}
          />
        )
      })}
    </group>
  )
}
