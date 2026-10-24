"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MARK, WORDMARK } from "@/components/brand/paths";
import { shapesFor } from "./geometry";
import { CAMERA_FOV, FINALE_DISTANCE, finale, wordmarkZ } from "./path";
import { heroState } from "./state";

const DEPTH = 110;
const INK = new THREE.Color("#eef2fb");

// The same lockup as the flat logo (components/brand/logo.tsx): the mark, a gap, the wordmark
// at 56% of the mark's height and centred on it. All in the artwork's units.
const WORD_SCALE = (MARK.height * 0.56) / WORDMARK.height;
const GAP = 150;
const WORD_X = MARK.width + GAP;
const WORD_Y = (MARK.height - WORDMARK.height * WORD_SCALE) / 2;
const WIDTH = Math.ceil(WORD_X + WORDMARK.width * WORD_SCALE);

interface Part {
  shapes: THREE.Shape[];
  /** Artwork units to world units for this part (1 for the mark). */
  scale: number;
  /** Where its top-left corner lands in the lockup. */
  x: number;
  y: number;
}

const PARTS: Part[] = [
  {
    shapes: [MARK.body.d, MARK.top.d, MARK.notch.d, MARK.bottom.d].flatMap((d) => shapesFor(d)),
    scale: 1,
    x: 0,
    y: 0,
  },
  { shapes: shapesFor(WORDMARK.d), scale: WORD_SCALE, x: WORD_X, y: WORD_Y },
];

/** The logo, cut from the brand outlines and extruded, waiting at the end of the flight. */
export function Logo3D({ count, wide }: { count: number; wide: boolean }) {
  const { body, face, sides } = useMemo(() => {
    const bodies: THREE.BufferGeometry[] = [];
    const faces: THREE.BufferGeometry[] = [];
    for (const part of PARTS) {
      // Extruded at 1/scale so that scaling the whole part leaves every piece the same thickness.
      const k = part.scale;
      const b = new THREE.ExtrudeGeometry(part.shapes, {
        depth: DEPTH / k,
        bevelEnabled: true,
        bevelThickness: 10 / k,
        bevelSize: 6 / k,
        bevelSegments: 4,
        curveSegments: 24,
      });
      b.scale(k, k, k);
      b.translate(part.x - WIDTH / 2, MARK.height / 2 - part.y, -DEPTH);
      bodies.push(b);
      const f = new THREE.ShapeGeometry(part.shapes, 24);
      f.scale(k, k, 1);
      f.translate(part.x - WIDTH / 2, MARK.height / 2 - part.y, 10.5);
      faces.push(f);
    }
    const merged = {
      body: mergeGeometries(bodies, false) ?? bodies[0]!,
      face: mergeGeometries(faces, false) ?? faces[0]!,
    };
    for (const g of [...bodies, ...faces]) g.dispose();
    return { ...merged, sides: new THREE.MeshStandardMaterial({ color: "#1a2136", metalness: 0.85, roughness: 0.25 }) };
  }, []);

  useLayoutEffect(
    () => () => {
      body.dispose();
      face.dispose();
      sides.dispose();
    },
    [body, face, sides],
  );

  const group = useRef<THREE.Group>(null);
  const faceMaterial = useRef<THREE.MeshBasicMaterial>(null);
  // As wide as the screen allows from where the camera stops, with a margin either side.
  const aspect = useThree((s) => s.size.width / s.size.height);
  const fitWidth = 2 * FINALE_DISTANCE * Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV) / 2) * aspect * 0.84;
  const scale = Math.min(5.6, fitWidth) / WIDTH;
  const y = wide ? 0.55 : 0.9;

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const f = finale(heroState.smooth, count);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, (1 - f) * -0.55 + state.pointer.x * 0.12, 4, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, (1 - f) * 0.2 - state.pointer.y * 0.08, 4, dt);
    faceMaterial.current?.color.copy(INK).multiplyScalar(0.25 + f * 0.75);
  });

  return (
    <group ref={group} position={[0, y, wordmarkZ(count)]}>
      <group scale={[scale, scale, scale]}>
        <mesh geometry={body} material={sides} />
        <mesh geometry={face}>
          <meshBasicMaterial ref={faceMaterial} color="#eef2fb" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
