"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { coverFace, prepareTextures, roundedRect, smooth01 } from "./geometry";
import { activePanel, cameraZ, markOpen, panelPosition, panelZ } from "./path";
import { heroState } from "./state";

const ASPECT = 4 / 3;
const SLAB_DEPTH = 0.08;
const DIM = new THREE.Color(0.82, 0.82, 0.82);
const LIT = new THREE.Color(1, 1, 1);

/** How far ahead of the camera a panel begins to swim up, and how far ahead it has settled. */
const RISE_FROM = 15;
const RISE_TO = 5.2;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export interface PanelSource {
  src: string;
  /** The project's icon or logo, drawn over the picture (optional). */
  icon: string | null;
  title: string;
}

/** Loads an image for drawing on a canvas, trying again once after a pause (a cold image optimiser or a dropped request). */
function loadImage(src: string, tries = 2): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => {
      if (tries > 1)
        window.setTimeout(() => resolve(loadImage(src, tries - 1)), 700);
      else resolve(null);
    };
    img.src = src;
  });
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * The cover with the project's icon and name set over it, in a small dark pill at the bottom-left, so every
 * panel in the flight says whose work it is. Drawn once into a canvas that becomes the panel's texture.
 */
function labelled(
  cover: HTMLImageElement,
  icon: HTMLImageElement | null,
  title: string,
): THREE.Texture {
  const W = cover.naturalWidth;
  const H = cover.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(cover, 0, 0, W, H);

  // Glass, kept light so the screenshot stays sharp and in full colour: a faint glare in the top-left corner, a
  // barely-there diagonal streak and a bright rim.
  const glare = ctx.createLinearGradient(0, 0, W * 0.55, H * 0.75);
  glare.addColorStop(0, "rgba(255,255,255,0.12)");
  glare.addColorStop(0.3, "rgba(255,255,255,0)");
  glare.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glare;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W * 0.52, 0);
  ctx.lineTo(W * 0.66, 0);
  ctx.lineTo(W * 0.36, H);
  ctx.lineTo(W * 0.22, H);
  ctx.closePath();
  const streak = ctx.createLinearGradient(W * 0.3, 0, W * 0.6, 0);
  streak.addColorStop(0, "rgba(255,255,255,0)");
  streak.addColorStop(0.5, "rgba(255,255,255,0.04)");
  streak.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = streak;
  ctx.fill();
  ctx.restore();
  const rim = Math.max(2, W * 0.004);
  roundRectPath(ctx, rim / 2, rim / 2, W - rim, H - rim, W * 0.035);
  ctx.strokeStyle = "rgba(200,220,255,0.55)";
  ctx.lineWidth = rim;
  ctx.stroke();

  const pillH = H * 0.115;
  const pad = pillH * 0.16;
  const iconSize = pillH - pad * 2;
  const fontSize = pillH * 0.42;
  ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
  const maxText = W * 0.5;
  let text = title;
  while (ctx.measureText(text).width > maxText && text.length > 4)
    text = `${text.slice(0, -2)}…`;
  const textW = ctx.measureText(text).width;
  const pillW =
    pad + (icon ? iconSize + pad * 1.1 : pad) + textW + pillH * 0.42;
  const x = W * 0.04;
  const y = H - H * 0.05 - pillH;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = pillH * 0.35;
  ctx.shadowOffsetY = pillH * 0.1;
  roundRectPath(ctx, x, y, pillW, pillH, pillH / 2);
  ctx.fillStyle = "rgba(8,12,26,0.78)";
  ctx.fill();
  ctx.restore();
  roundRectPath(ctx, x, y, pillW, pillH, pillH / 2);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = Math.max(1, pillH * 0.02);
  ctx.stroke();

  let tx = x + pad + pillH * 0.22;
  if (icon) {
    const ix = x + pad;
    const iy = y + pad;
    ctx.save();
    roundRectPath(ctx, ix, iy, iconSize, iconSize, iconSize * 0.24);
    ctx.clip();
    ctx.fillStyle = "#fff";
    ctx.fillRect(ix, iy, iconSize, iconSize);
    ctx.drawImage(icon, ix, iy, iconSize, iconSize);
    ctx.restore();
    tx = ix + iconSize + pad * 1.1;
  }
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "middle";
  ctx.fillText(text, tx, y + pillH / 2 + fontSize * 0.04);
  return new THREE.CanvasTexture(canvas);
}

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

async function loadPanel(
  item: PanelSource,
): Promise<{ texture: THREE.Texture; ok: boolean }> {
  const [cover, icon] = await Promise.all([
    loadImage(item.src),
    item.icon ? loadImage(item.icon, 1) : Promise.resolve(null),
  ]);
  if (!cover) return { texture: placeholder(), ok: false };
  return { texture: labelled(cover, icon, item.title), ok: true };
}

/**
 * Every panel as a texture. Suspends until all have loaded or failed, and never throws: a screen that
 * cannot be fetched (or takes over 15 seconds) becomes a placeholder, and is fetched again next mount.
 */
function useTextures(items: PanelSource[]): THREE.Texture[] {
  const key = items
    .map((i) => `${i.src}|${i.icon ?? ""}|${i.title}`)
    .join("\n");
  let entry = cache.get(key);
  if (!entry) {
    const created: TextureEntry = {
      status: "pending",
      promise: Promise.resolve(),
      value: [],
      partial: false,
    };
    const results: ({ texture: THREE.Texture; ok: boolean } | null)[] =
      items.map(() => null);
    const loads = items.map((item, i) =>
      loadPanel(item).then((r) => {
        results[i] = r;
      }),
    );
    const timeout = new Promise<void>((resolve) =>
      window.setTimeout(resolve, LOAD_TIMEOUT_MS),
    );
    created.promise = Promise.race([
      Promise.all(loads).then(() => undefined),
      timeout,
    ]).then(() => {
      const settled = results.map(
        (r) => r ?? { texture: placeholder(), ok: false },
      );
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
  items: PanelSource[];
  wide: boolean;
}

/**
 * One floating slab per shipped app, carrying its artwork, set along the camera's path. The
 * panel the caption is talking about is lit; the others wait, dimmed.
 */
export function Panels({ items, wide }: PanelsProps) {
  const textures = useTextures(items);
  const width = wide ? 1.55 : 0.78;
  const height = width / ASPECT;
  const radius = width * 0.035;

  const { face, slab, edge, pane, glass } = useMemo(() => {
    const border = width * 0.025;
    const slabGeo = new THREE.ExtrudeGeometry(
      roundedRect(width + border * 2, height + border * 2, radius + border),
      {
        depth: SLAB_DEPTH,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.015,
        bevelSegments: 3,
        curveSegments: 10,
      },
    );
    const faceGeo = coverFace(roundedRect(width, height, radius), ASPECT, 10);
    faceGeo.translate(0, 0, SLAB_DEPTH + 0.02);
    // A clear pane just in front of the picture: it catches the environment's light strips, so a glare moves
    // across the glass as the panel turns.
    const paneGeo = new THREE.ShapeGeometry(
      roundedRect(width, height, radius),
      10,
    );
    paneGeo.translate(0, 0, SLAB_DEPTH + 0.035);
    return {
      face: faceGeo,
      slab: slabGeo,
      pane: paneGeo,
      // The slab is frosted blue glass rather than dark metal.
      edge: new THREE.MeshPhysicalMaterial({
        color: "#7f9dff",
        metalness: 0.1,
        roughness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        transparent: true,
        opacity: 0.55,
        envMapIntensity: 1.6,
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        metalness: 0,
        roughness: 0.04,
        clearcoat: 1,
        transparent: true,
        opacity: 0.05,
        envMapIntensity: 0.8,
        depthWrite: false,
      }),
    };
  }, [width, height, radius]);

  useLayoutEffect(
    () => () => {
      face.dispose();
      slab.dispose();
      edge.dispose();
      pane.dispose();
      glass.dispose();
    },
    [face, slab, edge, pane, glass],
  );

  const groups = useRef<(THREE.Group | null)[]>([]);
  const faces = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  useFrame((state, dt) => {
    const lit = activePanel(heroState.smooth, items.length);
    const camZ = cameraZ(heroState.smooth, items.length);
    // The projects wait unseen until the logo has broken: they come out of the cloud of pieces.
    const born = smooth01(
      (markOpen(heroState.smooth, items.length) - 0.55) / 0.45,
    );
    const t = state.clock.elapsedTime;
    for (let i = 0; i < items.length; i++) {
      const g = groups.current[i];
      if (g) {
        const [x, y, z] = panelPosition(i, wide);
        // Each screen bursts out of the middle: far ahead it sits on the flight line, small, and as the camera
        // nears it opens out to its place at the side and grows to full size. One smooth ease, nothing that wobbles.
        const k = THREE.MathUtils.clamp(
          (RISE_FROM - (camZ - panelZ(i))) / (RISE_FROM - RISE_TO),
          0,
          1,
        );
        const e = easeOutCubic(k);
        g.position.set(x * e, y * e + Math.sin(t * 0.5 + i * 1.7) * 0.03, z);
        const away = 1 - smooth01(heroState.retreat * 3);
        g.visible = born > 0.01 && away > 0.01;
        g.scale.setScalar((0.3 + 0.7 * e) * born * away);
        g.rotation.z = 0;
        // Each panel turns a little toward the pointer, on top of its own lean toward the corridor.
        g.rotation.y = THREE.MathUtils.damp(
          g.rotation.y,
          (i % 2 === 0 ? 1 : -1) * 0.22 + state.pointer.x * 0.28,
          4,
          dt,
        );
        g.rotation.x = THREE.MathUtils.damp(
          g.rotation.x,
          -state.pointer.y * 0.14,
          4,
          dt,
        );
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
            key={items[i]!.src}
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
            <mesh geometry={pane} material={glass} />
          </group>
        );
      })}
    </>
  );
}
