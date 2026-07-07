"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/contexts/ThemeContext";

function ParticleField({ isDark }: { isDark: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = 2400;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    const base = isDark ? 0.55 : 0.35;
    const range = isDark ? 0.35 : 0.25;

    let i = 0;
    while (i < count) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.2 + Math.random() * 2.8;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.55;
      const z = r * Math.cos(phi) * 0.7;

      // Keep the center clear for typography readability
      if (Math.abs(x) < 1.4 && Math.abs(y) < 1.0) continue;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const brightness = base + Math.random() * range;
      col[i * 3] = brightness;
      col[i * 3 + 1] = brightness;
      col[i * 3 + 2] = brightness;

      i++;
    }

    return [pos, col];
  }, [isDark]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.03;
    ref.current.rotation.x = Math.sin(t * 0.12) * 0.05;
  });

  return (
    <Points ref={ref} positions={positions} colors={colors} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        vertexColors
        size={0.018}
        sizeAttenuation
        depthWrite={false}
        opacity={isDark ? 0.55 : 0.45}
        blending={THREE.NormalBlending}
      />
    </Points>
  );
}

function FluidMesh({ isDark }: { isDark: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.x = t * 0.06;
    meshRef.current.rotation.y = t * 0.09;
    const scale = 1 + Math.sin(t * 0.5) * 0.05;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef} position={[2.2, 0.3, -0.5]}>
      <icosahedronGeometry args={[1.3, 4]} />
      <meshStandardMaterial
        color={isDark ? "#6e6e73" : "#aeaeb2"}
        wireframe
        transparent
        opacity={isDark ? 0.14 : 0.12}
      />
    </mesh>
  );
}

function SceneContent({ isDark }: { isDark: boolean }) {
  return (
    <>
      <ambientLight intensity={isDark ? 0.5 : 0.85} />
      <pointLight position={[8, 6, 8]} intensity={isDark ? 0.4 : 0.25} />
      <FluidMesh isDark={isDark} />
      <ParticleField isDark={isDark} />
    </>
  );
}

export default function HeroScene() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
    >
      <SceneContent isDark={isDark} />
    </Canvas>
  );
}
