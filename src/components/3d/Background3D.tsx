"use client"

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
// @ts-ignore
import * as random from 'maath/random/dist/maath-random.esm'

function Stars(props: any) {
    const ref = useRef<any>(null)
    // Generate positions and validate them to ensure no NaNs
    const sphere = useMemo(() => {
        // Must be divisible by 3 for x,y,z coordinates
        const positions = random.inSphere(new Float32Array(6000), { radius: 1.5 });
        // Validate specifically for NaN values which crash Three.js
        for (let i = 0; i < positions.length; i++) {
            if (isNaN(positions[i]) || !isFinite(positions[i])) {
                positions[i] = 0; // Fallback to 0 if NaN found
            }
        }
        return positions;
    }, [])

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 10
            ref.current.rotation.y -= delta / 15
        }
    })

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color="#3b82f6"
                    size={0.002}
                    sizeAttenuation={true}
                    depthWrite={false}
                />
            </Points>
        </group>
    )
}

export default function Background3D() {
    return (
        <div className="absolute inset-0 -z-10 h-full w-full bg-black pointer-events-none">
            <Canvas camera={{ position: [0, 0, 1] }} style={{ pointerEvents: 'none' }}>
                <Stars />
            </Canvas>
        </div>
    )
}
