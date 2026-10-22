"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import { Dust } from "./dust";
import { Mark3D } from "./mark-3d";
import { Panels } from "./panels";
import { activePanel, CAMERA_FOV, CAMERA_START_Z, cameraZ, captionIndex, panelPosition, travel, wordmarkZ } from "./path";
import { heroState } from "./state";
import { Wordmark3D } from "./wordmark-3d";

const GROUND = "#070a12";
const LOOK = new THREE.Vector3();

interface RigProps {
  count: number;
  wide: boolean;
  onCaption: (index: number) => void;
}

/**
 * Flies the camera along the path, weaving toward the lit panel, with a little cursor parallax.
 * Captions are taken from the same eased progress, so the words never run ahead of the picture.
 */
function Rig({ count, wide, onCaption }: RigProps) {
  const light = useRef<THREE.PointLight>(null);
  const caption = useRef(Number.NaN);

  useFrame((state, dt) => {
    // Jump straight there when arriving from far away (a reload mid-page), glide otherwise.
    const gap = Math.abs(heroState.progress - heroState.smooth);
    heroState.smooth = gap > 0.35 ? heroState.progress : THREE.MathUtils.damp(heroState.smooth, heroState.progress, 5, dt);
    const p = heroState.smooth;
    const nextCaption = captionIndex(p, count);
    if (nextCaption !== caption.current) {
      caption.current = nextCaption;
      onCaption(nextCaption);
    }

    // No parallax at rest, so the 3D mark first appears exactly over the flat one.
    const reach = Math.min(1, p / 0.06);
    const lit = activePanel(p, count);
    const weave = lit >= 0 ? panelPosition(lit, wide)[0] * 0.2 : 0;
    const cam = state.camera;
    cam.position.x = THREE.MathUtils.damp(cam.position.x, weave + state.pointer.x * (wide ? 0.35 : 0.15) * reach, 3, dt);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, state.pointer.y * 0.2 * reach, 3, dt);
    cam.position.z = cameraZ(p, count);
    LOOK.set(cam.position.x * 0.4, cam.position.y * 0.4, cam.position.z - 8);
    cam.lookAt(LOOK);
    light.current?.position.set(cam.position.x, cam.position.y + 0.6, cam.position.z - 2.5);

    // At rest only the mark is in view; the corridor of apps opens up once the flight starts.
    const fog = state.scene.fog;
    if (fog instanceof THREE.Fog) {
      fog.near = THREE.MathUtils.lerp(9.2, 9.5, reach);
      fog.far = THREE.MathUtils.lerp(11.5, 26, reach);
    }
  });

  return <pointLight ref={light} color="#6d8bff" intensity={7} distance={8} decay={1.5} />;
}

/** Tells the page the first frame with real screens has been drawn, so the flat mark can hand over. */
function Ready({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    requestAnimationFrame(() => onReady());
  });
  return null;
}

interface WorldProps {
  panels: string[];
  stage: React.RefObject<HTMLElement | null>;
  effects: boolean;
  onReady: () => void;
  onCaption: (index: number) => void;
}

function World({ panels, stage, effects, onReady, onCaption }: WorldProps) {
  const wide = useThree((s) => s.size.width >= 768);
  const count = panels.length;

  return (
    <>
      <color attach="background" args={[GROUND]} />
      <fog attach="fog" args={[GROUND, 9.5, 26]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 4, 6]} intensity={1.4} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#ffffff" position={[0, 5, -2]} rotation-x={Math.PI / 2} scale={[12, 2, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#4d6dff" position={[-6, 0, 2]} rotation-y={Math.PI / 2} scale={[2, 9, 1]} />
        <Lightformer form="ring" intensity={1.2} color="#eef2fb" position={[6, 1, 4]} scale={3} />
      </Environment>
      <Rig count={count} wide={wide} onCaption={onCaption} />
      <Suspense fallback={null}>
        <Mark3D count={count} wide={wide} stage={stage} />
        <Panels srcs={panels} wide={wide} />
        <Ready onReady={onReady} />
      </Suspense>
      <Wordmark3D count={count} wide={wide} />
      <Dust near={CAMERA_START_Z + 2} far={wordmarkZ(count) - 4} amount={wide ? 1400 : 600} travel={travel(count)} />
      {effects ? (
        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur luminanceThreshold={1} intensity={0.85} radius={0.75} />
        </EffectComposer>
      ) : null}
    </>
  );
}

export interface HeroSceneProps {
  /** One cover per project panel, in flight order. */
  panels: string[];
  /** The sticky stage: pointer events are read from it, and the flat mark is found inside it. */
  stage: React.RefObject<HTMLElement | null>;
  /** False while the hero is off screen: the loop stops and costs nothing. */
  running: boolean;
  onReady: () => void;
  /** The caption index for the current (eased) position, called when it changes. */
  onCaption: (index: number) => void;
  /** Called with true when the GPU context is lost, false when it is restored. */
  onContext: (lost: boolean) => void;
}

const MAX_DPR = 1.75;

export default function HeroScene({ panels, stage, running, onReady, onCaption, onContext }: HeroSceneProps) {
  // Bloom on larger screens only; it is the first thing dropped if the frame rate suffers.
  const [effects, setEffects] = useState(() => window.matchMedia("(min-width: 768px)").matches);
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio, 1.5));

  return (
    <Canvas
      eventSource={stage as React.RefObject<HTMLElement>}
      eventPrefix="client"
      frameloop={running ? "always" : "never"}
      dpr={dpr}
      flat
      camera={{ fov: CAMERA_FOV, near: 0.1, far: 90, position: [0, 0, CAMERA_START_Z] }}
      gl={{ antialias: true, powerPreference: "high-performance", stencil: false }}
      onCreated={({ gl }) => {
        // Shader checks (and Windows' harmless compiler notes) only while developing; they slow compiles.
        gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
        // three calls preventDefault on loss, so the browser may hand the context back later.
        gl.domElement.addEventListener("webglcontextlost", () => onContext(true));
        gl.domElement.addEventListener("webglcontextrestored", () => onContext(false));
      }}
      aria-hidden="true"
    >
      <PerformanceMonitor
        onIncline={() => setDpr(Math.min(window.devicePixelRatio, MAX_DPR))}
        onDecline={() => setDpr(1)}
        onFallback={() => {
          setDpr(1);
          setEffects(false);
        }}
      />
      <World panels={panels} stage={stage} effects={effects} onReady={onReady} onCaption={onCaption} />
    </Canvas>
  );
}
