import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { SplatMesh, dyno } from '@sparkjsdev/spark'
import { useControls } from 'leva'
import * as THREE from 'three'

function Chair3D({ url, sceneProgress = 0, presence = 1, enterProgress = 0, exitProgress = 0, ...props }) {
    const { scene } = useThree()
    const ref = useRef()
    const { viewport } = useThree()
    const animateT = useRef(dyno.dynoFloat(0))
    const exitT = useRef(dyno.dynoFloat(0))

    const controls = useControls('Chair', {
        scale: { value: .5, min: 0.1, max: 5, step: 0.1, label: 'Chair Scale' },
        rotationX: { value: -107, min: -180, max: 180, step: 1, label: 'Rotation X' },
        rotationY: { value: 3, min: -180, max: 180, step: 1, label: 'Rotation Y' },
        rotationZ: { value: -35, min: -180, max: 180, step: 1, label: 'Rotation Z' },
        targetScreenX: { value: 0.6, min: -2, max: 2, step: 0.01, label: 'Screen Position X' },
        targetScreenY: { value: -0.2, min: -2, max: 2, step: 0.01, label: 'Screen Position Y' },
        targetScreenZ: { value: 0, min: -5, max: 5, step: 0.1, label: 'Screen Position Z' },
        // Animation timing - effect always goes 0% to 100% within this scroll range
        effectStart: { value: 0.15, min: 0, max: 0.95, step: 0.01, label: 'Animation Start (local %)' },
        effectEnd: { value: 0.85, min: 0, max: 1.0, step: 0.01, label: 'Animation End (local %)' },
        helixIntensity: { value: 50, min: 0, max: 100, step: 1, label: 'Helix Intensity' },
        scaleGrowth: { value: 1.0, min: 0, max: 1, step: 0.01, label: 'Scale Growth Amount' }
    })

    const helixIntensity = useRef(dyno.dynoFloat(controls.helixIntensity))
    const scaleGrowth = useRef(dyno.dynoFloat(controls.scaleGrowth))
    const lastFrame = useRef({
        entranceT: Number.NaN,
        exitT: Number.NaN,
        posX: Number.NaN,
        posY: Number.NaN,
        posZ: Number.NaN,
        rotX: Number.NaN,
        rotY: Number.NaN,
        rotZ: Number.NaN,
        scale: Number.NaN,
        visible: null
    })

    useEffect(() => {
        helixIntensity.current.value = controls.helixIntensity
        scaleGrowth.current.value = controls.scaleGrowth
    }, [controls.helixIntensity, controls.scaleGrowth])

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
                        exitT: "float",
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
                        float exitT = ${inputs.exitT};
                        vec3 localPos = ${inputs.gsplat}.center;
                        vec3 scales = ${inputs.gsplat}.scales;
                        
                        // Handle exit animation (fade out and reverse helix)
                        if (exitT > 0.0) {
                            float exitProgress = exitT;
                            float exitEased = smoothstep(0.0, 1.0, exitProgress);
                            
                            // Reverse helix effect
                            float exitEffectT = exitEased * 8.0;
                            float exitDecay = exp(-exitEffectT);
                            float exitRotation = -(localPos.y * ${inputs.helixIntensity} - 20.0) * exitDecay * (1.0 - exitEased);
                            localPos.xz *= rot(exitRotation);
                            
                            // Move outward and fade
                            ${outputs.gsplat}.center = mix(${inputs.gsplat}.center, localPos * (1.0 + exitEased * 2.0), exitEased);
                            ${outputs.gsplat}.scales = scales * (1.0 - exitEased);
                            ${outputs.gsplat}.rgba = ${inputs.gsplat}.rgba * (1.0 - exitEased);
                        }
                        // Hide chair completely before animation starts (t < 0)
                        else if (t < 0.0) {
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
                    exitT: exitT.current,
                    helixIntensity: helixIntensity.current,
                    scaleGrowth: scaleGrowth.current
                }).gsplat;

                return { gsplat };
            }
        );

        scene.add(splatMesh)
        ref.current = splatMesh

        return () => {
            if (splatMesh) {
                scene.remove(splatMesh)
                splatMesh.dispose()
            }
        }
    }, [url, scene])

    useFrame(() => {
        if (!ref.current) return

        const eps = 1e-4
        const last = lastFrame.current
        let dirty = false

        const clampedPresence = THREE.MathUtils.clamp(presence, 0, 1)
        const clampedEnter = THREE.MathUtils.clamp(enterProgress, 0, 1)
        const clampedExit = THREE.MathUtils.clamp(exitProgress, 0, 1)
        
        // Drive the shader animations with enter/exit progress
        // Entrance animation: helix unroll effect (0 -> 1)
        const entranceT = THREE.MathUtils.clamp(
            (clampedEnter - controls.effectStart) / Math.max(0.0001, controls.effectEnd - controls.effectStart),
            -0.1,
            1
        )
        if (!Number.isFinite(last.entranceT) || Math.abs(last.entranceT - entranceT) > eps) {
            animateT.current.value = entranceT
            last.entranceT = entranceT
            dirty = true
        }
        
        // Exit animation: reverse helix + explosion (0 -> 1)
        if (!Number.isFinite(last.exitT) || Math.abs(last.exitT - clampedExit) > eps) {
            exitT.current.value = clampedExit
            last.exitT = clampedExit
            dirty = true
        }

        const rotateX = THREE.MathUtils.degToRad(controls.rotationX)
        const rotateY = THREE.MathUtils.degToRad(controls.rotationY)
        const rotateZ = THREE.MathUtils.degToRad(controls.rotationZ)
        if (
            !Number.isFinite(last.rotX) ||
            !Number.isFinite(last.rotY) ||
            !Number.isFinite(last.rotZ) ||
            Math.abs(last.rotX - rotateX) > eps ||
            Math.abs(last.rotY - rotateY) > eps ||
            Math.abs(last.rotZ - rotateZ) > eps
        ) {
            ref.current.rotation.set(rotateX, rotateY, rotateZ)
            last.rotX = rotateX
            last.rotY = rotateY
            last.rotZ = rotateZ
            dirty = true
        }

        const targetX = controls.targetScreenX * viewport.width / 2
        const targetY = controls.targetScreenY * viewport.height / 2
        const targetZ = controls.targetScreenZ
        const startPos = { x: 0, y: 0, z: 0.15 }

        // Position based on entrance progress (slides into place)
        const positionT = THREE.MathUtils.smoothstep(clampedEnter, 0, 1)
        const nextX = THREE.MathUtils.lerp(startPos.x, targetX, positionT)
        const nextY = THREE.MathUtils.lerp(startPos.y, targetY, positionT)
        const nextZ = THREE.MathUtils.lerp(startPos.z, targetZ, positionT)
        if (
            !Number.isFinite(last.posX) ||
            !Number.isFinite(last.posY) ||
            !Number.isFinite(last.posZ) ||
            Math.abs(last.posX - nextX) > eps ||
            Math.abs(last.posY - nextY) > eps ||
            Math.abs(last.posZ - nextZ) > eps
        ) {
            ref.current.position.set(nextX, nextY, nextZ)
            last.posX = nextX
            last.posY = nextY
            last.posZ = nextZ
            dirty = true
        }

        // Scale controlled by shader, but base scale from controls
        if (!Number.isFinite(last.scale) || Math.abs(last.scale - controls.scale) > eps) {
            ref.current.scale.set(controls.scale, controls.scale, controls.scale)
            last.scale = controls.scale
            dirty = true
        }
        
        // Hide completely when presence is 0
        const nextVisible = clampedPresence > 0.01
        if (last.visible !== nextVisible) {
            ref.current.visible = nextVisible
            last.visible = nextVisible
            dirty = true
        }

        if (dirty && ref.current.updateVersion) {
            ref.current.updateVersion()
        }
    })

    return null
}

export default Chair3D
