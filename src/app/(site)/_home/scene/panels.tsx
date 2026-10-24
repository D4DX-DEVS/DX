"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { coverFace, prepareTextures, roundedRect } from "./geometry";
import { activePanel, panelPosition } from "./path";
import { heroState } from "./state";

const ASPECT = 4 / 3;
const SLAB_DEPTH = 0.08;
const DIM = new THREE.Color(0.42, 0.42, 0.4);
const LIT = new THREE.Color(1, 1, 1);

interface TextureEntry {
  status: "pending" | "done";
  promise: Promise<void>;
  value: THREE.Texture[];
  /** True when some screen could not be loaded and a plain placeholder stands in for it. */
  partial: boolean;
}

const cache = new Map<string, TextureEntry>();
const LOAD_TIMEOUT_MS = 15000;

/** A dark blue square, drawn where a screen could not be fetched, so one bad image never costs the scene. */
function placeholder(): THREE.Texture {
  const tex = new THREE.DataTexture(new Uint8Array([16, 24, 47, 255]), 1, 1);
  tex.needsUpdate = true;
  return tex;
}

/** Loads one screen, trying again once after a pause (a cold image optimiser or a dropped request). */
function loadOne(src: string, tries = 2): Promise<{ texture: THREE.Texture; ok: boolean }> {
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(
      src,
      (texture) => resolve({ texture, ok: true }),
      undefined,
      () => {
        if (tries > 1) window.setTimeout(() => resolve(loadOne(src, tries - 1)), 700);
        else resolve({ texture: placeholder(), ok: false });
      },
    );
  });
}

/**
 * Every screen as a texture. Suspends until all have loaded or failed, and never throws: a screen that
 * cannot be fetched (or takes over 15 seconds) becomes a placeholder, and is fetched again next mount.
 */
function useTextures(srcs: string[]): THREE.Texture[] {
  const key = srcs.join("|");
  let entry = cache.get(key);
  if (!entry) {
    const created: TextureEntry = { status: "pending", promise: Promise.resolve(), value: [], partial: false };
    const results: ({ texture: THREE.Texture; ok: boolean } | null)[] = srcs.map(() => null);
    const loads = srcs.map((src, i) =>
      loadOne(src).then((r) => {
        results[i] = r;
      }),
    );
    const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, LOAD_TIMEOUT_MS));
    created.promise = Promise.race([Promise.all(loads).then(() => undefined), timeout]).then(() => {
      const settled = results.map((r) => r ?? { texture: placeholder(), ok: false });
      created.value = settled.map((r) => r.texture);
      created.partial = settled.some((r) => !r.ok);
      prepareTextures(created.value);
      created.status = "done";
    });
    cache.set(key, created);
    entry = created;
  }
  const ready = entry;
  useEffect(() => {
    // A scene that had to use placeholders asks again the next time it is mounted.
    return () => {
      if (ready.partial) cache.delete(key);
    };
  }, [ready, key]);
  if (ready.status !== "done") throw ready.promise;
  return ready.value;
}

interface PanelsProps {
  srcs: string[];
  wide: boolean;
}

/**
 * One floating slab per shipped app, carrying its artwork, set along the camera's path. The
 * panel the caption is talking about is lit; the others wait, dimmed.
 */
export function Panels({ srcs, wide }: PanelsProps) {
  const textures = useTextures(srcs);
  const width = wide ? 2.7 : 1.7;
  const height = width / ASPECT;
  const radius = width * 0.035;

  const { face, slab, edge } = useMemo(() => {
    const border = width * 0.025;
    const slabGeo = new THREE.ExtrudeGeometry(roundedRect(width + border * 2, height + border * 2, radius + border), {
      depth: SLAB_DEPTH,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 3,
      curveSegments: 10,
    });
    const faceGeo = coverFace(roundedRect(width, height, radius), ASPECT, 10);
    faceGeo.translate(0, 0, SLAB_DEPTH + 0.02);
    return {
      face: faceGeo,
      slab: slabGeo,
      edge: new THREE.MeshStandardMaterial({ color: "#121828", metalness: 0.8, roughness: 0.3 }),
    };
  }, [width, height, radius]);

  useLayoutEffect(
    () => () => {
      face.dispose();
      slab.dispose();
      edge.dispose();
    },
    [face, slab, edge],
  );

  const groups = useRef<(THREE.Group | null)[]>([]);
  const faces = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  useFrame((state, dt) => {
    const lit = activePanel(heroState.smooth, srcs.length);
    const t = state.clock.elapsedTime;
    for (let i = 0; i < srcs.length; i++) {
      const g = groups.current[i];
      if (g) {
        const [x, y, z] = panelPosition(i, wide);
        g.position.set(x, y + Math.sin(t * 0.6 + i * 1.7) * 0.06, z);
        g.rotation.z = Math.sin(t * 0.4 + i) * 0.015;
        // Each panel turns a little toward the pointer, on top of its own lean toward the corridor.
        g.rotation.y = THREE.MathUtils.damp(g.rotation.y, (i % 2 === 0 ? 1 : -1) * 0.22 + state.pointer.x * 0.28, 4, dt);
        g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -state.pointer.y * 0.14, 4, dt);
      }
      const m = faces.current[i];
      if (m) m.color.lerp(i === lit ? LIT : DIM, 1 - Math.exp(-5 * dt));
    }
  });

  return (
    <>
      {textures.map((texture, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        return (
          <group
            key={srcs[i]}
            ref={(g) => {
              groups.current[i] = g;
            }}
            position={panelPosition(i, wide)}
            rotation={[0, -side * 0.22, 0]}
          >
            <mesh geometry={slab} material={edge} />
            <mesh geometry={face}>
              <meshBasicMaterial
                ref={(m) => {
                  faces.current[i] = m;
                }}
                map={texture}
                color={DIM}
                toneMapped={false}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
