"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useLocale } from "@/contexts/LocaleContext";
import { useTheme } from "@/contexts/ThemeContext";
import { translations } from "@/lib/i18n";
import type { PortfolioTrack, PortfolioView } from "@/lib/portfolioTypes";
import { projectsForTrack, type Project } from "@/lib/projects";

const RED = new THREE.Color("#c62828");
const BLUE = new THREE.Color("#1565c0");
const RED_LIGHT = new THREE.Color("#ff6b6b");
const BLUE_LIGHT = new THREE.Color("#64b5f6");

interface SceneApi {
  view: PortfolioView;
  activeTrack: PortfolioTrack | null;
  carouselAngle: MutableRefObject<number>;
  onSelectTrack: (track: PortfolioTrack) => void;
  onOpenProject: (project: Project) => void;
}

const SceneApiContext = createContext<SceneApi | null>(null);

function useSceneApi() {
  const api = useContext(SceneApiContext);
  if (!api) throw new Error("SceneApi missing");
  return api;
}

function StudioRoom({ isDark }: { isDark: boolean }) {
  const wall = isDark ? "#141416" : "#e8e8ed";
  const floor = isDark ? "#0f0f11" : "#dcdce2";
  const back = isDark ? "#101012" : "#ececf0";

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]} receiveShadow>
        <planeGeometry args={[28, 28]} />
        <meshStandardMaterial color={floor} roughness={0.92} metalness={0.02} />
      </mesh>
      <mesh position={[0, 2.2, -8]} receiveShadow>
        <planeGeometry args={[28, 12]} />
        <meshStandardMaterial color={back} roughness={0.95} metalness={0} />
      </mesh>
      <mesh position={[-10, 2.2, -2]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[18, 12]} />
        <meshStandardMaterial color={wall} roughness={0.95} metalness={0} />
      </mesh>
      <mesh position={[10, 2.2, -2]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[18, 12]} />
        <meshStandardMaterial color={wall} roughness={0.95} metalness={0} />
      </mesh>
    </group>
  );
}

interface PillProps {
  track: PortfolioTrack;
  position: [number, number, number];
  interactive?: boolean;
  scale?: number;
  compact?: boolean;
}

function Pill({
  track,
  position,
  interactive = true,
  scale = 1,
  compact = false,
}: PillProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const hoverOffset = useRef(new THREE.Vector2(0, 0));
  const targetRot = useRef(new THREE.Euler(0, 0, 0));
  const [hovered, setHovered] = useState(false);
  const { onSelectTrack } = useSceneApi();
  const color = track === "ai" ? RED : BLUE;
  const accent = track === "ai" ? RED_LIGHT : BLUE_LIGHT;

  useFrame((state) => {
    const group = groupRef.current;
    const mesh = meshRef.current;
    if (!group || !mesh) return;

    const t = state.clock.elapsedTime;
    const floatY = Math.sin(t * 1.1 + (track === "ai" ? 0 : 1.7)) * 0.06;
    group.position.y = position[1] + floatY;

    if (interactive && hovered) {
      targetRot.current.x = hoverOffset.current.y * 0.55;
      targetRot.current.y = hoverOffset.current.x * 0.75;
      targetRot.current.z = hoverOffset.current.x * -0.2;
    } else {
      targetRot.current.x = Math.sin(t * 0.55 + (track === "ai" ? 0.2 : 1)) * 0.08;
      targetRot.current.y = Math.cos(t * 0.4 + (track === "ai" ? 0.5 : 1.4)) * 0.12;
      targetRot.current.z = Math.sin(t * 0.35) * 0.04;
    }

    mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, targetRot.current.x, 0.12);
    mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, targetRot.current.y, 0.12);
    mesh.rotation.z = THREE.MathUtils.lerp(mesh.rotation.z, targetRot.current.z, 0.12);
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh
        ref={meshRef}
        castShadow
        rotation={[0, 0, Math.PI / 2]}
        onPointerOver={(event) => {
          if (!interactive) return;
          event.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          if (!interactive) return;
          setHovered(false);
          hoverOffset.current.set(0, 0);
          document.body.style.cursor = "";
        }}
        onPointerMove={(event) => {
          if (!interactive || !hovered) return;
          const local = event.point.clone();
          groupRef.current?.worldToLocal(local);
          hoverOffset.current.set(
            THREE.MathUtils.clamp(local.x * 1.4, -1, 1),
            THREE.MathUtils.clamp(local.y * 1.4, -1, 1),
          );
        }}
        onClick={(event) => {
          if (!interactive) return;
          event.stopPropagation();
          onSelectTrack(track);
        }}
      >
        <capsuleGeometry args={[compact ? 0.22 : 0.28, compact ? 0.55 : 0.72, 12, 24]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.22}
          metalness={0.15}
          clearcoat={0.65}
          clearcoatRoughness={0.2}
          emissive={accent}
          emissiveIntensity={hovered ? 0.18 : 0.06}
        />
      </mesh>
      {/* Capsule highlight band */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0.01]}>
        <torusGeometry args={[compact ? 0.225 : 0.285, 0.012, 8, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.35} metalness={0.1} transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function RoleLabels({ mobile }: { mobile: boolean }) {
  const { locale } = useLocale();
  const t = translations[locale];
  const { view } = useSceneApi();

  if (view !== "home") return null;

  if (mobile) {
    return (
      <>
        <Html position={[0, 1.55, 0]} center style={{ pointerEvents: "none", width: "220px" }}>
          <div className="text-center">
            <p className="text-sm font-medium text-text-primary">{t.roles.ai.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">{t.roles.ai.description}</p>
          </div>
        </Html>
        <Html position={[0, -1.95, 0]} center style={{ pointerEvents: "none", width: "220px" }}>
          <div className="text-center">
            <p className="text-sm font-medium text-text-primary">{t.roles.product.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">
              {t.roles.product.description}
            </p>
          </div>
        </Html>
      </>
    );
  }

  return (
    <>
      <Html position={[-1.55, -1.05, 0]} center style={{ pointerEvents: "none", width: "240px" }}>
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary md:text-base">{t.roles.ai.title}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-text-secondary md:text-sm">
            {t.roles.ai.description}
          </p>
        </div>
      </Html>
      <Html position={[1.55, -1.05, 0]} center style={{ pointerEvents: "none", width: "240px" }}>
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary md:text-base">{t.roles.product.title}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-text-secondary md:text-sm">
            {t.roles.product.description}
          </p>
        </div>
      </Html>
    </>
  );
}

function CarouselCard({
  project,
  angle,
  radius,
  y,
  locale,
  viewLabel,
  onOpen,
}: {
  project: Project;
  angle: number;
  radius: number;
  y: number;
  locale: "en" | "fr";
  viewLabel: string;
  onOpen: (project: Project) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const cardRef = useRef<HTMLButtonElement>(null);
  const world = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }) => {
    const group = groupRef.current;
    const card = cardRef.current;
    if (!group || !card) return;
    group.getWorldPosition(world);
    const dist = camera.position.distanceTo(world);
    const blur = THREE.MathUtils.clamp((dist - 3.2) * 1.1, 0, 4.5);
    const opacity = THREE.MathUtils.clamp(1.15 - (dist - 2.8) * 0.18, 0.35, 1);
    card.style.filter = blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : "none";
    card.style.opacity = `${opacity}`;
  });

  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  return (
    <group ref={groupRef} position={[x, y, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
      <Html transform distanceFactor={4.8} style={{ pointerEvents: "auto" }} zIndexRange={[20, 0]}>
        <button
          ref={cardRef}
          type="button"
          onClick={() => onOpen(project)}
          className="group w-[220px] cursor-pointer text-left transition-transform duration-300 hover:-translate-y-1"
        >
          <div className="project-placeholder-gradient overflow-hidden rounded-xl shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
            <div className="relative aspect-video">
              {project.hasVideo && project.videoUrl ? (
                <video
                  src={project.videoUrl}
                  muted
                  loop
                  playsInline
                  autoPlay
                  className="h-full w-full object-cover opacity-90"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-2xl font-light text-text-secondary opacity-40">
                    {project.id}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-medium text-text-primary">{project.title[locale]}</h3>
              <span className="shrink-0 text-[10px] text-text-secondary">{project.year}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {project.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-bg-secondary/90 px-2 py-0.5 text-[10px] text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
            <span className="inline-flex text-xs font-medium text-accent group-hover:text-text-primary">
              {viewLabel}
            </span>
          </div>
        </button>
      </Html>
    </group>
  );
}

function SpiralCarousel({ track }: { track: PortfolioTrack }) {
  const groupRef = useRef<THREE.Group>(null);
  const { locale } = useLocale();
  const t = translations[locale];
  const { carouselAngle, onOpenProject } = useSceneApi();
  const items = useMemo(() => projectsForTrack(track), [track]);

  const radius = 2.35;
  const rise = 0.28;
  const step = (Math.PI * 2) / Math.max(items.length, 1);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      carouselAngle.current,
      0.08,
    );
  });

  return (
    <group ref={groupRef} position={[0, 0.1, 0]}>
      {items.map((project, index) => {
        const angle = index * step;
        const y = (index - (items.length - 1) / 2) * rise;
        return (
          <CarouselCard
            key={project.id}
            project={project}
            angle={angle}
            radius={radius}
            y={y}
            locale={locale}
            viewLabel={t.viewProject}
            onOpen={onOpenProject}
          />
        );
      })}
    </group>
  );
}

function CameraRig({ mobile }: { mobile: boolean }) {
  const { camera } = useThree();
  const { view, activeTrack } = useSceneApi();
  const targetPos = useRef(new THREE.Vector3(0, 0.35, mobile ? 5.4 : 4.8));
  const lookAt = useRef(new THREE.Vector3(0, 0.1, 0));
  const scratch = useRef(new THREE.Vector3());

  useEffect(() => {
    if (view === "home") {
      targetPos.current.set(0, 0.35, mobile ? 5.4 : 4.8);
      lookAt.current.set(0, 0.1, 0);
      return;
    }

    if (view === "entering" || view === "switching") {
      const side = activeTrack === "ai" ? -1 : 1;
      if (mobile) {
        targetPos.current.set(0, activeTrack === "ai" ? 0.55 : -0.35, 2.2);
      } else {
        targetPos.current.set(side * 0.15, 0.25, 2.1);
      }
      lookAt.current.set(0, 0.05, 0);
      return;
    }

    // carousel
    targetPos.current.set(0, 0.55, 5.6);
    lookAt.current.set(0, 0.15, 0);
  }, [view, activeTrack, mobile]);

  useFrame(() => {
    camera.position.lerp(targetPos.current, 0.06);
    scratch.current.lerp(lookAt.current, 0.08);
    camera.lookAt(scratch.current);
  });

  return null;
}

function SceneLights({ isDark }: { isDark: boolean }) {
  const { view, activeTrack } = useSceneApi();
  const tintRef = useRef<THREE.PointLight>(null);
  const tintColor = activeTrack === "product" ? BLUE_LIGHT : RED_LIGHT;

  useFrame(() => {
    if (!tintRef.current) return;
    const target =
      view === "home" ? 0 : view === "entering" || view === "switching" ? 1.35 : 0.85;
    tintRef.current.intensity = THREE.MathUtils.lerp(tintRef.current.intensity, target, 0.08);
    tintRef.current.color.lerp(tintColor, 0.1);
  });

  return (
    <>
      <ambientLight intensity={isDark ? 0.45 : 0.72} />
      <hemisphereLight
        intensity={isDark ? 0.35 : 0.55}
        color={isDark ? "#3a3a40" : "#ffffff"}
        groundColor={isDark ? "#0a0a0b" : "#c8c8d0"}
      />
      <directionalLight
        castShadow
        position={[3.5, 6, 4]}
        intensity={isDark ? 0.85 : 1.15}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight ref={tintRef} position={[0, 1.2, 1.5]} intensity={0} distance={10} decay={2} />
    </>
  );
}

function SceneContent({ mobile, isDark }: { mobile: boolean; isDark: boolean }) {
  const { view, activeTrack } = useSceneApi();
  const opposite = activeTrack === "ai" ? "product" : "ai";

  const homeAiPos: [number, number, number] = mobile ? [0, 0.85, 0] : [-1.55, 0.15, 0];
  const homeProductPos: [number, number, number] = mobile ? [0, -0.95, 0] : [1.55, 0.15, 0];
  const bg = isDark ? "#0a0a0b" : "#f0f0f3";

  return (
    <>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 10, 22]} />
      <CameraRig mobile={mobile} />
      <SceneLights isDark={isDark} />
      <StudioRoom isDark={isDark} />

      {view === "home" && (
        <>
          <Pill track="ai" position={homeAiPos} />
          <Pill track="product" position={homeProductPos} />
          <RoleLabels mobile={mobile} />
        </>
      )}

      {(view === "carousel" || view === "entering" || view === "switching") && activeTrack && (
        <>
          <SpiralCarousel track={activeTrack} />
          <Pill
            track={opposite}
            position={mobile ? [1.35, -1.55, 1.2] : [2.55, -0.15, 1.4]}
            scale={mobile ? 0.72 : 0.85}
            compact
          />
        </>
      )}
    </>
  );
}

interface StudioCanvasProps {
  view: PortfolioView;
  activeTrack: PortfolioTrack | null;
  carouselAngle: MutableRefObject<number>;
  onSelectTrack: (track: PortfolioTrack) => void;
  onOpenProject: (project: Project) => void;
}

export default function StudioCanvas({
  view,
  activeTrack,
  carouselAngle,
  onSelectTrack,
  onOpenProject,
}: StudioCanvasProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const api = useMemo<SceneApi>(
    () => ({ view, activeTrack, carouselAngle, onSelectTrack, onOpenProject }),
    [view, activeTrack, carouselAngle, onSelectTrack, onOpenProject],
  );

  return (
    <SceneApiContext.Provider value={api}>
      <Canvas
        shadows
        camera={{ position: [0, 0.35, mobile ? 5.4 : 4.8], fov: 42, near: 0.1, far: 60 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: false }}
        style={{ width: "100%", height: "100%", background: isDark ? "#0a0a0b" : "#f0f0f3" }}
      >
        <SceneContent mobile={mobile} isDark={isDark} />
      </Canvas>
    </SceneApiContext.Provider>
  );
}
