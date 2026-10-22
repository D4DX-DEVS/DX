import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

/** Shapes from an SVG path, flipped so the outline reads upright in three's y-up world. */
export function shapesFor(d: string): THREE.Shape[] {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg"><path transform="scale(1,-1)" d="${d}"/></svg>`;
  return new SVGLoader().parse(svg).paths.flatMap((p) => p.toShapes());
}

/** A flat face with UVs that "cover"-fit an image of the given aspect into the shapes' bounds. */
export function coverFace(shapes: THREE.Shape | THREE.Shape[], aspect: number, segments = 24): THREE.ShapeGeometry {
  const geo = new THREE.ShapeGeometry(shapes, segments);
  geo.computeBoundingBox();
  const box = geo.boundingBox ?? new THREE.Box3();
  const cx = (box.max.x + box.min.x) / 2;
  const cy = (box.max.y + box.min.y) / 2;
  const k = Math.max((box.max.x - box.min.x) / aspect, box.max.y - box.min.y);
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = 0.5 + (pos.getX(i) - cx) / (aspect * k);
    uv[i * 2 + 1] = 0.5 + (pos.getY(i) - cy) / k;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
}

/** A rectangle with rounded corners, centred on the origin. */
export function roundedRect(width: number, height: number, radius: number): THREE.Shape {
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + width - r, y);
  s.quadraticCurveTo(x + width, y, x + width, y + r);
  s.lineTo(x + width, y + height - r);
  s.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  s.lineTo(x + r, y + height);
  s.quadraticCurveTo(x, y + height, x, y + height - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Screens are sRGB photographs; say so before the first upload so they are not washed out. */
export function prepareTextures(loaded: THREE.Texture | THREE.Texture[]): void {
  for (const t of Array.isArray(loaded) ? loaded : [loaded]) {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.needsUpdate = true;
  }
}

/** Small deterministic PRNG so scattered geometry is identical on every render. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function smooth01(x: number): number {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
}
