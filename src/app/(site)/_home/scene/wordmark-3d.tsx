"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { WORDMARK } from "@/components/brand/paths";
import { shapesFor } from "./geometry";
import { CAMERA_FOV, FINALE_DISTANCE, finale, wordmarkZ } from "./path";
import { heroState } from "./state";

const DEPTH = 110;
const INK = new THREE.Color("#eef2fb");

/** The name, cut from the brand outline and extruded, waiting at the end of the flight. */
export function Wordmark3D({ count, wide }: { count: number; wide: boolean }) {
  const { body, face, sides } = useMemo(() => {
    const shapes = shapesFor(WORDMARK.d);
    const bodyGeo = new THREE.ExtrudeGeometry(shapes, {
      depth: DEPTH,
      bevelEnabled: true,
      bevelThickness: 10,
      bevelSize: 6,
      bevelSegments: 4,
      curveSegments: 24,
    });
    bodyGeo.translate(-WORDMARK.width / 2, WORDMARK.height / 2, -DEPTH);
    const faceGeo = new THREE.ShapeGeometry(shapes, 24);
    faceGeo.translate(-WORDMARK.width / 2, WORDMARK.height / 2, 10.5);
    return {
      body: bodyGeo,
      face: faceGeo,
      sides: new THREE.MeshStandardMaterial({ color: "#1a2136", metalness: 0.85, roughness: 0.25 }),
    };
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
  const scale = Math.min(6.2, fitWidth) / WORDMARK.width;
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
