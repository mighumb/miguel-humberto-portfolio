"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useTheme } from "@/contexts/ThemeContext";

type AmbientKind = "space" | "snow";

const CURSOR_RADIUS_PX = 14;

// Space: cool whites / soft blues on deep black
const SPACE_NEAR = new THREE.Color("#f2f4ff");
const SPACE_FAR = new THREE.Color("#7a8499");
const SPACE_ACCENT = new THREE.Color("#c5d4ff");

// Snow: soft gray-blue flakes on light sky
const SNOW_NEAR = new THREE.Color("#ffffff");
const SNOW_FAR = new THREE.Color("#9aa3b2");
const SNOW_ACCENT = new THREE.Color("#d7dde8");

const mouseInfluence = {
  screenX: 0,
  screenY: 0,
  active: false,
};

const scrollState = {
  intensity: 1,
};

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

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
    x: rect.left + (out.x * 0.5 + 0.5) * rect.width,
    y: rect.top + (-out.y * 0.5 + 0.5) * rect.height,
    depth: out.z,
  };
}

function generateStarLayer(count: number, seed: number, spread: number) {
  const random = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  const mix = new Float32Array(count);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);

  let i = 0;
  let attempts = 0;
  while (i < count && attempts < count * 24) {
    attempts += 1;
    const theta = random() * Math.PI * 2;
    const phi = Math.acos(2 * random() - 1);
    const r = spread * 0.55 + random() * spread * 0.7;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.55;
    const z = r * Math.cos(phi) * 0.7;

    // Keep a softer void around the hero title zone
    if (Math.abs(x) < 1.05 && Math.abs(y) < 0.75) continue;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    mix[i] = random();
    phases[i] = random() * Math.PI * 2;
    sizes[i] = 0.55 + random() * 1.45;
    i += 1;
  }

  return { positions, mix, phases, sizes, actualCount: count };
}

function generateSnowLayer(count: number, seed: number, depth: number) {
  const random = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  const mix = new Float32Array(count);
  const phases = new Float32Array(count);
  const sizes = new Float32Array(count);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (random() - 0.5) * 10;
    positions[i * 3 + 1] = (random() - 0.5) * 8;
    positions[i * 3 + 2] = depth + (random() - 0.5) * 1.2;
    mix[i] = random();
    phases[i] = random() * Math.PI * 2;
    sizes[i] = 0.6 + random() * 1.6;
    speeds[i] = 0.35 + random() * 0.85;
  }

  return { positions, mix, phases, sizes, speeds, actualCount: count };
}

const SPACE_FAR_LAYER = generateStarLayer(2200, 42, 5.2);
const SPACE_MID_LAYER = generateStarLayer(900, 137, 4.0);
const SPACE_NEAR_LAYER = generateStarLayer(420, 911, 3.2);

const SNOW_FAR_LAYER = generateSnowLayer(1100, 51, -2.4);
const SNOW_MID_LAYER = generateSnowLayer(700, 173, -0.6);
const SNOW_NEAR_LAYER = generateSnowLayer(380, 809, 1.2);

function buildColors(
  mix: Float32Array,
  count: number,
  kind: AmbientKind,
) {
  const colors = new Float32Array(count * 3);
  const low = kind === "space" ? SPACE_FAR : SNOW_FAR;
  const mid = kind === "space" ? SPACE_ACCENT : SNOW_ACCENT;
  const high = kind === "space" ? SPACE_NEAR : SNOW_NEAR;
  const temp = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const m = mix[i];
    if (m < 0.55) {
      temp.copy(low).lerp(mid, m / 0.55);
    } else {
      temp.copy(mid).lerp(high, (m - 0.55) / 0.45);
    }
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

function ScrollIntensityTracker() {
  useEffect(() => {
    const update = () => {
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const t = Math.min(1, Math.max(0, window.scrollY / max));
      // Hero lively, footer calmer
      scrollState.intensity = 1 - t * 0.62;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return null;
}

interface StarLayerProps {
  data: ReturnType<typeof generateStarLayer>;
  size: number;
  opacity: number;
  speed: number;
  drift: number;
  twinkle: number;
  turbulenceStrength: number;
}

function StarLayer({
  data,
  size,
  opacity,
  speed,
  drift,
  twinkle,
  turbulenceStrength,
}: StarLayerProps) {
  const { camera, size: viewport, gl } = useThree();
  const ref = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
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
    () => buildColors(data.mix, data.actualCount, "space"),
    [data.mix, data.actualCount],
  );

  useFrame((state) => {
    if (!ref.current) return;
    const points = ref.current;
    const t = state.clock.elapsedTime;
    const intensity = scrollState.intensity;

    points.rotation.y = t * speed * (0.35 + intensity * 0.65);
    points.rotation.x = Math.sin(t * 0.08) * 0.03;
    points.updateMatrixWorld();

    if (materialRef.current) {
      const pulse = 0.92 + Math.sin(t * 0.7) * 0.08 * twinkle;
      materialRef.current.opacity = opacity * intensity * pulse;
    }

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
      const phase = data.phases[i];

      const bx = basePositions[ix] + Math.sin(t * 0.25 + phase) * drift;
      const by =
        basePositions[iy] + Math.cos(t * 0.22 + phase * 1.3) * drift * 0.55;
      const bz =
        basePositions[iz] + Math.sin(t * 0.18 + phase * 0.7) * drift * 0.35;

      const px = bx + offsetArr[ix];
      const py = by + offsetArr[iy];
      const pz = bz + offsetArr[iz];

      if (cursorActive && turbulenceStrength > 0) {
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
            const falloff =
              (1 - dist / hitRadius) * turbulenceStrength * intensity;
            const nx = dx / (dist || 0.001);
            const ny = dy / (dist || 0.001);

            pushWorld
              .copy(cameraRight)
              .multiplyScalar(nx * falloff * 0.028)
              .addScaledVector(cameraUp, -ny * falloff * 0.028);
            pushLocal.copy(pushWorld).applyQuaternion(layerRotation);

            velocityArr[ix] += pushLocal.x;
            velocityArr[iy] += pushLocal.y;
            velocityArr[iz] += pushLocal.z + (phase - 0.5) * falloff * 0.01;
          }
        }
      }

      velocityArr[ix] *= 0.88;
      velocityArr[iy] *= 0.88;
      velocityArr[iz] *= 0.88;

      offsetArr[ix] = offsetArr[ix] * 0.9 + velocityArr[ix];
      offsetArr[iy] = offsetArr[iy] * 0.9 + velocityArr[iy];
      offsetArr[iz] = offsetArr[iz] * 0.9 + velocityArr[iz];

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
        ref={materialRef}
        transparent
        vertexColors
        size={size}
        sizeAttenuation
        depthWrite={false}
        opacity={opacity}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

interface SnowLayerProps {
  data: ReturnType<typeof generateSnowLayer>;
  size: number;
  opacity: number;
  fallSpeed: number;
  drift: number;
  turbulenceStrength: number;
}

function SnowLayer({
  data,
  size,
  opacity,
  fallSpeed,
  drift,
  turbulenceStrength,
}: SnowLayerProps) {
  const { camera, size: viewport, gl } = useThree();
  const ref = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const live = useRef(data.positions.slice());
  const offsets = useRef(new Float32Array(data.actualCount * 3));
  const velocities = useRef(new Float32Array(data.actualCount * 3));
  const worldPos = useMemo(() => new THREE.Vector3(), []);
  const pushWorld = useMemo(() => new THREE.Vector3(), []);
  const cameraRight = useMemo(() => new THREE.Vector3(), []);
  const cameraUp = useMemo(() => new THREE.Vector3(), []);
  const projected = useMemo(() => new THREE.Vector3(), []);

  const colors = useMemo(
    () => buildColors(data.mix, data.actualCount, "snow"),
    [data.mix, data.actualCount],
  );

  useFrame((state, delta) => {
    if (!ref.current) return;
    const points = ref.current;
    const t = state.clock.elapsedTime;
    const intensity = scrollState.intensity;
    const dt = Math.min(delta, 0.05);
    const arr = live.current;
    const offsetArr = offsets.current;
    const velocityArr = velocities.current;
    const posAttr = points.geometry.attributes.position;

    if (materialRef.current) {
      materialRef.current.opacity = opacity * (0.55 + intensity * 0.45);
    }

    const cursorActive = mouseInfluence.active;
    const cursorX = mouseInfluence.screenX;
    const cursorY = mouseInfluence.screenY;
    const canvasRect = gl.domElement.getBoundingClientRect();

    cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    cameraUp.set(0, 1, 0).applyQuaternion(camera.quaternion);

    for (let i = 0; i < data.actualCount; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;
      const phase = data.phases[i];
      const flakeSpeed = data.speeds[i];

      arr[iy] -= fallSpeed * flakeSpeed * dt * (0.55 + intensity * 0.7);
      arr[ix] +=
        Math.sin(t * (0.4 + flakeSpeed * 0.35) + phase) * drift * dt * 1.8;

      if (arr[iy] < -4.2) {
        arr[iy] = 4.2;
        arr[ix] = (Math.random() - 0.5) * 10;
      }
      if (arr[ix] > 5.2) arr[ix] = -5.2;
      if (arr[ix] < -5.2) arr[ix] = 5.2;

      const px = arr[ix] + offsetArr[ix];
      const py = arr[iy] + offsetArr[iy];
      const pz = arr[iz] + offsetArr[iz];

      if (cursorActive && turbulenceStrength > 0) {
        worldPos.set(px, py, pz);

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
          const hitRadius = CURSOR_RADIUS_PX + particlePx * 1.2;

          if (dist < hitRadius) {
            const falloff =
              (1 - dist / hitRadius) * turbulenceStrength * intensity;
            const nx = dx / (dist || 0.001);
            const ny = dy / (dist || 0.001);

            pushWorld
              .copy(cameraRight)
              .multiplyScalar(nx * falloff * 0.04)
              .addScaledVector(cameraUp, -ny * falloff * 0.04);

            velocityArr[ix] += pushWorld.x;
            velocityArr[iy] += pushWorld.y;
            velocityArr[iz] += (phase - 0.5) * falloff * 0.008;
          }
        }
      }

      velocityArr[ix] *= 0.86;
      velocityArr[iy] *= 0.86;
      velocityArr[iz] *= 0.86;

      offsetArr[ix] = offsetArr[ix] * 0.88 + velocityArr[ix];
      offsetArr[iy] = offsetArr[iy] * 0.88 + velocityArr[iy];
      offsetArr[iz] = offsetArr[iz] * 0.88 + velocityArr[iz];

      posAttr.array[ix] = px;
      posAttr.array[iy] = py;
      posAttr.array[iz] = pz;
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
        ref={materialRef}
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

interface ShootingStar {
  active: boolean;
  life: number;
  duration: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  length: number;
}

function ShootingStars() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const nextSpawn = useRef(2.5 + Math.random() * 3);
  const star = useRef<ShootingStar>({
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
    const intensity = scrollState.intensity;
    const s = star.current;
    const dt = Math.min(delta, 0.05);

    if (!s.active) {
      mesh.visible = false;
      if (t >= nextSpawn.current && intensity > 0.35) {
        s.active = true;
        s.life = 0;
        s.duration = 0.55 + Math.random() * 0.55;
        s.x = (Math.random() - 0.2) * 6;
        s.y = 1.2 + Math.random() * 2.4;
        s.z = -1 + Math.random() * 2;
        const speed = 3.2 + Math.random() * 2.4;
        s.vx = -(0.75 + Math.random() * 0.35) * speed;
        s.vy = -(0.35 + Math.random() * 0.25) * speed;
        s.length = 0.55 + Math.random() * 0.7;
        nextSpawn.current = t + 4.5 + Math.random() * 5.5;
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

    const angle = Math.atan2(s.vy, s.vx);
    mesh.visible = fade > 0.02;
    mesh.position.set(s.x, s.y, s.z);
    mesh.rotation.z = angle;
    mesh.scale.set(s.length, 1, 1);
    material.opacity = 0.8 * fade * intensity;

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
        color="#e8eeff"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function SpaceScene() {
  return (
    <>
      <MouseTurbulenceTracker />
      <ScrollIntensityTracker />
      <ambientLight intensity={0.35} />
      <StarLayer
        data={SPACE_FAR_LAYER}
        size={0.012}
        opacity={0.42}
        speed={0.008}
        drift={0.015}
        twinkle={0.35}
        turbulenceStrength={0.35}
      />
      <StarLayer
        data={SPACE_MID_LAYER}
        size={0.018}
        opacity={0.55}
        speed={0.012}
        drift={0.025}
        twinkle={0.55}
        turbulenceStrength={0.5}
      />
      <StarLayer
        data={SPACE_NEAR_LAYER}
        size={0.028}
        opacity={0.7}
        speed={0.016}
        drift={0.035}
        twinkle={0.8}
        turbulenceStrength={0.65}
      />
      <ShootingStars />
    </>
  );
}

function SnowScene() {
  return (
    <>
      <MouseTurbulenceTracker />
      <ScrollIntensityTracker />
      <ambientLight intensity={0.9} />
      <SnowLayer
        data={SNOW_FAR_LAYER}
        size={0.02}
        opacity={0.28}
        fallSpeed={0.55}
        drift={0.18}
        turbulenceStrength={0.55}
      />
      <SnowLayer
        data={SNOW_MID_LAYER}
        size={0.03}
        opacity={0.4}
        fallSpeed={0.75}
        drift={0.28}
        turbulenceStrength={0.75}
      />
      <SnowLayer
        data={SNOW_NEAR_LAYER}
        size={0.045}
        opacity={0.55}
        fallSpeed={1.05}
        drift={0.4}
        turbulenceStrength={0.95}
      />
    </>
  );
}

function SceneContent({ kind }: { kind: AmbientKind }) {
  return kind === "space" ? <SpaceScene /> : <SnowScene />;
}

export default function HeroScene() {
  const { theme } = useTheme();
  const kind: AmbientKind = theme === "dark" ? "space" : "snow";
  const [canvasOpacity, setCanvasOpacity] = useState(1);

  useEffect(() => {
    const update = () => {
      const max = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const t = Math.min(1, Math.max(0, window.scrollY / max));
      setCanvasOpacity(1 - t * 0.35);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <Canvas
      key={kind}
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{
        background: "transparent",
        width: "100%",
        height: "100%",
        opacity: canvasOpacity,
        transition: "opacity 200ms linear",
      }}
    >
      <SceneContent kind={kind} />
    </Canvas>
  );
}
