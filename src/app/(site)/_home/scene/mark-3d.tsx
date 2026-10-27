"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import * as THREE from "three";
import { MARK } from "@/components/brand/paths";
import { shapesFor, smooth01 } from "./geometry";
import { makeShards, splitGeometry } from "./shards";
import { CAMERA_START_Z, markOpen } from "./path";
import { heroState } from "./state";

const DEPTH = 70;
const EXTRUDE = {
  depth: DEPTH,
  bevelEnabled: true,
  bevelThickness: 12,
  bevelSize: 9,
  bevelSegments: 5,
  curveSegments: 40,
};
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
function measure(
  el: Element | null,
  canvas: HTMLCanvasElement,
  fov: number,
): Placement | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const c = canvas.getBoundingClientRect();
  if (!r.width || !r.height || !c.height) return null;
  const perPx =
    (2 * CAMERA_START_Z * Math.tan(THREE.MathUtils.degToRad(fov) / 2)) /
    c.height;
  return {
    x: (r.left + r.width / 2 - (c.left + c.width / 2)) * perPx,
    y: -(r.top + r.height / 2 - (c.top + c.height / 2)) * perPx,
    scale: Math.min(r.width / MARK.width, r.height / MARK.height) * perPx,
  };
}

interface Mark3DProps {
  count: number;
  wide: boolean;
  /** The stage holding the static SVG mark this one takes over from. */
  stage: React.RefObject<HTMLElement | null>;
}

/**
 * The logo's mark, extruded in its own blue. It first appears exactly where the flat SVG mark was drawn, then
 * glides to the centre and, as the camera reaches it, breaks into many small pieces that tumble outward.
 */
export function Mark3D({ count, wide, stage }: Mark3DProps) {
  // Glossy royal blue, lit by the environment's white and blue strips like the flat mark's gradient.
  const blue = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2d50d2",
        metalness: 0.35,
        roughness: 0.32,
      }),
    [],
  );
  const { geometry, shards, pieceGeometries } = useMemo(() => {
    const parts = [MARK.body.d, MARK.top.d, MARK.bottom.d, MARK.notch.d].map(
      (d) =>
        centre(new THREE.ExtrudeGeometry(shapesFor(d), EXTRUDE), -DEPTH / 2),
    );
    const merged = mergeGeometries(parts, false) ?? parts[0]!;
    for (const g of parts) g.dispose();
    const list = makeShards({
      width: MARK.width,
      height: MARK.height,
      cols: wide ? 10 : 7,
      rows: wide ? 8 : 6,
      seed: 11,
      draw: (ctx) => {
        for (const d of [MARK.body.d, MARK.top.d, MARK.bottom.d, MARK.notch.d])
          ctx.fill(new Path2D(d));
      },
    });
    return {
      geometry: merged,
      shards: list,
      pieceGeometries: splitGeometry(merged, list, 40),
    };
  }, [wide]);
  useLayoutEffect(
    () => () => {
      blue.dispose();
      geometry.dispose();
      for (const g of pieceGeometries) g.dispose();
    },
    [blue, geometry, pieceGeometries],
  );

  const root = useRef<THREE.Group>(null);
  const whole = useRef<THREE.Mesh>(null);
  const broken = useRef<THREE.Group>(null);
  const pieces = useRef<(THREE.Group | null)[]>([]);
  const from = useRef<Placement | null>(null);
  const measuredFor = useRef("");

  const settledScale = (wide ? 2.1 : 1.45) / MARK.width;

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;

    // Re-measure on resize, and for the first moments while the page's load-in settles.
    const key = `${state.size.width}x${state.size.height}`;
    if (measuredFor.current !== key || state.clock.elapsedTime < 1.5) {
      const el = stage.current?.querySelector("[data-hero-mark] svg") ?? null;
      from.current =
        measure(
          el,
          state.gl.domElement,
          (state.camera as THREE.PerspectiveCamera).fov,
        ) ?? from.current;
      measuredFor.current = key;
    }

    const p = heroState.smooth;
    const open = markOpen(p, count);
    const s = smooth01(p / SETTLE);
    const a = from.current ?? { x: 0, y: 0, scale: settledScale };
    g.position.set(
      THREE.MathUtils.lerp(a.x, 0, s),
      THREE.MathUtils.lerp(a.y, 0, s),
      0,
    );
    g.scale.setScalar(THREE.MathUtils.lerp(a.scale, settledScale, s));

    const t = state.clock.elapsedTime;
    g.rotation.y = THREE.MathUtils.damp(
      g.rotation.y,
      Math.sin(t * 0.35) * 0.1 + state.pointer.x * 0.3,
      4,
      dt,
    );
    g.rotation.x = THREE.MathUtils.damp(
      g.rotation.x,
      -state.pointer.y * 0.16 + Math.sin(t * 0.27) * 0.04,
      4,
      dt,
    );

    // Breaking apart: every piece pushes away from the middle, toward the camera and spins about its own centre.
    // Drawing every piece costs one pass of the whole logo per piece, so the pieces are only drawn while the logo
    // is breaking or gathering; whole, it is a single mesh, and once every piece has flown it is not drawn at all.
    const moving = open > 0 || heroState.assemble < 1;
    const gone = open >= 0.999 || heroState.assemble <= 0.001;
    if (whole.current) whole.current.visible = !moving;
    if (broken.current) broken.current.visible = moving && !gone;
    if (!moving || gone) return;
    for (let i = 0; i < shards.length; i++) {
      const sh = shards[i]!;
      const piece = pieces.current[i];
      if (!piece) continue;
      const e = smooth01((open - sh.delay) / (1 - sh.delay));
      // At the very start the pieces are still far inside the picture and small; they fly out to form the logo.
      const gather =
        1 - smooth01((heroState.assemble - sh.delay) / (1 - sh.delay));
      const len = Math.hypot(sh.x, sh.y) || 1;
      piece.position.set(
        sh.x + (sh.x / len) * sh.reach * e + sh.x * 1.2 * gather,
        sh.y + (sh.y / len) * sh.reach * e + sh.y * 1.2 * gather,
        sh.lift * e - 2400 * gather,
      );
      piece.rotation.set(
        sh.spin[0] * (e - gather),
        sh.spin[1] * (e - gather),
        sh.spin[2] * (e - gather),
      );
      piece.scale.setScalar(Math.max(0.0001, 1 - gather));
    }
  });

  return (
    <group ref={root}>
      <mesh ref={whole} geometry={geometry} material={blue} />
      <group ref={broken} visible={false}>
        {shards.map((sh, i) => (
          <group
            key={i}
            ref={(el) => {
              pieces.current[i] = el;
            }}
            position={[sh.x, sh.y, 0]}
          >
            <mesh
              geometry={pieceGeometries[i]}
              material={blue}
              position={[-sh.x, -sh.y, 0]}
            />
          </group>
        ))}
      </group>
    </group>
  );
}
