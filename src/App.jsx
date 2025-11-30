import { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Root, Container, Text } from '@react-three/uikit'
import { Button } from '@react-three/uikit-default'
import Logo from './Logo.jsx'
import Z from './Z.jsx'
import Logo_new from './Logo_new.jsx'

function App() {
  const [animating, setAnimating] = useState(true)

  return (
    <Canvas camera={{ position: [0, 0, 1], fov: 60 }}>
      <Root sizeX={1} sizeY={1} pixelSize={0.01} anchorX="center" anchorY="center">
        <Container flexDirection="row" alignItems="center" width="100%" height="100%" justifyContent="center" gap={50}>
          <Container flexDirection="column" alignItems="center" justifyContent="center" gap={20}>
            {/*<Button variant='outline' positionZ={-50} onClick={() => setAnimating(!animating)}>*/}
            {/*  <Text>Gallery</Text>*/}
            {/*</Button>*/}
            {/*<Button positionZ={-50} onClick={() => setAnimating(!animating)}>*/}
            {/*  <Text>Contact</Text>*/}
            {/*</Button>*/}
          </Container>
          {/*<Logo url="/splats/fixed_model_compressed.spz" animating={animating} />*/}
            <Logo_new url="/splats/dfw_rotation_fixed.spz" animating={animating} />
          <Container flexDirection="column" alignItems="center" justifyContent="center" gap={20}>
            {/*<Button variant='outline' positionZ={-50} onClick={() => setAnimating(!animating)}>*/}
            {/*  <Text positionZ={-50} >Gallery Two</Text>*/}
            {/*</Button>*/}
            {/*<Button positionZ={-50} onClick={() => setAnimating(!animating)}>*/}
            {/*  <Text>Values</Text>*/}
            {/*</Button>*/}
          </Container>
        </Container>
      </Root>
      <OrbitControls />
    </Canvas>
  )
}

export default App
