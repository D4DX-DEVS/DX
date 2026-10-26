"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { seeded } from "./geometry";
import { heroState } from "./state";

const STAR = new THREE.Color("#8ea6ff");
const TRAIL = STAR.clone().multiplyScalar(2.4);
// Scratch objects reused every frame.
const MATRIX = new THREE.Matrix4();
const NO_ROTATION = new THREE.Quaternion();
const SCALE = new THREE.Vector3();

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  attribute float aSize;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.3 + aSeed * 6.2831) * 0.18;
    p.y += cos(uTime * 0.23 + aSeed * 4.0) * 0.18;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (36.0 / -mv.z);
    float twinkle = 0.55 + 0.45 * sin(uTime * 1.6 + aSeed * 20.0);
    vAlpha = twinkle * smoothstep(28.0, 6.0, -mv.z) * smoothstep(0.3, 1.5, -mv.z);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    // A hot core above 1.0 so bloom gives each mote a soft halo.
    gl_FragColor = vec4(uColor * (1.0 + 1.4 * a * a), a * a * vAlpha);
  }
`;

interface DustProps {
  /** z range the dust fills, nearest first. */
  near: number;
  far: number;
  amount: number;
  /** Total camera travel in world units, used to turn scroll speed into flight speed. */
  travel: number;
}

/** Blue motes drifting around the flight path, and light trails that stretch when you scroll fast. */
export function Dust({ near, far, amount, travel }: DustProps) {
  const { points, trails, uniforms } = useMemo(() => {
    const rand = seeded(7);
    const pos = new Float32Array(amount * 3);
    const size = new Float32Array(amount);
    const seed = new Float32Array(amount);
    for (let i = 0; i < amount; i++) {
      const a = rand() * Math.PI * 2;
      const r = 1.4 + rand() * 6.5;
      pos[i * 3] = Math.cos(a) * r * 1.3;
      pos[i * 3 + 1] = Math.sin(a) * r * 0.8;
      pos[i * 3 + 2] = near - rand() * (near - far);
      size[i] = 0.6 + rand() * rand() * 3.2;
      seed[i] = rand();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));

    const trailCount = Math.round(amount / 12);
    const trailSpots: THREE.Vector3[] = [];
    for (let i = 0; i < trailCount; i++) {
      const a = rand() * Math.PI * 2;
      const r = 1.8 + rand() * 4.5;
      trailSpots.push(
        new THREE.Vector3(
          Math.cos(a) * r * 1.3,
          Math.sin(a) * r * 0.8,
          near - rand() * (near - far),
        ),
      );
    }

    return {
      points: geo,
      trails: trailSpots,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uColor: { value: STAR.clone() },
      },
    };
  }, [amount, near, far]);

  useLayoutEffect(() => () => points.dispose(), [points]);

  const material = useRef<THREE.ShaderMaterial>(null);
  const trailMesh = useRef<THREE.InstancedMesh>(null);
  const trailMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const last = useRef(heroState.smooth);
  const speed = useRef(0);

  useFrame((state, dt) => {
    if (material.current) {
      material.current.uniforms.uTime.value = state.clock.elapsedTime;
      material.current.uniforms.uPixelRatio.value = state.viewport.dpr;
    }

    // Flight speed in world units per second, eased so trails grow and fade rather than flicker.
    const step = Math.abs(heroState.smooth - last.current) * travel;
    last.current = heroState.smooth;
    const target = dt > 0 ? step / dt : 0;
    speed.current = THREE.MathUtils.damp(speed.current, target, 6, dt);

    const mesh = trailMesh.current;
    if (!mesh) return;
    SCALE.set(1, 1, 0.05 + Math.min(speed.current * 0.07, 2.4));
    trails.forEach((spot, i) => {
      mesh.setMatrixAt(i, MATRIX.compose(spot, NO_ROTATION, SCALE));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (trailMaterial.current)
      trailMaterial.current.opacity = Math.min(speed.current / 18, 0.75);
  });

  return (
    <>
      <points geometry={points} frustumCulled={false}>
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={VERTEX}
          fragmentShader={FRAGMENT}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <instancedMesh
        ref={trailMesh}
        args={[undefined, undefined, trails.length]}
        frustumCulled={false}
      >
        <boxGeometry args={[0.012, 0.012, 1]} />
        <meshBasicMaterial
          ref={trailMaterial}
          color={TRAIL}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </instancedMesh>
    </>
  );
}
