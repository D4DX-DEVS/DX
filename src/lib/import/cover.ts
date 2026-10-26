import "server-only";
import sharp, { type OverlayOptions } from "sharp";

const W = 1600;
const H = 1200;

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function shade(rgb: [number, number, number], by: number): string {
  const [r, g, b] = rgb.map((v) =>
    Math.max(0, Math.min(255, Math.round(v * by))),
  );
  return `rgb(${r},${g},${b})`;
}

/** A phone: the screenshot with rounded corners inside a dark bezel, at the given height, optionally turned. */
async function phone(
  shot: Buffer,
  height: number,
  turn = 0,
): Promise<{ input: Buffer; width: number; height: number }> {
  const bezel = Math.round(height * 0.018);
  const innerH = height - bezel * 2;
  const meta = await sharp(shot).metadata();
  const innerW = Math.round(
    (innerH * (meta.width ?? 9)) / (meta.height ?? 19.5),
  );
  const screenRadius = Math.round(innerW * 0.11);
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${innerW}" height="${innerH}"><rect width="${innerW}" height="${innerH}" rx="${screenRadius}" fill="#fff"/></svg>`,
  );
  const screen = await sharp(shot)
    .resize(innerW, innerH, { fit: "cover", position: "top" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  const w = innerW + bezel * 2;
  const body = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${height}"><rect width="${w}" height="${height}" rx="${screenRadius + bezel}" fill="#0a0d16" stroke="rgba(255,255,255,0.28)" stroke-width="3"/></svg>`,
  );
  let out = await sharp(body)
    .composite([{ input: screen, left: bezel, top: bezel }])
    .png()
    .toBuffer();
  let size = { width: w, height };
  if (turn) {
    const turned = sharp(out).rotate(turn, {
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
    out = await turned.png().toBuffer();
    const m = await sharp(out).metadata();
    size = { width: m.width ?? w, height: m.height ?? height };
  }
  return { input: out, ...size };
}

interface CoverOptions {
  icon: Buffer | null;
  shots: Buffer[];
  /** True when the shots are phone screens. */
  phone: boolean;
  chips: string[];
}

/**
 * A designed 4:3 cover for a project, built from what its pages give us: the app's colour as the ground, its
 * icon and name on the left, and its screens as three phones on the right (or a browser window for a site).
 */
export async function buildCover({
  icon,
  shots,
  phone: isPhone,
  chips,
}: CoverOptions): Promise<Buffer> {
  let base: [number, number, number] = [45, 80, 210];
  if (icon) {
    const { dominant } = await sharp(icon).resize(64, 64).stats();
    base = [dominant.r, dominant.g, dominant.b];
  }
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(base, 0.62)}"/><stop offset="1" stop-color="${shade(base, 0.28)}"/></linearGradient>
        <radialGradient id="r" cx="0.7" cy="0.35" r="0.6"><stop offset="0" stop-color="rgb(255,255,255)" stop-opacity="0.22"/><stop offset="1" stop-color="rgb(255,255,255)" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/><rect width="${W}" height="${H}" fill="url(#r)"/>
    </svg>`,
  );
  const layers: OverlayOptions[] = [];

  if (isPhone && shots.length > 0) {
    const centre = await phone(shots[0]!, 1000);
    const cx = 1050;
    if (shots[1]) {
      const left = await phone(shots[1], 820, -8);
      layers.push({
        input: left.input,
        left: Math.round(cx - centre.width / 2 - left.width * 0.62),
        top: Math.round(H / 2 - left.height / 2 + 40),
      });
    }
    if (shots[2]) {
      const right = await phone(shots[2], 820, 8);
      layers.push({
        input: right.input,
        left: Math.round(cx + centre.width / 2 - right.width * 0.38),
        top: Math.round(H / 2 - right.height / 2 + 40),
      });
    }
    layers.push({
      input: centre.input,
      left: Math.round(cx - centre.width / 2),
      top: Math.round(H / 2 - centre.height / 2),
    });
  } else if (shots.length > 0) {
    const winW = 880;
    const winH = 640;
    const bar = 46;
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${winW}" height="${winH}"><rect width="${winW}" height="${winH}" rx="22" fill="#fff"/></svg>`,
    );
    const page = await sharp(shots[0])
      .resize(winW, winH - bar, { fit: "cover", position: "top" })
      .png()
      .toBuffer();
    const chrome = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${winW}" height="${winH}"><rect width="${winW}" height="${winH}" fill="#1b2033"/><rect width="${winW}" height="${bar}" fill="#262c42"/>` +
        `<circle cx="28" cy="23" r="7" fill="#ff5f57"/><circle cx="52" cy="23" r="7" fill="#febc2e"/><circle cx="76" cy="23" r="7" fill="#28c840"/></svg>`,
    );
    const win = await sharp(chrome)
      .composite([
        { input: page, left: 0, top: bar },
        { input: mask, blend: "dest-in" },
      ])
      .png()
      .toBuffer();
    layers.push({ input: win, left: 640, top: Math.round(H / 2 - winH / 2) });
  }

  const label = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="${chips.length ? 120 : 20}">
      ${chips
        .map(
          (c, i) =>
            `<g transform="translate(${i * 150},0)"><rect width="136" height="48" rx="24" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.3)"/><text x="68" y="31" font-family="sans-serif" font-size="22" font-weight="700" fill="#fff" text-anchor="middle">${esc(c)}</text></g>`,
        )
        .join("")}
    </svg>`,
  );
  if (icon) {
    const size = 280;
    const rounded = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="64" fill="#fff"/></svg>`,
    );
    const iconImg = await sharp(icon)
      .resize(size, size, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .composite([{ input: rounded, blend: "dest-in" }])
      .png()
      .toBuffer();
    layers.push({ input: iconImg, left: 130, top: 400 });
  }
  if (chips.length) layers.push({ input: label, left: 130, top: 720 });

  return sharp(bg).composite(layers).png().toBuffer();
}
