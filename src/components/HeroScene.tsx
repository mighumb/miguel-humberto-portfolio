"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/contexts/ThemeContext";

const PARTICLE_COUNT = 2400;

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function generateParticles() {
  const random = seededRandom(42);
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const brightness = new Float32Array(PARTICLE_COUNT);

  let i = 0;
  while (i < PARTICLE_COUNT) {
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const r = 2.2 + random() * 2.8;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.55;
    const z = r * Math.cos(phi) * 0.7;

    if (Math.abs(x) < 1.4 && Math.abs(y) < 1.0) continue;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    brightness[i] = 0.35 + random() * 0.45;

    i++;
  }

  return { positions, brightness };
}

const PARTICLE_DATA = generateParticles();

function buildColors(brightness: Float32Array, isDark: boolean) {
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const multiplier = isDark ? 1.1 : 0.85;
  const offset = isDark ? 0.12 : 0.0;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const value = Math.min(1, brightness[i] * multiplier + offset);
    colors[i * 3] = value;
    colors[i * 3 + 1] = value;
    colors[i * 3 + 2] = value;
  }

  return colors;
}

function ParticleField({ isDark }: { isDark: boolean }) {
  const ref = useRef<THREE.Points>(null);

  const colors = useMemo(
    () => buildColors(PARTICLE_DATA.brightness, isDark),
    [isDark],
  );

  useEffect(() => {
    if (!ref.current) return;
    const colorAttr = ref.current.geometry.attributes.color;
    if (colorAttr) {
      (colorAttr as THREE.BufferAttribute).needsUpdate = true;
    }
  }, [colors]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.03;
    ref.current.rotation.x = Math.sin(t * 0.12) * 0.05;
  });

  return (
    <Points
      ref={ref}
      positions={PARTICLE_DATA.positions}
      colors={colors}
      stride={3}
      frustumCulled={false}
    >
      <PointMaterial
        transparent
        vertexColors
        size={0.018}
        sizeAttenuation
        depthWrite={false}
        opacity={0.5}
        blending={THREE.NormalBlending}
      />
    </Points>
  );
}

function FluidMesh({ isDark }: { isDark: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    if (!materialRef.current) return;
    materialRef.current.color.set(isDark ? "#6e6e73" : "#aeaeb2");
  }, [isDark]);

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
        ref={materialRef}
        color={isDark ? "#6e6e73" : "#aeaeb2"}
        wireframe
        transparent
        opacity={0.15}
      />
    </mesh>
  );
}

function SceneContent({ isDark }: { isDark: boolean }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <pointLight position={[8, 6, 8]} intensity={0.35} />
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
