import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSensitivity } from '../../context/SensitivityContext';

// --- Particle Cube Component ---
const ParticleSystem: React.FC<{ inputs: any, count?: number }> = ({ inputs, count = 8 }) => {
    // Generate a 3D grid of points
    const points = useMemo(() => {
        const temp = [];
        const gap = 0.5;
        const offset = (count * gap) / 2;

        for (let x = 0; x < count; x++) {
            for (let y = 0; y < count; y++) {
                for (let z = 0; z < count; z++) {
                    const posX = x * gap - offset;
                    const posY = y * gap - offset;
                    const posZ = z * gap - offset;

                    // Mock Valuation Logic based on coords (simple gradient)
                    // In real app, we'd map this to sensitivity deltas
                    const val = (x + y + z) / (count * 3);

                    // Probability Cloud Logic (Center is high prob)
                    const dist = Math.sqrt(posX * posX + posY * posY + posZ * posZ);
                    const prob = Math.exp(-dist * 0.8);

                    temp.push({ position: [posX, posY, posZ], val, prob });
                }
            }
        }
        return temp;
    }, [count, inputs]); // Re-calc on input change

    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Update instances
    useFrame((state) => {
        if (!mesh.current) return;

        points.forEach((p, i) => {
            const { position, prob } = p;

            // Animate: "Breathing" effect based on probability
            // Optimization: Skip sin calc for far-out particles if count is high (>12)
            const shouldAnimate = count < 12 || prob > 0.1;
            const scale = shouldAnimate
                ? prob * (0.8 + Math.sin(state.clock.elapsedTime + i) * 0.1)
                : prob * 0.8;

            dummy.position.set(position[0], position[1], position[2]);
            dummy.scale.set(scale, scale, scale);
            dummy.updateMatrix();

            mesh.current!.setMatrixAt(i, dummy.matrix);

            // Color Logic (Heatmap-ish)
            const color = new THREE.Color();
            color.setHSL(0.6 - p.val * 0.6, 1.0, 0.5); // Blue -> Red
            mesh.current!.setColorAt(i, color);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
        if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshStandardMaterial({
            transparent: true,
            opacity: 0.8,
            roughness: 0.2,
            metalness: 0.8
        }), points.length]}>
        </instancedMesh>
    );
};

// --- Main Container ---
export const VolumetricCube: React.FC = () => {
    const { inputs } = useSensitivity();
    const [quality, setQuality] = React.useState<'low' | 'high'>('high');

    // Scale count: High (10x10x10 = 1000), Low (6x6x6 = 216)
    const count = quality === 'high' ? 10 : 6;

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden glass-panel relative group">
            <div className="absolute top-4 left-4 z-10 w-full pointer-events-none flex justify-between pr-8">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    4D Volumetric Sensitivity
                </h3>
            </div>

            {/* Quality Toggle (Hidden unless hovered) */}
            <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => setQuality(q => q === 'high' ? 'low' : 'high')}
                    className="bg-black/50 backdrop-blur border border-white/10 px-2 py-1 rounded text-[10px] text-gray-400 hover:text-white uppercase font-bold"
                >
                    {quality} Performance
                </button>
            </div>

            <Canvas camera={{ position: [5, 5, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <pointLight position={[-10, -10, -10]} color="blue" intensity={0.5} />

                <ParticleSystem inputs={inputs} count={count} />

                <OrbitControls autoRotate autoRotateSpeed={0.5} enableZoom={true} />
                <gridHelper args={[10, 10, 0x444444, 0x222222]} />
            </Canvas>
        </div>
    );
};
