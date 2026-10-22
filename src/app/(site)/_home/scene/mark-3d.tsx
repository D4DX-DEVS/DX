"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { MARK } from "@/components/brand/paths";
import { shapesFor, smooth01 } from "./geometry";
import { CAMERA_START_Z, markOpen } from "./path";
import { heroState } from "./state";

const DEPTH = 70;
const EXTRUDE = { depth: DEPTH, bevelEnabled: true, bevelThickness: 12, bevelSize: 9, bevelSegments: 5, curveSegments: 40 };
/** The mark has settled in the centre by this much scroll progress. */
const SETTLE = 0.12;

/** Moves an outline from SVG space (origin top-left) to the mark's centre, depth centred on z = 0. */
function centre<T extends THREE.BufferGeometry>(geo: T, z: number): T {
  geo.translate(-MARK.width / 2, MARK.height / 2, z);
  return geo;
}

interface Placement {
  x: number;
  y: number;
  scale: number;
}

/** Where the static SVG mark sits, in world units on the z = 0 plane, as seen by the starting camera. */
function measure(el: Element | null, canvas: HTMLCanvasElement, fov: number): Placement | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const c = canvas.getBoundingClientRect();
  if (!r.width || !r.height || !c.height) return null;
  const perPx = (2 * CAMERA_START_Z * Math.tan(THREE.MathUtils.degToRad(fov) / 2)) / c.height;
  return {
    x: (r.left + r.width / 2 - (c.left + c.width / 2)) * perPx,
    y: -(r.top + r.height / 2 - (c.top + c.height / 2)) * perPx,
    scale: Math.min(r.width / MARK.width, r.height / MARK.height) * perPx,
  };
}

interface PanelProps {
  d: string;
  material: THREE.Material;
  innerRef: React.RefObject<THREE.Group | null>;
}

function Panel({ d, material, innerRef }: PanelProps) {
  const body = useMemo(() => centre(new THREE.ExtrudeGeometry(shapesFor(d), EXTRUDE), -DEPTH / 2), [d]);
  useLayoutEffect(() => () => body.dispose(), [body]);

  return (
    <group ref={innerRef}>
      <mesh geometry={body} material={material} />
    </group>
  );
}

interface Mark3DProps {
  count: number;
  wide: boolean;
  /** The stage holding the static SVG mark this one takes over from. */
  stage: React.RefObject<HTMLElement | null>;
}

/**
 * The logo's mark, extruded in its own blue. It first appears exactly where the flat SVG mark
 * was drawn, then glides to the centre and comes apart as the
 * camera flies through it.
 */
export function Mark3D({ count, wide, stage }: Mark3DProps) {
  // Glossy royal blue, lit by the environment's white and blue strips like the flat mark's gradient.
  const blue = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2d50d2", metalness: 0.35, roughness: 0.32 }), []);
  const notchGeo = useMemo(() => centre(new THREE.ExtrudeGeometry(shapesFor(MARK.notch.d), EXTRUDE), -DEPTH / 2 + 8), []);
  useLayoutEffect(
    () => () => {
      blue.dispose();
      notchGeo.dispose();
    },
    [blue, notchGeo],
  );

  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const top = useRef<THREE.Group>(null);
  const bottom = useRef<THREE.Group>(null);
  const notch = useRef<THREE.Mesh>(null);
  const notchMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const from = useRef<Placement | null>(null);
  const measuredFor = useRef("");

  const settledScale = (wide ? 3.6 : 2.4) / MARK.width;

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;

    // Re-measure on resize, and for the first moments while the page's load-in settles.
    const key = `${state.size.width}x${state.size.height}`;
    if (measuredFor.current !== key || state.clock.elapsedTime < 1.5) {
      const el = stage.current?.querySelector("[data-hero-mark] svg") ?? null;
      from.current = measure(el, state.gl.domElement, (state.camera as THREE.PerspectiveCamera).fov) ?? from.current;
      measuredFor.current = key;
    }

    const p = heroState.smooth;
    const open = markOpen(p, count);
    const s = smooth01(p / SETTLE);
    const a = from.current ?? { x: 0, y: 0, scale: settledScale };
    g.position.set(THREE.MathUtils.lerp(a.x, 0, s), THREE.MathUtils.lerp(a.y, 0, s), 0);
    g.scale.setScalar(THREE.MathUtils.lerp(a.scale, settledScale, s));

    const t = state.clock.elapsedTime;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, Math.sin(t * 0.35) * 0.16 + state.pointer.x * 0.3 - open * 0.15, 4, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -state.pointer.y * 0.16 + Math.sin(t * 0.27) * 0.05, 4, dt);

    // Coming apart: the tall panel swings left, the two small ones open up and right.
    const spread = open * 900;
    body.current?.position.set(-spread * 1.1, 0, open * 120);
    body.current?.rotation.set(0, -open * 0.9, 0);
    top.current?.position.set(spread, spread * 0.8, open * 60);
    top.current?.rotation.set(open * 0.6, open * 0.7, 0);
    bottom.current?.position.set(spread, -spread * 0.8, open * 60);
    bottom.current?.rotation.set(-open * 0.6, open * 0.7, 0);
    notch.current?.position.set(-spread * 0.2, 0, open * 600);
    // A slow pulse in the logo's blue; only the blue channel clips, so the hue holds.
    if (notchMaterial.current) notchMaterial.current.emissiveIntensity = 1.3 + Math.sin(t * 2) * 0.2;
  });

  return (
    <group ref={root}>
      <Panel d={MARK.body.d} material={blue} innerRef={body} />
      <Panel d={MARK.top.d} material={blue} innerRef={top} />
      <Panel d={MARK.bottom.d} material={blue} innerRef={bottom} />
      <mesh ref={notch} geometry={notchGeo}>
        <meshStandardMaterial
          ref={notchMaterial}
          color="#0a1030"
          emissive="#4d6dff"
          emissiveIntensity={1.3}
          metalness={0.6}
          roughness={0.3}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
