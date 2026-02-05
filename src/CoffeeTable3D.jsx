import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { SplatMesh, dyno } from '@sparkjsdev/spark'
import { useControls } from 'leva'
import * as THREE from 'three'

function CoffeeTable3D({ url, sceneProgress = 0, presence = 1, enterProgress = 0, ...props }) {
    const { scene } = useThree()
    const ref = useRef()
    const { viewport } = useThree()
    const animateT = useRef(dyno.dynoFloat(0))

    const controls = useControls('CoffeeTable', {
        scale: { value: 0.5, min: 0.1, max: 5, step: 0.1, label: 'Coffee Table Scale' },
        rotationX: { value: -107, min: -180, max: 180, step: 1, label: 'Rotation X' },
        rotationY: { value: 3, min: -180, max: 180, step: 1, label: 'Rotation Y' },
        rotationZ: { value: -35, min: -180, max: 180, step: 1, label: 'Rotation Z' },
        targetScreenX: { value: -0.65, min: -2, max: 2, step: 0.01, label: 'Screen Position X' },
        targetScreenY: { value: -0.15, min: -2, max: 2, step: 0.01, label: 'Screen Position Y' },
        targetScreenZ: { value: -0.05, min: -5, max: 5, step: 0.1, label: 'Screen Position Z' },
        effectStart: { value: 0.02, min: 0, max: 0.95, step: 0.01, label: 'Animation Start (local progress %)' },
        waveSpeed: { value: 2.5, min: 0.5, max: 5, step: 0.1, label: 'Wave Speed' },
        riseHeight: { value: 0.8, min: 0, max: 2, step: 0.1, label: 'Rise Height' },
        spiralIntensity: { value: 30, min: 0, max: 100, step: 1, label: 'Spiral Intensity' }
    })

    const waveSpeed = useRef(dyno.dynoFloat(controls.waveSpeed))
    const riseHeight = useRef(dyno.dynoFloat(controls.riseHeight))
    const spiralIntensity = useRef(dyno.dynoFloat(controls.spiralIntensity))
    const lastFrame = useRef({
        effectProgress: Number.NaN,
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
        waveSpeed.current.value = controls.waveSpeed
        riseHeight.current.value = controls.riseHeight
        spiralIntensity.current.value = controls.spiralIntensity
    }, [controls.waveSpeed, controls.riseHeight, controls.spiralIntensity])

    useEffect(() => {
        const splatMesh = new SplatMesh({ url })
        
        splatMesh.scale.set(controls.scale, controls.scale, controls.scale)

        const rotateX = THREE.MathUtils.degToRad(controls.rotationX)
        const rotateY = THREE.MathUtils.degToRad(controls.rotationY)
        const rotateZ = THREE.MathUtils.degToRad(controls.rotationZ)
        splatMesh.rotation.set(rotateX, rotateY, rotateZ)

        // Set up the rising wave materialization shader
        splatMesh.objectModifier = dyno.dynoBlock(
            { gsplat: dyno.Gsplat },
            { gsplat: dyno.Gsplat },
            ({ gsplat }) => {
                const d = new dyno.Dyno({
                    inTypes: {
                        gsplat: dyno.Gsplat,
                        t: "float",
                        waveSpeed: "float",
                        riseHeight: "float",
                        spiralIntensity: "float"
                    },
                    outTypes: { gsplat: dyno.Gsplat },
                    globals: () => [
                        dyno.unindent(`
                            mat2 rot2D(float a) {
                                float c = cos(a);
                                float s = sin(a);
                                return mat2(c, -s, s, c);
                            }
                            
                            // Pseudo-random based on position
                            float hash(vec3 p) {
                                return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
                            }
                        `)
                    ],
                    statements: ({ inputs, outputs }) => dyno.unindentLines(`
                        ${outputs.gsplat} = ${inputs.gsplat};
                        float t = ${inputs.t};
                        vec3 localPos = ${inputs.gsplat}.center;
                        vec3 scales = ${inputs.gsplat}.scales;
                        
                        // Hide completely before animation starts
                        if (t < 0.0) {
                            ${outputs.gsplat}.scales = vec3(0.0);
                            ${outputs.gsplat}.rgba = vec4(0.0);
                        }
                        // Fully materialized
                        else if (t >= 0.98) {
                            ${outputs.gsplat}.center = ${inputs.gsplat}.center;
                            ${outputs.gsplat}.scales = scales;
                            ${outputs.gsplat}.rgba = ${inputs.gsplat}.rgba;
                        }
                        // Rising wave materialization effect
                        else {
                            float normalizedT = t / 0.98;
                            
                            // Each particle has a unique "birth time" based on its position
                            // Particles at the bottom materialize first, creating a rising wave
                            float particleRandom = hash(localPos);
                            float heightFactor = (localPos.y + 1.0) * 0.5; // Normalize height to 0-1
                            float birthTime = heightFactor * 0.6 + particleRandom * 0.2;
                            
                            // How far along is this particle in its personal animation?
                            float particleProgress = smoothstep(birthTime - 0.1, birthTime + 0.3, normalizedT * ${inputs.waveSpeed});
                            
                            // Rising from below with a spiral
                            float riseOffset = (1.0 - particleProgress) * ${inputs.riseHeight};
                            float spiralAngle = (1.0 - particleProgress) * ${inputs.spiralIntensity} * (0.5 + particleRandom);
                            
                            vec3 animatedPos = localPos;
                            animatedPos.y -= riseOffset;
                            animatedPos.xz *= rot2D(spiralAngle * 0.1);
                            
                            // Slight outward expansion that contracts as it materializes
                            float expansion = (1.0 - particleProgress) * 0.3;
                            animatedPos *= 1.0 + expansion;
                            
                            ${outputs.gsplat}.center = mix(animatedPos, ${inputs.gsplat}.center, particleProgress * particleProgress);
                            
                            // Scale grows from tiny sparkle to full size
                            float scaleMultiplier = smoothstep(0.0, 0.7, particleProgress);
                            // Add a slight "pop" at the end
                            scaleMultiplier *= 1.0 + sin(particleProgress * 3.14159) * 0.15;
                            ${outputs.gsplat}.scales = scales * scaleMultiplier;
                            
                            // Opacity with a glowing entrance
                            float glowBoost = sin(particleProgress * 3.14159) * 0.3;
                            ${outputs.gsplat}.rgba = ${inputs.gsplat}.rgba * (particleProgress + glowBoost);
                        }
                    `),
                });

                gsplat = d.apply({
                    gsplat,
                    t: animateT.current,
                    waveSpeed: waveSpeed.current,
                    riseHeight: riseHeight.current,
                    spiralIntensity: spiralIntensity.current
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
        
        // Drive the shader animation with enter progress
        const effectProgress = THREE.MathUtils.clamp(
            (clampedEnter - controls.effectStart) / Math.max(0.0001, 1.0 - controls.effectStart),
            -0.1,
            1
        )
        if (!Number.isFinite(last.effectProgress) || Math.abs(last.effectProgress - effectProgress) > eps) {
            animateT.current.value = effectProgress
            last.effectProgress = effectProgress
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
        const startPos = { x: 0, y: 0, z: -0.15 }

        // Position based on entrance progress
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

        // Scale controlled by shader
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

export default CoffeeTable3D
