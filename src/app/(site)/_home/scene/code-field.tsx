"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { seeded } from "./geometry";

/** Symbols that read as code and machine learning. Each is drawn once into a cell of an atlas texture. */
const GLYPHS = [
  "{ }",
  "</>",
  "01",
  "10",
  "AI",
  "fn",
  "=>",
  "[ ]",
  "( )",
  "if",
  "λ",
  "Σ",
  "π",
  "&&",
  "#",
  "::",
  "//",
  "<>",
  "ƒ",
  "∞",
  "ML",
  "0x",
  "1",
  "0",
];
const COLS = 8;
const ROWS = Math.ceil(GLYPHS.length / COLS);
const CELL = 128;

/** Colours of the symbols: mostly the brand's blues, a few cyan, violet and green. */
const TINTS = [
  "#6f8fff",
  "#8ea6ff",
  "#4d6dff",
  "#5fd0ff",
  "#a78bfa",
  "#7be0b0",
];

function atlas(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  GLYPHS.forEach((g, i) => {
    const x = (i % COLS) * CELL + CELL / 2;
    const y = Math.floor(i / COLS) * CELL + CELL / 2;
    ctx.font = `700 ${g.length > 2 ? 54 : 74}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
    ctx.fillText(g, x, y + 4);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const GLYPH_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uRange;
  attribute float aGlyph;
  attribute float aSize;
  attribute float aSeed;
  attribute float aSpeed;
  attribute vec3 aTint;
  varying float vGlyph;
  varying float vAlpha;
  varying vec3 vTint;
  void main() {
    vec3 p = position;
    // Rising slowly, wrapping at the top, with a little sideways sway.
    p.y = mod(position.y + uTime * aSpeed + uRange * 0.5, uRange) - uRange * 0.5;
    p.x += sin(uTime * 0.3 + aSeed * 6.2831) * 0.12;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (300.0 / -mv.z);
    float twinkle = 0.6 + 0.4 * sin(uTime * 1.3 + aSeed * 30.0);
    // Fade at the top and bottom of the column, and into the distance and near the lens.
    float edge = smoothstep(0.0, 1.6, uRange * 0.5 - abs(p.y));
    vAlpha = twinkle * edge * smoothstep(34.0, 8.0, -mv.z) * smoothstep(1.8, 5.5, -mv.z);
    vGlyph = aGlyph;
    vTint = aTint;
  }
`;

const GLYPH_FRAGMENT = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform float uCols;
  uniform float uRows;
  varying float vGlyph;
  varying float vAlpha;
  varying vec3 vTint;
  void main() {
    float col = mod(vGlyph, uCols);
    float row = floor(vGlyph / uCols);
    vec2 uv = vec2((col + gl_PointCoord.x) / uCols, 1.0 - (row + 1.0 - gl_PointCoord.y) / uRows);
    float a = texture2D(uAtlas, uv).r;
    if (a < 0.02) discard;
    // Above 1.0 so the bloom pass gives each symbol a soft glow.
    gl_FragColor = vec4(vTint * (0.9 + 1.3 * a), a * vAlpha);
  }
`;

const LINE_VERTEX = /* glsl */ `
  uniform float uTime;
  attribute float aPhase;
  varying float vPulse;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    // A light that runs along each link: bright where the travelling phase is near this end.
    vPulse = 0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * 1.4 + aPhase * 6.2831), 3.0);
    vPulse *= smoothstep(34.0, 9.0, -mv.z) * smoothstep(3.0, 9.0, -mv.z);
  }
`;

const LINE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  varying float vPulse;
  void main() {
    gl_FragColor = vec4(uColor * (0.8 + vPulse), 0.26 * vPulse);
  }
`;

interface CodeFieldProps {
  /** z range the field fills, nearest first. */
  near: number;
  far: number;
  /** Floating symbols. */
  glyphs: number;
  /** Nodes in the network (links are made between near neighbours). */
  nodes: number;
}

/**
 * The hero's background: symbols from code and machine learning (braces, tags, 01, λ, Σ, AI...)
 * drifting up through the corridor the camera flies down, and a web of glowing nodes joined by lines
 * with light running along them, like a neural network.
 */
export function CodeField({ near, far, glyphs, nodes }: CodeFieldProps) {
  const { glyphGeo, lineGeo, glyphUniforms, lineUniforms, texture } =
    useMemo(() => {
      const rand = seeded(23);
      const tex = atlas();
      const RANGE = 12;

      const pos = new Float32Array(glyphs * 3);
      const gl = new Float32Array(glyphs);
      const size = new Float32Array(glyphs);
      const seed = new Float32Array(glyphs);
      const speed = new Float32Array(glyphs);
      const tint = new Float32Array(glyphs * 3);
      const color = new THREE.Color();
      for (let i = 0; i < glyphs; i++) {
        // Spread around the flight path, leaving the middle clearer so the panels stay readable.
        const side = rand() < 0.5 ? -1 : 1;
        pos[i * 3] = side * (1.2 + rand() * 7.5);
        pos[i * 3 + 1] = (rand() - 0.5) * RANGE;
        pos[i * 3 + 2] = near - rand() * (near - far);
        gl[i] = Math.floor(rand() * GLYPHS.length);
        size[i] = 0.6 + rand() * rand() * 1.6;
        seed[i] = rand();
        speed[i] = 0.12 + rand() * 0.32;
        color.set(TINTS[Math.floor(rand() * TINTS.length)]!);
        tint.set([color.r, color.g, color.b], i * 3);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.setAttribute("aGlyph", new THREE.BufferAttribute(gl, 1));
      g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
      g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
      g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
      g.setAttribute("aTint", new THREE.BufferAttribute(tint, 3));

      // The network: nodes scattered the same way, each joined to up to three near ones.
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < nodes; i++) {
        const side = rand() < 0.5 ? -1 : 1;
        pts.push(
          new THREE.Vector3(
            side * (2 + rand() * 7),
            (rand() - 0.5) * 8,
            near - rand() * (near - far),
          ),
        );
      }
      const segs: number[] = [];
      const phases: number[] = [];
      const links = new Set<string>();
      pts.forEach((a, i) => {
        const near3 = pts
          .map((b, j) => ({ j, d: a.distanceTo(b) }))
          .filter((n) => n.j !== i && n.d < 3.4)
          .sort((m, n) => m.d - n.d)
          .slice(0, 3);
        for (const n of near3) {
          const key = i < n.j ? `${i}-${n.j}` : `${n.j}-${i}`;
          if (links.has(key)) continue;
          links.add(key);
          const b = pts[n.j]!;
          const phase = rand();
          segs.push(a.x, a.y, a.z, b.x, b.y, b.z);
          phases.push(phase, phase + 0.35);
        }
      });
      const lg = new THREE.BufferGeometry();
      lg.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(segs), 3),
      );
      lg.setAttribute(
        "aPhase",
        new THREE.BufferAttribute(new Float32Array(phases), 1),
      );

      return {
        texture: tex,
        glyphGeo: g,
        lineGeo: lg,
        glyphUniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uRange: { value: RANGE },
          uAtlas: { value: tex },
          uCols: { value: COLS },
          uRows: { value: ROWS },
        },
        lineUniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color("#5b7bff") },
        },
      };
    }, [near, far, glyphs, nodes]);

  useLayoutEffect(
    () => () => {
      glyphGeo.dispose();
      lineGeo.dispose();
      texture.dispose();
    },
    [glyphGeo, lineGeo, texture],
  );

  const glyphMaterial = useRef<THREE.ShaderMaterial>(null);
  const lineMaterial = useRef<THREE.ShaderMaterial>(null);

  useFrame((state) => {
    if (glyphMaterial.current) {
      glyphMaterial.current.uniforms.uTime.value = state.clock.elapsedTime;
      glyphMaterial.current.uniforms.uPixelRatio.value = state.viewport.dpr;
    }
    if (lineMaterial.current)
      lineMaterial.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <>
      <lineSegments geometry={lineGeo} frustumCulled={false}>
        <shaderMaterial
          ref={lineMaterial}
          uniforms={lineUniforms}
          vertexShader={LINE_VERTEX}
          fragmentShader={LINE_FRAGMENT}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      {/* The code symbols drift over everything, the screens included, like particles in the water around them. */}
      <points geometry={glyphGeo} frustumCulled={false} renderOrder={10}>
        <shaderMaterial
          ref={glyphMaterial}
          uniforms={glyphUniforms}
          vertexShader={GLYPH_VERTEX}
          fragmentShader={GLYPH_FRAGMENT}
          transparent
          depthTest={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}
