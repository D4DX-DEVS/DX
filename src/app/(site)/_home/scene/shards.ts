import * as THREE from "three";
import { TessellateModifier } from "three/examples/jsm/modifiers/TessellateModifier.js";
import { seeded } from "./geometry";

/** A piece of a broken logo: where its cell is centred (in the artwork's units) and how it flies. */
export interface Shard {
  x: number;
  y: number;
  /** How far it is pushed away from the middle, and its push along the camera's axis. */
  reach: number;
  lift: number;
  /** Tumble speed about each axis, and a head start (0..1) so the pieces do not all leave at once. */
  spin: [number, number, number];
  delay: number;
}

interface ShardSpec {
  /** The artwork's size; the origin is its centre in the scene (y up). */
  width: number;
  height: number;
  /** Fills the artwork's shapes on a canvas drawn in artwork units (origin top-left, y down). */
  draw: (ctx: CanvasRenderingContext2D) => void;
  cols: number;
  rows: number;
  seed: number;
}

/**
 * Cuts an artwork into Voronoi pieces. Seeds sit on a jittered grid; only those whose cell holds some of the artwork
 * are kept (checked against its real shapes, so no piece is empty and none of the artwork is lost).
 */
export function makeShards({
  width,
  height,
  draw,
  cols,
  rows,
  seed,
}: ShardSpec): Shard[] {
  const rand = seeded(seed);
  const seeds: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      seeds.push({
        x: -width / 2 + ((c + 0.15 + rand() * 0.7) / cols) * width,
        y: height / 2 - ((r + 0.15 + rand() * 0.7) / rows) * height,
      });
    }
  }
  const step = Math.max(4, Math.round(Math.max(width, height) / 220));
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width / step);
  canvas.height = Math.ceil(height / step);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(1 / step, 1 / step);
  ctx.fillStyle = "#000";
  draw(ctx);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const owns = new Array<number>(seeds.length).fill(0);
  for (let py = 0; py < canvas.height; py++) {
    for (let px = 0; px < canvas.width; px++) {
      if (pixels[(py * canvas.width + px) * 4 + 3]! < 128) continue;
      const wx = px * step + step / 2 - width / 2;
      const wy = height / 2 - (py * step + step / 2);
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < seeds.length; i++) {
        const d = (seeds[i]!.x - wx) ** 2 + (seeds[i]!.y - wy) ** 2;
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      }
      owns[best]!++;
    }
  }
  const unit = Math.max(width, height);
  return seeds
    .filter((_, i) => owns[i]! > 0)
    .map((s) => {
      const len = Math.hypot(s.x, s.y) || 1;
      return {
        ...s,
        reach: unit * (0.6 + rand() * 1.1) + len * 0.6,
        lift: (rand() - 0.15) * unit * 1.5,
        spin: [(rand() - 0.5) * 7, (rand() - 0.5) * 7, (rand() - 0.5) * 5] as [
          number,
          number,
          number,
        ],
        delay: rand() * 0.25,
      };
    });
}

/**
 * Cuts a geometry into one geometry per shard: it is first split into small triangles, and each triangle goes to the
 * shard whose seed is nearest its centre. Each piece then draws only its own triangles, so a broken logo costs about
 * the same to draw as a whole one.
 */
export function splitGeometry(
  geometry: THREE.BufferGeometry,
  seeds: { x: number; y: number }[],
  maxEdge: number,
): THREE.BufferGeometry[] {
  const fine = new TessellateModifier(maxEdge, 10).modify(
    geometry.index ? geometry.toNonIndexed() : geometry,
  );
  const names = Object.keys(fine.attributes).filter(
    (n) => n === "position" || n === "normal" || n === "uv",
  );
  const buckets = seeds.map(() => names.map(() => [] as number[]));
  const pos = fine.attributes.position!;
  for (let t = 0; t < pos.count; t += 3) {
    const cx = (pos.getX(t) + pos.getX(t + 1) + pos.getX(t + 2)) / 3;
    const cy = (pos.getY(t) + pos.getY(t + 1) + pos.getY(t + 2)) / 3;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < seeds.length; i++) {
      const d = (seeds[i]!.x - cx) ** 2 + (seeds[i]!.y - cy) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    names.forEach((name, n) => {
      const attr = fine.attributes[name]!;
      for (let v = t; v < t + 3; v++)
        for (let k = 0; k < attr.itemSize; k++)
          buckets[best]![n]!.push(attr.array[v * attr.itemSize + k]!);
    });
  }
  fine.dispose();
  return buckets.map((lists) => {
    const g = new THREE.BufferGeometry();
    names.forEach((name, n) => {
      const size = name === "uv" ? 2 : 3;
      g.setAttribute(name, new THREE.Float32BufferAttribute(lists[n]!, size));
    });
    return g;
  });
}
