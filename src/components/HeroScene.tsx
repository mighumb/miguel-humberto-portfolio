"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/contexts/ThemeContext";

const PARTICLE_COUNT = 3200;
const DRIFT_COUNT = 800;
const NEAR_COUNT = 480;

// Base screen-space radius (~cursor footprint in px), extended per particle size
const CURSOR_RADIUS_PX = 14;

function particleRadiusPx(
  worldPos: THREE.Vector3,
  camera: THREE.Camera,
  viewportHeight: number,
  pointSize: number,
  canvasHeight: number,
) {
  const persp = camera as THREE.PerspectiveCamera;
  const dist = worldPos.distanceTo(camera.position);
  if (dist <= 0.001) return pointSize;

  const vFov = (persp.fov * Math.PI) / 180;
  const bufferRadius = (pointSize * viewportHeight) / (2 * dist * Math.tan(vFov / 2));
  return bufferRadius * (canvasHeight / viewportHeight);
}

function screenFromWorld(
  worldPos: THREE.Vector3,
  camera: THREE.Camera,
  rect: DOMRect,
  out: THREE.Vector3,
) {
  out.copy(worldPos).project(camera);
  return {
    x: rect.left + ((out.x * 0.5 + 0.5) * rect.width),
    y: rect.top + ((-out.y * 0.5 + 0.5) * rect.height),
    depth: out.z,
  };
}

// Light / snow: soft white flakes that read on a cool sky
const LIGHT_PARTICLE = new THREE.Color("#b8c4d4");
const LIGHT_PARTICLE_ALT = new THREE.Color("#ffffff");

// Dark / space: star whites with a cool blue hint
const DARK_PARTICLE = new THREE.Color("#9aa3b8");
const DARK_PARTICLE_ALT = new THREE.Color("#f4f7ff");

const mouseInfluence = {
  screenX: 0,
  screenY: 0,
  active: false,
};

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
  const mix = new Float32Array(count);
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
    mix[i] = random();
    phases[i] = random() * Math.PI * 2;

    i++;
  }

  return { positions, mix, phases, actualCount: count };
}

const MAIN_LAYER = generateLayer(PARTICLE_COUNT, 42, 4.2);
const DRIFT_LAYER = generateLayer(DRIFT_COUNT, 137, 3.6);
const NEAR_LAYER = generateLayer(NEAR_COUNT, 911, 2.6);

function buildColors(mix: Float32Array, count: number, isDark: boolean) {
  const colors = new Float32Array(count * 3);
  const low = isDark ? DARK_PARTICLE : LIGHT_PARTICLE;
  const high = isDark ? DARK_PARTICLE_ALT : LIGHT_PARTICLE_ALT;
  const temp = new THREE.Color();

  for (let i = 0; i < count; i++) {
    temp.copy(low).lerp(high, mix[i]);
    colors[i * 3] = temp.r;
    colors[i * 3 + 1] = temp.g;
    colors[i * 3 + 2] = temp.b;
  }

  return colors;
}

function MouseTurbulenceTracker() {
  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      mouseInfluence.screenX = event.clientX;
      mouseInfluence.screenY = event.clientY;
      mouseInfluence.active = true;
    };

    const onPointerLeave = () => {
      mouseInfluence.active = false;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      mouseInfluence.active = false;
    };
  }, []);

  return null;
}

interface ParticleLayerProps {
  data: ReturnType<typeof generateLayer>;
  isDark: boolean;
  size: number;
  opacity: number;
  speed: number;
  drift: number;
  turbulenceStrength: number;
  blending?: THREE.Blending;
}

function ParticleLayer({
  data,
  isDark,
  size,
  opacity,
  speed,
  drift,
  turbulenceStrength,
  blending = THREE.NormalBlending,
}: ParticleLayerProps) {
  const { camera, size: viewport, gl } = useThree();
  const ref = useRef<THREE.Points>(null);
  const basePositions = useMemo(() => data.positions.slice(), [data.positions]);
  const offsets = useRef(new Float32Array(data.actualCount * 3));
  const velocities = useRef(new Float32Array(data.actualCount * 3));
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const pushWorld = useMemo(() => new THREE.Vector3(), []);
  const pushLocal = useMemo(() => new THREE.Vector3(), []);
  const cameraRight = useMemo(() => new THREE.Vector3(), []);
  const cameraUp = useMemo(() => new THREE.Vector3(), []);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const layerRotation = useMemo(() => new THREE.Quaternion(), []);

  const colors = useMemo(
    () => buildColors(data.mix, data.actualCount, isDark),
    [data.mix, data.actualCount, isDark],
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
    const points = ref.current;
    const t = state.clock.elapsedTime;
    points.rotation.y = t * speed;
    points.rotation.x = Math.sin(t * 0.1) * 0.04;
    points.updateMatrixWorld();

    const posAttr = points.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;
    const offsetArr = offsets.current;
    const velocityArr = velocities.current;
    const cursorActive = mouseInfluence.active;
    const cursorX = mouseInfluence.screenX;
    const cursorY = mouseInfluence.screenY;
    const canvasRect = gl.domElement.getBoundingClientRect();
    points.getWorldQuaternion(layerRotation).invert();

    cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    cameraUp.set(0, 1, 0).applyQuaternion(camera.quaternion);

    for (let i = 0; i < data.actualCount; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      const bx = basePositions[ix] + Math.sin(t * 0.4 + data.phases[i]) * drift;
      const by =
        basePositions[iy] + Math.cos(t * 0.35 + data.phases[i] * 1.3) * drift * 0.6;
      const bz =
        basePositions[iz] + Math.sin(t * 0.25 + data.phases[i] * 0.7) * drift * 0.4;

      const px = bx + offsetArr[ix];
      const py = by + offsetArr[iy];
      const pz = bz + offsetArr[iz];

      if (cursorActive) {
        worldPos.set(px, py, pz);
        points.localToWorld(worldPos);

        const screen = screenFromWorld(worldPos, camera, canvasRect, projected);
        if (screen.depth <= 1) {
          const dx = screen.x - cursorX;
          const dy = screen.y - cursorY;
          const dist = Math.hypot(dx, dy);
          const particlePx = particleRadiusPx(
            worldPos,
            camera,
            viewport.height,
            size,
            canvasRect.height,
          );
          const hitRadius = CURSOR_RADIUS_PX + particlePx;

          if (dist < hitRadius) {
            const falloff = (1 - dist / hitRadius) * turbulenceStrength;
            const nx = dx / (dist || 0.001);
            const ny = dy / (dist || 0.001);

            pushWorld
              .copy(cameraRight)
              .multiplyScalar(nx * falloff * 0.035)
              .addScaledVector(cameraUp, -ny * falloff * 0.035);
            pushLocal.copy(pushWorld).applyQuaternion(layerRotation);

            velocityArr[ix] += pushLocal.x;
            velocityArr[iy] += pushLocal.y;
            velocityArr[iz] += pushLocal.z + (data.phases[i] - 0.5) * falloff * 0.012;
          }
        }
      }

      velocityArr[ix] *= 0.86;
      velocityArr[iy] *= 0.86;
      velocityArr[iz] *= 0.86;

      offsetArr[ix] = offsetArr[ix] * 0.88 + velocityArr[ix];
      offsetArr[iy] = offsetArr[iy] * 0.88 + velocityArr[iy];
      offsetArr[iz] = offsetArr[iz] * 0.88 + velocityArr[iz];

      arr[ix] = bx + offsetArr[ix];
      arr[iy] = by + offsetArr[iy];
      arr[iz] = bz + offsetArr[iz];
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
        blending={blending}
      />
    </Points>
  );
}

function ShootingStars() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const nextSpawn = useRef(3 + Math.random() * 4);
  const star = useRef({
    active: false,
    life: 0,
    duration: 1,
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    length: 0.8,
  });

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;

    const t = state.clock.elapsedTime;
    const s = star.current;
    const dt = Math.min(delta, 0.05);

    if (!s.active) {
      mesh.visible = false;
      if (t >= nextSpawn.current) {
        s.active = true;
        s.life = 0;
        s.duration = 0.55 + Math.random() * 0.5;
        s.x = (Math.random() - 0.15) * 6;
        s.y = 1.4 + Math.random() * 2.2;
        s.z = 0.2 + Math.random() * 1.6;
        const speed = 3.4 + Math.random() * 2.2;
        s.vx = -(0.75 + Math.random() * 0.35) * speed;
        s.vy = -(0.35 + Math.random() * 0.25) * speed;
        s.length = 0.6 + Math.random() * 0.75;
        nextSpawn.current = t + 5 + Math.random() * 6;
      }
      return;
    }

    s.life += dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;

    const progress = s.life / s.duration;
    const fade =
      progress < 0.15
        ? progress / 0.15
        : progress > 0.65
          ? Math.max(0, 1 - (progress - 0.65) / 0.35)
          : 1;

    mesh.visible = fade > 0.02;
    mesh.position.set(s.x, s.y, s.z);
    mesh.rotation.z = Math.atan2(s.vy, s.vx);
    mesh.scale.set(s.length, 1, 1);
    material.opacity = 0.85 * fade;

    if (progress >= 1) {
      s.active = false;
      mesh.visible = false;
    }
  });

  return (
    <mesh ref={meshRef} visible={false} frustumCulled={false}>
      <planeGeometry args={[1, 0.012]} />
      <meshBasicMaterial
        ref={materialRef}
        color="#eef3ff"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function SceneContent({ isDark }: { isDark: boolean }) {
  const starBlend = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;

  return (
    <>
      <MouseTurbulenceTracker />
      <ambientLight intensity={0.8} />
      <ParticleLayer
        data={MAIN_LAYER}
        isDark={isDark}
        size={isDark ? 0.016 : 0.028}
        opacity={isDark ? 0.62 : 0.72}
        speed={0.014}
        drift={0.03}
        turbulenceStrength={0.85}
        blending={starBlend}
      />
      <ParticleLayer
        data={DRIFT_LAYER}
        isDark={isDark}
        size={isDark ? 0.028 : 0.042}
        opacity={isDark ? 0.32 : 0.55}
        speed={0.008}
        drift={0.045}
        turbulenceStrength={1}
        blending={starBlend}
      />
      {/* Foreground layer — closer, larger, more lively depth */}
      <ParticleLayer
        data={NEAR_LAYER}
        isDark={isDark}
        size={isDark ? 0.042 : 0.058}
        opacity={isDark ? 0.48 : 0.62}
        speed={0.018}
        drift={0.055}
        turbulenceStrength={1.15}
        blending={starBlend}
      />
      {isDark && <ShootingStars />}
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
