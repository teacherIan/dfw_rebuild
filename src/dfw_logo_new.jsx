import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { SplatMesh, dyno } from '@sparkjsdev/spark'
import { useControls } from 'leva'
import * as THREE from 'three'

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function Dfw_logo_new({ url, sceneProgress = 0, presence = 1, ...props }) {
    const { scene } = useThree()
    const ref = useRef()
    const animateT = useRef(dyno.dynoFloat(0))
    const intensity = useRef(dyno.dynoFloat(0.8))
    const minScale = useRef(dyno.dynoFloat(0.3))
    const speed = useRef(dyno.dynoFloat(1.0))

    const lastFrame = useRef({
        animateT: Number.NaN,
        posX: Number.NaN,
        posY: Number.NaN,
        scale: Number.NaN,
        visible: null
    })

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
        scene.add(splatMesh)
        ref.current = splatMesh

        return () => {
            scene.remove(splatMesh)
            splatMesh.dispose?.()
        }
    }, [url, scene])

    useEffect(() => {
        intensity.current.value = controls.intensity
        minScale.current.value = controls.minScale
        speed.current.value = controls.speed
    }, [controls.intensity, controls.minScale, controls.speed])

    useEffect(() => {
        if (ref.current) {
            const rotateX = THREE.MathUtils.degToRad(controls.rotationX)
            const rotateY = THREE.MathUtils.degToRad(controls.rotationY)
            const rotateZ = THREE.MathUtils.degToRad(controls.rotationZ)
            ref.current.rotation.set(rotateX, rotateY, rotateZ)
        }
    }, [controls.rotationX, controls.rotationY, controls.rotationZ])

    useFrame((state, delta) => {
        const mesh = ref.current
        if (mesh) {
            const eps = 1e-4
            const last = lastFrame.current
            let dirty = false
            
            const localProgress = THREE.MathUtils.clamp(sceneProgress, 0, 1)
            const clampedPresence = THREE.MathUtils.clamp(presence, 0, 1)
            
            // Use presence for visibility - when presence is 0, logo should be invisible
            const displayProgress = localProgress
            const easedProgress = easeInOutCubic(displayProgress)
            
            // Map intro scroll to 0 -> PI for one smooth sin wave cycle (0->1->0)
            const nextAnimateT = localProgress * Math.PI
            if (!Number.isFinite(last.animateT) || Math.abs(last.animateT - nextAnimateT) > eps) {
                animateT.current.value = nextAnimateT
                last.animateT = nextAnimateT
                dirty = true
            }
            
            // Calculate responsive world-space position based on viewport
            const camera = state.camera
            const aspect = state.viewport.aspect
            const distance = camera.position.z
            
            // Calculate the visible height and width at the mesh's Z position
            const vFOV = (camera.fov * Math.PI) / 180
            const visibleHeight = 2 * Math.tan(vFOV / 2) * distance
            const visibleWidth = visibleHeight * aspect
            
            // Adjust for different screen sizes
            const isMobile = aspect < 1
            const adjustedScreenX = isMobile 
                ? controls.targetScreenX * Math.min(aspect * 1.5, 1)
                : controls.targetScreenX
            
            // Convert screen percentage to world coordinates
            const startX = 0
            const startY = 0
            const endX = (visibleWidth / 2) * adjustedScreenX
            const endY = (visibleHeight / 2) * controls.targetScreenY
            
            // Add curve using a sine wave for the loop effect
            const curveOffset = Math.sin(displayProgress * Math.PI) * controls.curveAmount
            
            const nextX = startX + (endX - startX) * easedProgress + curveOffset
            const nextY = startY + (endY - startY) * easedProgress
            if (
                !Number.isFinite(last.posX) ||
                !Number.isFinite(last.posY) ||
                Math.abs(last.posX - nextX) > eps ||
                Math.abs(last.posY - nextY) > eps
            ) {
                mesh.position.x = nextX
                mesh.position.y = nextY
                last.posX = nextX
                last.posY = nextY
                dirty = true
            }
            
            // Scale based on presence - fade out by scaling down
            const startScale = 2
            const endScale = 0.4
            const baseScale = startScale + (endScale - startScale) * easedProgress
            const finalScale = baseScale * clampedPresence
            if (!Number.isFinite(last.scale) || Math.abs(last.scale - finalScale) > eps) {
                mesh.scale.set(finalScale, finalScale, finalScale)
                last.scale = finalScale
                dirty = true
            }
            
            // Hide completely when presence is 0
            const nextVisible = clampedPresence > 0.01
            if (last.visible !== nextVisible) {
                mesh.visible = nextVisible
                last.visible = nextVisible
                dirty = true
            }
            
            if (dirty) {
                mesh.updateVersion()
            }
        }
    })

    return null
}

export default Dfw_logo_new