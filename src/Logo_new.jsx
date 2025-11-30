import { useState, useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Container } from '@react-three/uikit'
import { SplatMesh, dyno } from '@sparkjsdev/spark'
import { useControls } from 'leva'
import * as THREE from 'three'

function Logo_new({ url, animating = true, ...props }) {
    const [mesh, setMesh] = useState(null)
    const { scene } = useThree()
    const ref = useRef()
    const animateT = useRef(dyno.dynoFloat(0))
    const intensity = useRef(dyno.dynoFloat(0.8))
    const minScale = useRef(dyno.dynoFloat(0.3))
    const speed = useRef(dyno.dynoFloat(1.0))

    const controls = useControls('Disintegrate Effect', {
        intensity: { value: 0.8, min: 0, max: 2, step: 0.01 },
        minScale: { value: 0.3, min: 0, max: 1, step: 0.01, label: 'Min Scale' },
        speed: { value: 1.0, min: 0.1, max: 3, step: 0.1 }
    })

    useEffect(() => {
        const splatMesh = new SplatMesh({ url })
        const rotateX = THREE.MathUtils.degToRad(90)
        const rotateY = THREE.MathUtils.degToRad(0)
        const rotateZ = THREE.MathUtils.degToRad(-170)
        splatMesh.rotation.set(rotateX, rotateY, rotateZ)

        splatMesh.objectModifier = dyno.dynoBlock(
            { gsplat: dyno.Gsplat },
            { gsplat: dyno.Gsplat },
            ({ gsplat }) => {
                const d = new dyno.Dyno({
                    inTypes: {
                        gsplat: dyno.Gsplat,
                        t: "float",
                        intensity: "float",
                        minScale: "float",
                        speed: "float"
                    },
                    outTypes: { gsplat: dyno.Gsplat },
                    globals: () => [
                        dyno.unindent(`
              vec3 hash(vec3 p) {
                return fract(sin(p*123.456)*123.456);
              }

              mat2 rot(float a) {
                float s = sin(a), c = cos(a);
                return mat2(c, -s, s, c);
              }

              vec4 disintegrate(vec3 pos, float t, float intensity, float speed) {
                vec3 p = pos + (hash(pos) * 2. - 1.) * intensity;
                float tt = fract(t * speed * 0.1 + -pos.y * .1);
                tt = smoothstep(0.0, 0.3, tt) * (1.0 - smoothstep(0.7, 1.0, tt));
                p.xz *= rot(tt * 2. + p.y * 2. * tt);
                return vec4(mix(p, pos, tt), tt);
              }
            `)
                    ],
                    statements: ({ inputs, outputs }) => dyno.unindentLines(`
            ${outputs.gsplat} = ${inputs.gsplat};
            
            vec3 localPos = ${inputs.gsplat}.center;
            
            vec4 e = disintegrate(localPos, ${inputs.t}, ${inputs.intensity}, ${inputs.speed});
            ${outputs.gsplat}.center = e.xyz;
            ${outputs.gsplat}.scales = mix(${inputs.gsplat}.scales * ${inputs.minScale}, ${inputs.gsplat}.scales, e.w);
          `),
                })

                gsplat = d.apply({
                    gsplat,
                    t: animateT.current,
                    intensity: intensity.current,
                    minScale: minScale.current,
                    speed: speed.current
                }).gsplat

                return { gsplat }
            }
        )

        splatMesh.updateGenerator()
        setMesh(splatMesh)

        return () => {
            splatMesh.dispose?.()
        }
    }, [url])

    useEffect(() => {
        intensity.current.value = controls.intensity
        minScale.current.value = controls.minScale
        speed.current.value = controls.speed
    }, [controls.intensity, controls.minScale, controls.speed])

    useFrame((state, delta) => {
        if (mesh && ref.current) {
            const pos = new THREE.Vector3()
            ref.current.getWorldPosition(pos)
            if (!mesh.parent) {
                scene.add(mesh)
            }
            mesh.position.copy(pos)

            if (animating) {
                animateT.current.value = state.clock.elapsedTime
            }
            mesh.updateVersion()
        }
    })

    return <Container ref={ref} width={50} height={80} {...props} />
}

export default Logo_new