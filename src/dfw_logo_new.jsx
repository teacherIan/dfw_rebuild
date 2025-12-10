import { useState, useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Container } from '@react-three/uikit'
import { SplatMesh, dyno } from '@sparkjsdev/spark'
import { useControls } from 'leva'
import * as THREE from 'three'
import { useScroll } from '@react-three/drei'

function Dfw_logo_new({ url, ...props }) {
    const scroll = useScroll()
    const [mesh, setMesh] = useState(null)
    const { scene } = useThree()
    const ref = useRef()
    const animateT = useRef(dyno.dynoFloat(0))
    const intensity = useRef(dyno.dynoFloat(0.8))
    const minScale = useRef(dyno.dynoFloat(0.3))
    const speed = useRef(dyno.dynoFloat(1.0))

    const controls = useControls('Swirl Effect', {
        intensity: { value: 3, min: 0, max: 5, step: 0.01, label: 'Explosion Intensity' },
        minScale: { value: 1, min: 0, max: 2, step: 0.01, label: 'Particle Scale' },
        speed: { value: 1.5, min: 0.1, max: 5, step: 0.1, label: 'Rotation Speed' },
        rotationX: { value: -86, min: -180, max: 180, step: 1, label: 'Rotation X' },
        rotationY: { value: 0, min: -180, max: 180, step: 1, label: 'Rotation Y' },
        rotationZ: { value: -95, min: -180, max: 180, step: 1, label: 'Rotation Z' },
        targetScreenX: { value: -0.7, min: -1, max: 1, step: 0.01, label: 'Screen Position X' },
        targetScreenY: { value: 0.88, min: -1, max: 1, step: 0.01, label: 'Screen Position Y' },
        curveAmount: { value: 2, min: 0, max: 2, step: 0.01, label: 'Curve Amount' }
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
                // If intensity is 0, skip all effects
                if (intensity < 0.001) {
                  return vec4(pos, 1.0);
                }
                
                // Create smooth 0 -> 1 -> 0 cycle using sin wave
                // This gives a perfectly smooth transition throughout
                float cycle = sin(t);
                cycle = max(0.0, cycle); // Clamp to positive values only
                
                // Random offset for each particle based on position
                vec3 randomDir = (hash(pos) * 2.0 - 1.0);
                
                // Add some variation based on particle position for more organic look
                float particleOffset = length(pos) * 0.1;
                float adjustedCycle = cycle * (1.0 + sin(particleOffset) * 0.3);
                adjustedCycle = clamp(adjustedCycle, 0.0, 1.0);
                
                // Explode outward with randomness
                vec3 displaced = pos + randomDir * intensity * adjustedCycle;
                
                // Spiral rotation during explosion
                // float angle = atan(pos.y, pos.x) + adjustedCycle * 6.28318 * speed;
                // mat3 rot = rotationMatrix(normalize(vec3(0.0, 1.0, 0.3)), angle * adjustedCycle);
                // displaced = rot * displaced;
                
                // Smooth mix between original and displaced position
                vec3 finalPos = mix(pos, displaced, adjustedCycle);
                
                // Keep scale constant
                float scaleFactor = 1.0;
                
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
            
            // Get scroll offset from Drei's ScrollControls (0-1 range)
            const scrollProgress = scroll.offset
            
            const easedProgress = easeInOutCubic(scrollProgress)
            
            // Map scroll to 0 -> PI for one smooth sin wave cycle (0->1->0)
            // This creates: solid -> exploded/swirled -> solid
            animateT.current.value = scrollProgress * Math.PI
            
            // Calculate responsive world-space position based on viewport
            const camera = state.camera
            const aspect = state.viewport.aspect
            const distance = camera.position.z
            
            // Calculate the visible height and width at the mesh's Z position
            const vFOV = (camera.fov * Math.PI) / 180
            const visibleHeight = 2 * Math.tan(vFOV / 2) * distance
            const visibleWidth = visibleHeight * aspect
            
            // Adjust for different screen sizes
            // On mobile (portrait), aspect < 1, so we need to scale X positions less aggressively
            // On desktop (landscape), aspect > 1, positions work as expected
            const isMobile = aspect < 1
            const adjustedScreenX = isMobile 
                ? controls.targetScreenX * Math.min(aspect * 1.5, 1) // Scale down X on mobile
                : controls.targetScreenX
            
            // Use Leva-controlled screen position (-1 to 1 range)
            // -1, -1 = bottom-left corner
            //  0,  0 = center
            //  1,  1 = top-right corner
            
            // Convert screen percentage to world coordinates
            const startX = 0
            const startY = 0
            const endX = (visibleWidth / 2) * adjustedScreenX
            const endY = (visibleHeight / 2) * controls.targetScreenY
            
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