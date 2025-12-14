import { useState, useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { SplatMesh, dyno } from '@sparkjsdev/spark'
import { useControls } from 'leva'
import * as THREE from 'three'
import { useScroll } from '@react-three/drei'

function Chair3D({ url, ...props }) {
    const scroll = useScroll()
    const [mesh, setMesh] = useState(null)
    const { scene } = useThree()
    const ref = useRef()
    const { viewport } = useThree()
    const animateT = useRef(dyno.dynoFloat(0))

    const controls = useControls('Chair', {
        scale: { value: .5, min: 0.1, max: 5, step: 0.1, label: 'Chair Scale' },
        rotationX: { value: -107, min: -180, max: 180, step: 1, label: 'Rotation X' },
        rotationY: { value: 3, min: -180, max: 180, step: 1, label: 'Rotation Y' },
        rotationZ: { value: -35, min: -180, max: 180, step: 1, label: 'Rotation Z' },
        targetScreenX: { value: 0.6, min: -2, max: 2, step: 0.01, label: 'Screen Position X' },
        targetScreenY: { value: -0.2, min: -2, max: 2, step: 0.01, label: 'Screen Position Y' },
        targetScreenZ: { value: 0, min: -5, max: 5, step: 0.1, label: 'Screen Position Z' },
        // Animation timing - effect always goes 0% to 100% within this scroll range
        effectStart: { value: 0.60, min: 0, max: 0.95, step: 0.01, label: 'Animation Start (scroll %)' },
        helixIntensity: { value: 50, min: 0, max: 100, step: 1, label: 'Helix Intensity' },
        scaleGrowth: { value: 1.0, min: 0, max: 1, step: 0.01, label: 'Scale Growth Amount' }
    })

    useEffect(() => {
        const splatMesh = new SplatMesh({ url })
        
        splatMesh.scale.set(controls.scale, controls.scale, controls.scale)

        const rotateX = THREE.MathUtils.degToRad(controls.rotationX)
        const rotateY = THREE.MathUtils.degToRad(controls.rotationY)
        const rotateZ = THREE.MathUtils.degToRad(controls.rotationZ)
        splatMesh.rotation.set(rotateX, rotateY, rotateZ)

        // Set up the unroll effect shader
        splatMesh.objectModifier = dyno.dynoBlock(
            { gsplat: dyno.Gsplat },
            { gsplat: dyno.Gsplat },
            ({ gsplat }) => {
                const d = new dyno.Dyno({
                    inTypes: {
                        gsplat: dyno.Gsplat,
                        t: "float",
                        helixIntensity: "float",
                        scaleGrowth: "float"
                    },
                    outTypes: { gsplat: dyno.Gsplat },
                    globals: () => [
                        dyno.unindent(`
                            mat2 rot(float a) {
                                float c = cos(a);
                                float s = sin(a);
                                return mat2(c, -s, s, c);
                            }
                        `)
                    ],
                    statements: ({ inputs, outputs }) => dyno.unindentLines(`
                        ${outputs.gsplat} = ${inputs.gsplat};
                        float t = ${inputs.t};
                        vec3 localPos = ${inputs.gsplat}.center;
                        vec3 scales = ${inputs.gsplat}.scales;
                        
                        // Hide chair completely before animation starts (t < 0)
                        if (t < 0.0) {
                            ${outputs.gsplat}.scales = vec3(0.0);
                            ${outputs.gsplat}.rgba = vec4(0.0);
                        }
                        // At exactly t >= 0.98, snap to final clean state (eliminates jump from coasting)
                        else if (t >= 0.98) {
                            ${outputs.gsplat}.center = ${inputs.gsplat}.center;
                            ${outputs.gsplat}.scales = scales;
                            ${outputs.gsplat}.rgba = ${inputs.gsplat}.rgba;
                        }
                        // Unroll animation (0.0 to 0.98)
                        else {
                            // Remap t from 0-0.98 to 0-1 for clean math
                            float normalizedT = t / 0.98;
                            float easedT = smoothstep(0.0, 1.0, normalizedT);
                            
                            // Map to longer range for exponential
                            float effectT = easedT * 8.0;
                            float decay = exp(-effectT);
                            
                            // Helix rotation that gradually reduces to zero
                            float rotationAmount = (localPos.y * ${inputs.helixIntensity} - 20.0) * decay;
                            localPos.xz *= rot(rotationAmount);
                            
                            // Position converges smoothly to original
                            ${outputs.gsplat}.center = mix(localPos * (1.0 - decay * 2.0), ${inputs.gsplat}.center, easedT * easedT);
                            
                            // Scale starts at 0 and grows to full size during unroll
                            // scaleGrowth controls how much the scale animation affects it (0 = no growth, 1 = full growth)
                            float scaleProgress = easedT * easedT * easedT;
                            float startScale = 1.0 - ${inputs.scaleGrowth}; // If scaleGrowth=1, starts at 0; if 0, starts at 1
                            float currentScaleMultiplier = mix(startScale, 1.0, scaleProgress);
                            
                            vec3 targetScale = mix(
                                mix(vec3(0.002), scales, smoothstep(0.0, 0.85, normalizedT + localPos.y * 0.2)),
                                scales,
                                scaleProgress
                            );
                            ${outputs.gsplat}.scales = targetScale * currentScaleMultiplier;
                            
                            // Opacity fades in smoothly
                            ${outputs.gsplat}.rgba = ${inputs.gsplat}.rgba * smoothstep(-0.3, 0.95, normalizedT + localPos.y * 0.15);
                        }
                    `),
                });

                gsplat = d.apply({
                    gsplat,
                    t: animateT.current,
                    helixIntensity: dyno.dynoFloat(controls.helixIntensity),
                    scaleGrowth: dyno.dynoFloat(controls.scaleGrowth)
                }).gsplat;

                return { gsplat };
            }
        );

        scene.add(splatMesh)
        setMesh(splatMesh)
        ref.current = splatMesh

        return () => {
            if (splatMesh) {
                scene.remove(splatMesh)
                splatMesh.dispose()
            }
        }
    }, [url, scene])

    useFrame((state) => {
        if (!ref.current) return

        const offset = scroll.offset
        
        // Calculate animation progress from effectStart to end of page (1.0)
        // This ensures the effect always completes at 100% by the end
        const effectProgress = THREE.MathUtils.clamp(
            (offset - controls.effectStart) / (1.0 - controls.effectStart),
            -0.1,  // Allow slightly negative to ensure complete hiding before start
            1
        )
        
        // effectProgress now goes from 0 to 1, representing 0% to 100% of the animation
        animateT.current.value = effectProgress

        // Update scale dynamically
        ref.current.scale.set(controls.scale, controls.scale, controls.scale)

        // Update rotation dynamically
        const rotateX = THREE.MathUtils.degToRad(controls.rotationX)
        const rotateY = THREE.MathUtils.degToRad(controls.rotationY)
        const rotateZ = THREE.MathUtils.degToRad(controls.rotationZ)
        ref.current.rotation.set(rotateX, rotateY, rotateZ)

        // Calculate target position in world space
        const targetX = controls.targetScreenX * viewport.width / 2
        const targetY = controls.targetScreenY * viewport.height / 2
        const targetZ = controls.targetScreenZ
        
        // Update position
        ref.current.position.x = targetX
        ref.current.position.y = targetY
        ref.current.position.z = targetZ

        // Update the splat mesh to reflect shader changes
        if (ref.current.updateVersion) {
            ref.current.updateVersion()
        }
    })

    return null
}

export default Chair3D
