"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/contexts/ThemeContext";

const PARTICLE_COUNT = 3200;
const DRIFT_COUNT = 800;

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function generateLayer(count: number, seed: number, spread: number) {
  const random = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  const brightness = new Float32Array(count);
  const phases = new Float32Array(count);

  let i = 0;
  let attempts = 0;
  while (i < count && attempts < count * 20) {
    attempts++;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const r = spread * 0.6 + random() * spread;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.5;
    const z = r * Math.cos(phi) * 0.65;

    if (Math.abs(x) < 1.2 && Math.abs(y) < 0.85) continue;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    brightness[i] = 0.3 + random() * 0.5;
    phases[i] = random() * Math.PI * 2;

    i++;
  }

  return { positions, brightness, phases, actualCount: count };
}

const MAIN_LAYER = generateLayer(PARTICLE_COUNT, 42, 4.2);
const DRIFT_LAYER = generateLayer(DRIFT_COUNT, 137, 3.6);

function buildColors(brightness: Float32Array, count: number, isDark: boolean) {
  const colors = new Float32Array(count * 3);
  const multiplier = isDark ? 1.05 : 0.72;
  const offset = isDark ? 0.15 : 0.08;

  for (let i = 0; i < count; i++) {
    const value = Math.min(1, brightness[i] * multiplier + offset);
    colors[i * 3] = value;
    colors[i * 3 + 1] = value;
    colors[i * 3 + 2] = value;
  }

  return colors;
}

interface ParticleLayerProps {
  data: ReturnType<typeof generateLayer>;
  isDark: boolean;
  size: number;
  opacity: number;
  speed: number;
  drift: number;
}

function ParticleLayer({
  data,
  isDark,
  size,
  opacity,
  speed,
  drift,
}: ParticleLayerProps) {
  const ref = useRef<THREE.Points>(null);
  const basePositions = useMemo(() => data.positions.slice(), [data.positions]);

  const colors = useMemo(
    () => buildColors(data.brightness, data.actualCount, isDark),
    [data.brightness, data.actualCount, isDark],
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
    ref.current.rotation.y = t * speed;
    ref.current.rotation.x = Math.sin(t * 0.1) * 0.04;

    const posAttr = ref.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < data.actualCount; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;
      arr[ix] = basePositions[ix] + Math.sin(t * 0.4 + data.phases[i]) * drift;
      arr[iy] =
        basePositions[iy] + Math.cos(t * 0.35 + data.phases[i] * 1.3) * drift * 0.6;
      arr[iz] = basePositions[iz] + Math.sin(t * 0.25 + data.phases[i] * 0.7) * drift * 0.4;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <Points
      ref={ref}
      positions={data.positions}
      colors={colors}
      stride={3}
      frustumCulled={false}
    >
      <PointMaterial
        transparent
        vertexColors
        size={size}
        sizeAttenuation
        depthWrite={false}
        opacity={opacity}
        blending={THREE.NormalBlending}
      />
    </Points>
  );
}

function SceneContent({ isDark }: { isDark: boolean }) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <ParticleLayer
        data={MAIN_LAYER}
        isDark={isDark}
        size={0.016}
        opacity={isDark ? 0.55 : 0.42}
        speed={0.025}
        drift={0.04}
      />
      <ParticleLayer
        data={DRIFT_LAYER}
        isDark={isDark}
        size={0.028}
        opacity={isDark ? 0.25 : 0.18}
        speed={0.015}
        drift={0.06}
      />
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
