"use client";

import { useRef, useMemo, useEffect, useLayoutEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points } from "@react-three/drei";
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

// Dark = star dust (cooler/brighter). Light = soft snow grain (deeper gray so flakes read on pale sky).
const LIGHT_PARTICLE = new THREE.Color("#5e5e64");
const LIGHT_PARTICLE_ALT = new THREE.Color("#9a9aa2");

const DARK_PARTICLE = new THREE.Color("#8a8e98");
const DARK_PARTICLE_ALT = new THREE.Color("#e4e7f0");

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

    // Soft title clearance — smaller than before so the mid-field stays populated
    if (Math.abs(x) < 0.75 && Math.abs(y) < 0.5) continue;

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

type ParticleKind = "star" | "snow";

let starParticleTexture: THREE.CanvasTexture | null = null;
let snowParticleTexture: THREE.CanvasTexture | null = null;

function makeCanvasTexture(draw: (ctx: CanvasRenderingContext2D, size: number) => void) {
  if (typeof document === "undefined") return null;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, size, size);
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/** Space: tight bright core + fast-fading halo (edges dissolve into the sky). */
function getStarParticleTexture() {
  if (starParticleTexture) return starParticleTexture;
  starParticleTexture = makeCanvasTexture((ctx, size) => {
    const cx = size / 2;
    const gradient = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    // Opaque only at the very center; halo thins out quickly
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.06, "rgba(255,255,255,0.85)");
    gradient.addColorStop(0.16, "rgba(255,255,255,0.28)");
    gradient.addColorStop(0.32, "rgba(255,255,255,0.08)");
    gradient.addColorStop(0.55, "rgba(255,255,255,0.02)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Very soft diffraction cross — low alpha so it never reads as a filled disc
    ctx.globalCompositeOperation = "lighter";
    const arm = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx * 0.7);
    arm.addColorStop(0, "rgba(255,255,255,0.22)");
    arm.addColorStop(0.12, "rgba(255,255,255,0.06)");
    arm.addColorStop(0.45, "rgba(255,255,255,0.015)");
    arm.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = arm;
    ctx.fillRect(cx - 0.8, 8, 1.6, size - 16);
    ctx.fillRect(8, cx - 0.8, size - 16, 1.6);
    ctx.globalCompositeOperation = "source-over";
  });
  return starParticleTexture;
}

/** Craft/light: soft flake grain with the same center→edge opacity dissolve. */
function getSnowParticleTexture() {
  if (snowParticleTexture) return snowParticleTexture;
  snowParticleTexture = makeCanvasTexture((ctx, size) => {
    const cx = size / 2;
    const body = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx * 0.78);
    body.addColorStop(0, "rgba(255,255,255,0.92)");
    body.addColorStop(0.12, "rgba(255,255,255,0.4)");
    body.addColorStop(0.28, "rgba(255,255,255,0.12)");
    body.addColorStop(0.5, "rgba(255,255,255,0.03)");
    body.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = body;
    ctx.fillRect(0, 0, size, size);

    // Six soft arms — tip alpha near zero so edges melt into the sky
    ctx.save();
    ctx.translate(cx, cx);
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      const arm = ctx.createLinearGradient(0, 0, 0, -cx * 0.8);
      arm.addColorStop(0, "rgba(255,255,255,0.28)");
      arm.addColorStop(0.35, "rgba(255,255,255,0.08)");
      arm.addColorStop(0.7, "rgba(255,255,255,0.015)");
      arm.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = arm;
      ctx.beginPath();
      ctx.moveTo(-1.1, 0);
      ctx.lineTo(1.1, 0);
      ctx.lineTo(0.45, -cx * 0.8);
      ctx.lineTo(-0.45, -cx * 0.8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  });
  return snowParticleTexture;
}

function getParticleTexture(kind: ParticleKind) {
  return kind === "star" ? getStarParticleTexture() : getSnowParticleTexture();
}

/** Horizontal streak: bright head (right) → dissolving tail (left), soft across width. */
let streakParticleTexture: THREE.CanvasTexture | null = null;

function getStreakParticleTexture() {
  if (streakParticleTexture) return streakParticleTexture;
  streakParticleTexture = makeCanvasTexture((ctx, size) => {
    const w = size;
    const h = size;
    const cy = h / 2;

    for (let x = 0; x < w; x++) {
      const t = x / (w - 1);
      const along =
        t < 0.78
          ? Math.pow(t / 0.78, 1.8) * 0.45
          : 0.45 + Math.pow((t - 0.78) / 0.22, 0.55) * 0.55;
      for (let y = 0; y < h; y++) {
        const across = Math.abs(y - cy) / cy;
        const width = Math.pow(Math.max(0, 1 - across), 2.4);
        const a = along * width;
        if (a < 0.004) continue;
        ctx.fillStyle = `rgba(255,255,255,${Math.min(1, a)})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  return streakParticleTexture;
}

const STREAK_VERTEX = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const STREAK_FRAGMENT = /* glsl */ `
uniform sampler2D uMap;
uniform float uFade;
uniform float uBrightness;
uniform float uAlphaPower;
uniform vec3 uColor;

varying vec2 vUv;

void main() {
  vec4 texel = texture2D(uMap, vUv);
  float soft = pow(max(texel.a, 0.0), uAlphaPower);

  float along = vUv.x;
  float across = abs(vUv.y - 0.5) * 2.0;
  float lengthMask = pow(along, 0.55);
  float widthMask = pow(max(0.0, 1.0 - across), 2.1);
  float alpha = soft * lengthMask * widthMask * uFade * uBrightness;
  if (alpha < 0.01) discard;

  vec3 col = uColor * (0.55 + 0.7 * soft * along);
  gl_FragColor = vec4(col, alpha);
}
`;

const HEAD_VERTEX = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const HEAD_FRAGMENT = /* glsl */ `
uniform sampler2D uMap;
uniform float uFade;
uniform float uBrightness;
uniform vec3 uColor;

varying vec2 vUv;

void main() {
  vec4 texel = texture2D(uMap, vUv);
  float soft = pow(max(texel.a, 0.0), 1.85);
  float alpha = soft * uFade * uBrightness;
  if (alpha < 0.012) discard;
  vec3 col = uColor * (0.75 + 0.5 * soft);
  gl_FragColor = vec4(col, alpha);
}
`;

const PARTICLE_VERTEX = /* glsl */ `
attribute float aScale;
attribute float aPhase;
attribute vec3 color;

uniform float uSize;
uniform float uTime;
uniform float uScale;
uniform float uPixelRatio;
uniform float uTwinkleAmp;
uniform float uSizeBreath;
uniform float uSpin;

varying vec3 vColor;
varying float vAlpha;
varying float vPhase;
varying float vSpin;

void main() {
  vColor = color;
  vPhase = aPhase;
  vSpin = uSpin;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float depth = max(0.35, -mvPosition.z);

  // Closer particles read a bit brighter / more present
  float depthFade = smoothstep(11.0, 2.2, depth);

  // Soft twinkle — phase-offset so the field does not pulse as one
  float twinkle = 1.0 - uTwinkleAmp
    + uTwinkleAmp * (0.5 + 0.5 * sin(uTime * (1.6 + aPhase * 2.4) + aPhase * 6.2831853));

  float sizePulse = 1.0 - uSizeBreath
    + uSizeBreath * (0.5 + 0.5 * sin(uTime * (0.9 + aPhase) + aPhase * 4.0));

  vAlpha = depthFade * twinkle;

  float pointSize = uSize * aScale * sizePulse * (uScale / depth) * uPixelRatio;
  gl_PointSize = clamp(pointSize, 1.5, 72.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

const PARTICLE_FRAGMENT = /* glsl */ `
uniform sampler2D uMap;
uniform float uOpacity;
uniform float uTime;
uniform float uCoreBoost;
uniform float uAlphaPower;

varying vec3 vColor;
varying float vAlpha;
varying float vPhase;
varying float vSpin;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float angle = vPhase + uTime * vSpin;
  float c = cos(angle);
  float s = sin(angle);
  uv = mat2(c, -s, s, c) * uv + 0.5;

  vec4 texel = texture2D(uMap, uv);
  // Push mid/edge alphas down so the halo dissolves into the background
  float softAlpha = pow(max(texel.a, 0.0), uAlphaPower);
  float alpha = softAlpha * uOpacity * vAlpha;
  if (alpha < 0.01) discard;

  // Color follows the same falloff — edges don't paint a flat grey disc
  vec3 col = vColor * mix(uCoreBoost, 1.05, softAlpha);
  gl_FragColor = vec4(col, alpha);
}
`;

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
  kind: ParticleKind;
  size: number;
  opacity: number;
  speed: number;
  drift: number;
  turbulenceStrength: number;
  fallSpeed?: number;
  blending?: THREE.Blending;
}

function ParticleLayer({
  data,
  isDark,
  kind,
  size,
  opacity,
  speed,
  drift,
  turbulenceStrength,
  fallSpeed = 0,
  blending = THREE.NormalBlending,
}: ParticleLayerProps) {
  const { camera, size: viewport, gl } = useThree();
  const ref = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
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

  const scales = useMemo(() => {
    const out = new Float32Array(data.actualCount);
    for (let i = 0; i < data.actualCount; i++) {
      // Stars: wider size range. Snow: slightly tighter, softer variety.
      out[i] =
        kind === "star"
          ? 0.45 + data.mix[i] * 1.2
          : 0.62 + data.mix[i] * 0.85;
    }
    return out;
  }, [data.mix, data.actualCount, kind]);

  const material = useMemo(() => {
    const map = getParticleTexture(kind);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: map },
        uSize: { value: size },
        uOpacity: { value: opacity },
        uTime: { value: 0 },
        uScale: { value: 300 },
        uPixelRatio: { value: 1 },
        uTwinkleAmp: { value: kind === "star" ? 0.28 : 0.08 },
        uSizeBreath: { value: kind === "star" ? 0.1 : 0.04 },
        uSpin: { value: kind === "star" ? 0.0 : 0.22 },
        uCoreBoost: { value: kind === "star" ? 0.72 : 0.85 },
        uAlphaPower: { value: kind === "star" ? 1.95 : 1.75 },
      },
      vertexShader: PARTICLE_VERTEX,
      fragmentShader: PARTICLE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending,
      toneMapped: false,
    });
    materialRef.current = mat;
    return mat;
  }, [blending, kind, opacity, size]);

  useEffect(() => {
    material.uniforms.uMap.value = getParticleTexture(kind);
    material.uniforms.uSize.value = size;
    material.uniforms.uOpacity.value = opacity;
    material.uniforms.uTwinkleAmp.value = kind === "star" ? 0.28 : 0.08;
    material.uniforms.uSizeBreath.value = kind === "star" ? 0.1 : 0.04;
    material.uniforms.uSpin.value = kind === "star" ? 0.0 : 0.22;
    material.uniforms.uCoreBoost.value = kind === "star" ? 0.72 : 0.85;
    material.uniforms.uAlphaPower.value = kind === "star" ? 1.95 : 1.75;
    material.blending = blending;
  }, [material, size, opacity, kind, blending]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useLayoutEffect(() => {
    const geo = ref.current?.geometry;
    if (!geo) return;
    geo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(data.phases, 1));
  }, [scales, data.phases]);

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

    // Stars: slow celestial tumble. Snow: almost no global spin — fall dominates.
    if (kind === "star") {
      points.rotation.y = t * speed;
      points.rotation.x = Math.sin(t * 0.1) * 0.04;
    } else {
      points.rotation.y = t * speed * 0.25;
      points.rotation.x = Math.sin(t * 0.06) * 0.02;
    }
    points.updateMatrixWorld();

    const mat = materialRef.current;
    if (mat) {
      mat.uniforms.uTime.value = t;
      mat.uniforms.uPixelRatio.value = gl.getPixelRatio();
      const persp = camera as THREE.PerspectiveCamera;
      const fovRad = THREE.MathUtils.degToRad(persp.fov);
      mat.uniforms.uScale.value = viewport.height * 0.5 / Math.tan(fovRad * 0.5);
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

    const swayX = kind === "snow" ? 1.35 : 1;
    const swayY = kind === "snow" ? 0.35 : 0.6;

    for (let i = 0; i < data.actualCount; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      const fall =
        fallSpeed > 0
          ? -(((t * fallSpeed + data.phases[i] * 2.7) % 5.2) - 2.6)
          : 0;

      const bx =
        basePositions[ix] +
        Math.sin(t * 0.4 + data.phases[i]) * drift * swayX;
      const by =
        basePositions[iy] +
        Math.cos(t * 0.35 + data.phases[i] * 1.3) * drift * swayY +
        fall;
      const bz =
        basePositions[iz] +
        Math.sin(t * 0.25 + data.phases[i] * 0.7) * drift * 0.4;

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
      material={material}
    />
  );
}

type StreakState = {
  active: boolean;
  life: number;
  duration: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  length: number;
  width: number;
  headSize: number;
  brightness: number;
  nextSpawn: number;
};

function createStreakState(initialDelay: number): StreakState {
  return {
    active: false,
    life: 0,
    duration: 1,
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    length: 0.8,
    width: 0.03,
    headSize: 0.06,
    brightness: 0.8,
    nextSpawn: initialDelay,
  };
}

function spawnStreak(s: StreakState, t: number) {
  s.active = true;
  s.life = 0;
  const bold = Math.random() > 0.55;
  s.duration = bold ? 0.55 + Math.random() * 0.55 : 0.35 + Math.random() * 0.35;
  s.x = (Math.random() - 0.2) * 6.5;
  s.y = 1.1 + Math.random() * 2.6;
  s.z = 0.15 + Math.random() * 1.8;

  const speed = bold ? 3.2 + Math.random() * 2.8 : 2.4 + Math.random() * 2.0;
  const angle =
    -Math.PI * (0.12 + Math.random() * 0.38) + (Math.random() > 0.82 ? Math.PI * 0.08 : 0);
  s.vx = Math.cos(angle) * -speed;
  s.vy = Math.sin(angle) * speed;

  s.length = bold ? 0.75 + Math.random() * 0.9 : 0.4 + Math.random() * 0.45;
  s.width = bold ? 0.028 + Math.random() * 0.022 : 0.016 + Math.random() * 0.014;
  s.headSize = bold ? 0.055 + Math.random() * 0.035 : 0.035 + Math.random() * 0.02;
  s.brightness = bold ? 0.7 + Math.random() * 0.35 : 0.35 + Math.random() * 0.3;
  s.nextSpawn = t + (bold ? 4.5 + Math.random() * 5.5 : 2.8 + Math.random() * 4.5);
}

function streakLifeFade(progress: number) {
  if (progress < 0.12) return progress / 0.12;
  if (progress > 0.62) return Math.max(0, 1 - (progress - 0.62) / 0.38);
  return 1;
}

function ShootingStarSlot({ initialDelay }: { initialDelay: number }) {
  const trailRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const trailMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const headMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const state = useRef(createStreakState(initialDelay));

  const trailMaterial = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: getStreakParticleTexture() },
        uFade: { value: 0 },
        uBrightness: { value: 1 },
        uAlphaPower: { value: 1.55 },
        uColor: { value: new THREE.Color("#e8eaf2") },
      },
      vertexShader: STREAK_VERTEX,
      fragmentShader: STREAK_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    trailMatRef.current = mat;
    return mat;
  }, []);

  const headMaterial = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: getStarParticleTexture() },
        uFade: { value: 0 },
        uBrightness: { value: 1 },
        uColor: { value: new THREE.Color("#f2f4fa") },
      },
      vertexShader: HEAD_VERTEX,
      fragmentShader: HEAD_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    headMatRef.current = mat;
    return mat;
  }, []);

  useEffect(() => {
    return () => {
      trailMaterial.dispose();
      headMaterial.dispose();
    };
  }, [trailMaterial, headMaterial]);

  useFrame((clockState, delta) => {
    const trail = trailRef.current;
    const head = headRef.current;
    const trailMat = trailMatRef.current;
    const headMat = headMatRef.current;
    if (!trail || !head || !trailMat || !headMat) return;

    const t = clockState.clock.elapsedTime;
    const s = state.current;
    const dt = Math.min(delta, 0.05);

    if (!s.active) {
      trail.visible = false;
      head.visible = false;
      if (t >= s.nextSpawn) spawnStreak(s, t);
      return;
    }

    s.life += dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;

    const progress = s.life / s.duration;
    const fade = streakLifeFade(progress);
    const angle = Math.atan2(s.vy, s.vx);

    const midX = s.x - Math.cos(angle) * s.length * 0.5;
    const midY = s.y - Math.sin(angle) * s.length * 0.5;

    trail.visible = fade > 0.02;
    trail.position.set(midX, midY, s.z);
    trail.rotation.z = angle;
    trail.scale.set(s.length, s.width, 1);
    trailMat.uniforms.uFade.value = fade;
    trailMat.uniforms.uBrightness.value = s.brightness;

    head.visible = fade > 0.02;
    head.position.set(s.x, s.y, s.z + 0.001);
    head.scale.setScalar(s.headSize);
    headMat.uniforms.uFade.value = fade;
    headMat.uniforms.uBrightness.value = s.brightness * 1.15;

    if (progress >= 1) {
      s.active = false;
      trail.visible = false;
      head.visible = false;
    }
  });

  return (
    <group>
      <mesh ref={trailRef} visible={false} frustumCulled={false} material={trailMaterial}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh ref={headRef} visible={false} frustumCulled={false} material={headMaterial}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </group>
  );
}

function ShootingStars() {
  return (
    <>
      <ShootingStarSlot initialDelay={2.2 + Math.random() * 2} />
      <ShootingStarSlot initialDelay={5.5 + Math.random() * 3} />
      <ShootingStarSlot initialDelay={9 + Math.random() * 4} />
    </>
  );
}

function SceneContent({ isDark }: { isDark: boolean }) {
  const kind: ParticleKind = isDark ? "star" : "snow";
  const blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending;

  return (
    <>
      <MouseTurbulenceTracker />
      <ambientLight intensity={0.8} />
      <ParticleLayer
        data={MAIN_LAYER}
        isDark={isDark}
        kind={kind}
        size={isDark ? 0.02 : 0.034}
        opacity={isDark ? 0.78 : 0.58}
        speed={isDark ? 0.014 : 0.006}
        drift={isDark ? 0.03 : 0.05}
        fallSpeed={isDark ? 0 : 0.09}
        turbulenceStrength={0.85}
        blending={blending}
      />
      <ParticleLayer
        data={DRIFT_LAYER}
        isDark={isDark}
        kind={kind}
        size={isDark ? 0.038 : 0.05}
        opacity={isDark ? 0.32 : 0.36}
        speed={isDark ? 0.008 : 0.004}
        drift={isDark ? 0.045 : 0.07}
        fallSpeed={isDark ? 0 : 0.06}
        turbulenceStrength={1}
        blending={blending}
      />
      <ParticleLayer
        data={NEAR_LAYER}
        isDark={isDark}
        kind={kind}
        size={isDark ? 0.05 : 0.066}
        opacity={isDark ? 0.5 : 0.4}
        speed={isDark ? 0.018 : 0.008}
        drift={isDark ? 0.055 : 0.08}
        fallSpeed={isDark ? 0 : 0.12}
        turbulenceStrength={1.15}
        blending={blending}
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
