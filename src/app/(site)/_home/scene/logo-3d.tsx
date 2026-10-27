"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MARK, WORDMARK } from "@/components/brand/paths";
import { shapesFor, smooth01 } from "./geometry";
import { makeShards, splitGeometry } from "./shards";
import { CAMERA_FOV, FINALE_DISTANCE, finale, wordmarkZ } from "./path";
import { heroState } from "./state";

const DEPTH = 110;
/** The closing logo is drawn in the brand's electric blue. */
const INK = new THREE.Color("#3d6bff");

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
    shapes: [MARK.body.d, MARK.top.d, MARK.notch.d, MARK.bottom.d].flatMap(
      (d) => shapesFor(d),
    ),
    scale: 1,
    x: 0,
    y: 0,
  },
  { shapes: shapesFor(WORDMARK.d), scale: WORD_SCALE, x: WORD_X, y: WORD_Y },
];

/** The logo, cut from the brand outlines and extruded, waiting at the end of the flight; it breaks apart and sinks away at the very end. */
export function Logo3D({ count, wide }: { count: number; wide: boolean }) {
  const { body, face, sides, faceMaterial, shards, bodyPieces, facePieces } =
    useMemo(() => {
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

      const list = makeShards({
        width: WIDTH,
        height: MARK.height,
        cols: wide ? 16 : 10,
        rows: wide ? 5 : 4,
        seed: 5,
        draw: (ctx) => {
          for (const d of [
            MARK.body.d,
            MARK.top.d,
            MARK.bottom.d,
            MARK.notch.d,
          ])
            ctx.fill(new Path2D(d));
          ctx.save();
          ctx.translate(WORD_X, WORD_Y);
          ctx.scale(WORD_SCALE, WORD_SCALE);
          ctx.fill(new Path2D(WORDMARK.d));
          ctx.restore();
        },
      });
      const sidesBase = new THREE.MeshStandardMaterial({
        color: "#1c3896",
        metalness: 0.55,
        roughness: 0.28,
      });
      const faceBase = new THREE.MeshBasicMaterial({
        color: "#3d6bff",
        toneMapped: false,
      });
      return {
        ...merged,
        sides: sidesBase,
        faceMaterial: faceBase,
        shards: list,
        bodyPieces: splitGeometry(merged.body, list, 40),
        facePieces: splitGeometry(merged.face, list, 40),
      };
    }, [wide]);

  useLayoutEffect(
    () => () => {
      body.dispose();
      face.dispose();
      for (const g of [...bodyPieces, ...facePieces]) g.dispose();
      sides.dispose();
      faceMaterial.dispose();
    },
    [body, face, sides, faceMaterial, bodyPieces, facePieces],
  );

  const group = useRef<THREE.Group>(null);
  const pieces = useRef<(THREE.Group | null)[]>([]);
  const whole = useRef<THREE.Group>(null);
  const broken = useRef<THREE.Group>(null);
  // As wide as the screen allows from where the camera stops, with a margin either side.
  const aspect = useThree((s) => s.size.width / s.size.height);
  const fitWidth =
    2 *
    FINALE_DISTANCE *
    Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV) / 2) *
    aspect *
    0.84;
  const scale = Math.min(2.9, fitWidth * 0.55) / WIDTH;
  const y = wide ? 0.55 : 0.9;

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const f = finale(heroState.smooth, count);
    g.rotation.y = THREE.MathUtils.damp(
      g.rotation.y,
      (1 - f) * -0.55 + state.pointer.x * 0.12,
      4,
      dt,
    );
    g.rotation.x = THREE.MathUtils.damp(
      g.rotation.x,
      (1 - f) * 0.2 - state.pointer.y * 0.08,
      4,
      dt,
    );
    const shade = 0.25 + f * 0.75;
    faceMaterial.color.copy(INK).multiplyScalar(shade);

    // Breaking inward: every piece sinks away from the viewer into the picture, drifting a little outward,
    // tumbling and shrinking until nothing is left.
    const b = heroState.finaleBreak;
    g.visible = b < 0.999;
    // Whole, the logo is two meshes; only while it breaks is it drawn as its many pieces.
    if (whole.current) whole.current.visible = b <= 0;
    if (broken.current) broken.current.visible = b > 0;
    if (b <= 0) return;
    for (let i = 0; i < shards.length; i++) {
      const sh = shards[i]!;
      const piece = pieces.current[i];
      if (!piece) continue;
      const e = smooth01((b - sh.delay) / (1 - sh.delay));
      const len = Math.hypot(sh.x, sh.y) || 1;
      piece.position.set(
        sh.x + (sh.x / len) * sh.reach * 0.35 * e,
        sh.y + (sh.y / len) * sh.reach * 0.35 * e,
        -Math.abs(sh.lift + 600) * 2.2 * e,
      );
      piece.rotation.set(sh.spin[0] * e, sh.spin[1] * e, sh.spin[2] * e);
      piece.scale.setScalar(Math.max(0.0001, 1 - 0.95 * e));
    }
  });

  return (
    <group ref={group} position={[0, y, wordmarkZ(count)]}>
      <group scale={[scale, scale, scale]}>
        <group ref={whole}>
          <mesh geometry={body} material={sides} />
          <mesh geometry={face} material={faceMaterial} />
        </group>
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
                geometry={bodyPieces[i]}
                material={sides}
                position={[-sh.x, -sh.y, 0]}
              />
              <mesh
                geometry={facePieces[i]}
                material={faceMaterial}
                position={[-sh.x, -sh.y, 0]}
              />
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}
