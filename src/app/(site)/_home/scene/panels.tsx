"use client";

import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { coverFace, prepareTextures, roundedRect } from "./geometry";
import { activePanel, panelPosition } from "./path";
import { heroState } from "./state";

const ASPECT = 4 / 3;
const SLAB_DEPTH = 0.08;
const DIM = new THREE.Color(0.42, 0.42, 0.4);
const LIT = new THREE.Color(1, 1, 1);

interface PanelsProps {
  srcs: string[];
  wide: boolean;
}

/**
 * One floating slab per shipped app, carrying its artwork, set along the camera's path. The
 * panel the caption is talking about is lit; the others wait, dimmed.
 */
export function Panels({ srcs, wide }: PanelsProps) {
  const textures = useTexture(srcs, prepareTextures);
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
