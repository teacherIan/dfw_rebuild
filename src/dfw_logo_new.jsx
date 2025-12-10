import { useState, useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Container } from '@react-three/uikit'
import { SplatMesh, dyno } from '@sparkjsdev/spark'
import { useControls } from 'leva'
import * as THREE from 'three'

function Dfw_logo_new({ url, scrollProgress = 0, ...props }) {
    const [mesh, setMesh] = useState(null)
    const { scene } = useThree()
    const ref = useRef()
    const animateT = useRef(dyno.dynoFloat(0))
    const intensity = useRef(dyno.dynoFloat(0.8))
    const minScale = useRef(dyno.dynoFloat(0.3))
    const speed = useRef(dyno.dynoFloat(1.0))

    const controls = useControls('Swirl Effect', {
        intensity: { value: 1.2, min: 0, max: 3, step: 0.01, label: 'Explosion Intensity' },
        minScale: { value: 0.5, min: 0, max: 2, step: 0.01, label: 'Particle Scale' },
        speed: { value: 1.5, min: 0.1, max: 5, step: 0.1, label: 'Rotation Speed' },
        rotationX: { value: -86, min: -180, max: 180, step: 1, label: 'Rotation X' },
        rotationY: { value: 0, min: -180, max: 180, step: 1, label: 'Rotation Y' },
        rotationZ: { value: -95, min: -180, max: 180, step: 1, label: 'Rotation Z' },
        endX: { value: -0.6, min: -2, max: 2, step: 0.01, label: 'End Position X' },
        endY: { value: 0.44, min: -2, max: 2, step: 0.01, label: 'End Position Y' },
        curveAmount: { value: 1, min: 0, max: 1, step: 0.01, label: 'Curve Amount' }
    })

    useEffect(() => {
        const splatMesh = new SplatMesh({ url })
        
        splatMesh.scale.set(2, 2, 2)
        // splatMesh.renderOrder = -1
        

        const rotateX = THREE.MathUtils.degToRad(controls.rotationX)
        const rotateY = THREE.MathUtils.degToRad(controls.rotationY)
        const rotateZ = THREE.MathUtils.degToRad(controls.rotationZ)
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

              mat3 rotationMatrix(vec3 axis, float angle) {
                axis = normalize(axis);
                float s = sin(angle);
                float c = cos(angle);
                float oc = 1.0 - c;
                
                return mat3(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
                            oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
                            oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c);
              }

              vec4 swirlDisintegrate(vec3 pos, float t, float intensity, float speed) {
                // Create a smooth 0 -> 1 -> 0 cycle
                // Use smoothstep for better control at start and end
                float rawCycle = t / 3.14159; // normalize to 0-1
                float cycle;
                
                if (rawCycle < 0.5) {
                  // First half: 0 -> 1
                  cycle = smoothstep(0.0, 0.5, rawCycle) * 2.0;
                } else {
                  // Second half: 1 -> 0
                  cycle = smoothstep(1.0, 0.5, rawCycle) * 2.0;
                }
                
                // Ensure we're truly at 0 at the extremes
                cycle = clamp(cycle, 0.0, 1.0);
                
                // Random offset for each particle
                vec3 randomDir = (hash(pos) * 2.0 - 1.0);
                
                // Spiral outward effect
                float angle = atan(pos.y, pos.x) + cycle * 6.28318 * speed; // Full rotation
                
                // Explode outward with spiral
                vec3 displaced = pos + randomDir * intensity * cycle;
                
                // Add spiral rotation
                mat3 rot = rotationMatrix(normalize(vec3(0.0, 1.0, 0.3)), angle * cycle);
                displaced = rot * displaced;
                
                // Mix between displaced and original - at cycle=0, should be 100% original
                vec3 finalPos = mix(pos, displaced, cycle);
                
                // Scale effect - particles shrink at peak displacement
                float scaleFactor = 1.0 - (cycle * 0.7);
                
                return vec4(finalPos, scaleFactor);
              }
            `)
                    ],
                    statements: ({ inputs, outputs }) => dyno.unindentLines(`
            ${outputs.gsplat} = ${inputs.gsplat};
            
            vec3 localPos = ${inputs.gsplat}.center;
            
            vec4 e = swirlDisintegrate(localPos, ${inputs.t}, ${inputs.intensity}, ${inputs.speed});
            ${outputs.gsplat}.center = e.xyz;
            ${outputs.gsplat}.scales = ${inputs.gsplat}.scales * e.w * ${inputs.minScale};
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

    useEffect(() => {
        if (mesh) {
            const rotateX = THREE.MathUtils.degToRad(controls.rotationX)
            const rotateY = THREE.MathUtils.degToRad(controls.rotationY)
            const rotateZ = THREE.MathUtils.degToRad(controls.rotationZ)
            mesh.rotation.set(rotateX, rotateY, rotateZ)
        }
    }, [mesh, controls.rotationX, controls.rotationY, controls.rotationZ])

    useFrame((state, delta) => {
        if (mesh) {
            if (!mesh.parent) {
                scene.add(mesh)
            }

            // Easing function for smooth animation (ease-in-out cubic)
            const easeInOutCubic = (t) => {
                return t < 0.5 
                    ? 4 * t * t * t 
                    : 1 - Math.pow(-2 * t + 2, 3) / 2
            }
            
            const easedProgress = easeInOutCubic(scrollProgress)
            
            // Map scroll to 0 -> PI for one smooth sin wave cycle (0->1->0)
            // This creates: solid -> exploded/swirled -> solid
            animateT.current.value = scrollProgress * Math.PI
            
            // Curved path animation - creates a looping arc
            const startX = 0
            const startY = 0
            const endX = controls.endX
            const endY = controls.endY
            
            // Add curve using a sine wave for the loop effect
            const curveOffset = Math.sin(scrollProgress * Math.PI) * controls.curveAmount
            
            mesh.position.x = startX + (endX - startX) * easedProgress + curveOffset
            mesh.position.y = startY + (endY - startY) * easedProgress
            
            // Scale down smoothly using eased progress
            const startScale = 2
            const endScale = 0.4
            const currentScale = startScale + (endScale - startScale) * easedProgress
            mesh.scale.set(currentScale, currentScale, currentScale)
            
            mesh.updateVersion()
        }
    })

    return null
}

export default Dfw_logo_new