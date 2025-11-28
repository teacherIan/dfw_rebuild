import { useState, useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Container } from '@react-three/uikit'
import { SplatMesh } from '@sparkjsdev/spark'
import * as THREE from 'three'

function Z({ url = "/splats/z.spz", ...props }) {
  const [mesh, setMesh] = useState(null)
  const { scene } = useThree()
  const ref = useRef()

  useEffect(() => {
    const splatMesh = new SplatMesh({ url })
    const rotateX = THREE.MathUtils.degToRad(-87.607)
    const rotateY = THREE.MathUtils.degToRad(90)
    const rotateZ = THREE.MathUtils.degToRad(-89.5072)
    splatMesh.rotation.set(rotateX, rotateY, rotateZ)
    splatMesh.scale.setScalar(0.15)
    setMesh(splatMesh)
    
    return () => {
      splatMesh.dispose?.()
    }
  }, [url])

  useFrame(() => {
    if (mesh && ref.current) {
      const pos = new THREE.Vector3()
      ref.current.getWorldPosition(pos)
      if (!mesh.parent) {
        scene.add(mesh)
      }
      mesh.position.copy(pos)
    }
  })

  return <Container ref={ref} width={100} height={40} {...props} />
}

export default Z
