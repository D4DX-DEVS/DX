/**
 * Records the home banner as one MP4: the live 3D flight, drawn frame by frame (so every frame is exact and the
 * result plays smoothly on any device) and encoded with the browser's own H.264 encoder.
 *
 *   npm run dev            (or any running copy of the site)
 *   npm run hero:video     records, then stores the video and shows it on the home page
 *
 * Needs Google Chrome. Environment: HERO_URL (default http://localhost:3233), CHROME_PATH, HERO_OUT,
 * HERO_VARIANT=mobile for the tall phone version (npm run hero:video does both).
 * It takes a while: the scene is drawn in software when there is no GPU.
 */
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const require = createRequire(import.meta.url);
const BASE = process.env.HERO_URL ?? "http://localhost:3233";
const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = process.env.HERO_OUT ?? path.resolve("storage/hero");
// Two recordings: the wide one for laptops and desktops, and a tall one laid out for phones.
const MOBILE = process.env.HERO_VARIANT === "mobile";
const W = MOBILE ? 720 : 1280;
const H = MOBILE ? 1560 : 720;
const SCREEN = MOBILE
  ? {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    }
  : { width: W, height: H, deviceScaleFactor: 1 };
const FILE = MOBILE ? "hero-mobile" : "hero";
const BITRATE = Number(process.env.HERO_BITRATE ?? 6_000_000);

await mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  protocolTimeout: 4 * 60 * 60 * 1000,
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
  ],
});
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(0);
  await page.setViewport(SCREEN);
  await page.goto(`${BASE}/?hero-capture=1`, {
    waitUntil: "domcontentloaded",
    timeout: 240_000,
  });
  await page.addScriptTag({
    path: require
      .resolve("mp4-muxer")
      .replace(/mp4-muxer\.(cjs|js|mjs)$/, "mp4-muxer.js"),
  });
  await page.waitForFunction(
    () => Boolean(window.__heroCapture && window.__heroGL),
    { timeout: 240_000 },
  );
  // The scene draws only when asked: ask until the panels' pictures have loaded and the first frame has been made.
  process.stdout.write("waiting for the scene...\n");
  for (let i = 0; i < 240; i++) {
    const ready = await page.evaluate(() => {
      window.__heroCapture.frame(0);
      return window.__heroCapture.isReady();
    });
    if (ready) break;
    await new Promise((r) => setTimeout(r, 1000));
  }

  const plan = await page.evaluate(() => {
    const c = window.__heroCapture;
    return {
      duration: c.duration,
      introEnd: c.introEnd,
      cues: c.cues,
      projects: c.projects,
      signature: c.signature,
      fps: c.fps,
    };
  });
  process.stdout.write(
    `recording ${plan.duration.toFixed(1)}s, ${Math.round(plan.duration * plan.fps)} frames at ${W}x${H}\n`,
  );

  const progress = setInterval(async () => {
    const n = await page
      .evaluate(() => window.__heroProgress ?? 0)
      .catch(() => 0);
    process.stdout.write(
      `  frame ${n}/${Math.round(plan.duration * plan.fps)}\n`,
    );
  }, 30_000);

  // Set up the encoder in the page, then draw and encode in short batches: one long call can outlast the
  // connection's patience on a slow or sleepy machine, short ones never do.
  await page.evaluate(
    async (width, height, bitrate) => {
      const cap = window.__heroCapture;
      const out = document.createElement("canvas");
      out.width = width;
      out.height = height;
      const ctx = out.getContext("2d");
      const muxer = new Mp4Muxer.Muxer({
        target: new Mp4Muxer.ArrayBufferTarget(),
        video: { codec: "avc", width, height },
        fastStart: "in-memory",
      });
      const rec = { out, ctx, muxer, failure: null, encoder: null };
      rec.encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => (rec.failure = e),
      });
      const config = {
        codec: "avc1.64002A",
        width,
        height,
        bitrate,
        framerate: cap.fps,
        latencyMode: "quality",
      };
      const support = await VideoEncoder.isConfigSupported(config);
      if (!support.supported)
        throw new Error("This Chrome cannot encode H.264 video.");
      rec.encoder.configure(config);
      rec.draw = (time) => {
        const gl = cap.frame(time);
        ctx.drawImage(gl, 0, 0, width, height);
      };
      window.__heroRec = rec;
    },
    W,
    H,
    BITRATE,
  );
  const total = Math.round(plan.duration * plan.fps);
  const BATCH = 30;
  for (let start = 0; start < total; start += BATCH) {
    await page.evaluate(
      async (start, end) => {
        const cap = window.__heroCapture;
        const rec = window.__heroRec;
        for (let i = start; i < end; i++) {
          rec.draw(i / cap.fps);
          const frame = new VideoFrame(rec.out, {
            timestamp: Math.round((i * 1e6) / cap.fps),
            duration: Math.round(1e6 / cap.fps),
          });
          rec.encoder.encode(frame, { keyFrame: i % cap.fps === 0 });
          frame.close();
          while (rec.encoder.encodeQueueSize > 6)
            await new Promise((r) => setTimeout(r, 5));
          if (rec.failure) throw rec.failure;
          window.__heroProgress = i;
        }
      },
      start,
      Math.min(total, start + BATCH),
    );
  }
  const result = await page.evaluate(async () => {
    const cap = window.__heroCapture;
    const rec = window.__heroRec;
    await rec.encoder.flush();
    rec.muxer.finalize();
    const bytes = new Uint8Array(rec.muxer.target.buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000)
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    // A still for the first paint: the opening logo, whole, while the heading is on screen.
    rec.draw(Math.max(0, cap.introEnd - 1.5));
    return {
      video: btoa(binary),
      poster: rec.out.toDataURL("image/jpeg", 0.88).split(",")[1],
    };
  });
  clearInterval(progress);
  await writeFile(
    path.join(OUT, `${FILE}.mp4`),
    Buffer.from(result.video, "base64"),
  );
  await writeFile(
    path.join(OUT, `${FILE}-poster.jpg`),
    Buffer.from(result.poster, "base64"),
  );
  if (!MOBILE)
    await writeFile(
      path.join(OUT, "hero.json"),
      JSON.stringify(
        {
          duration: plan.duration,
          introEnd: plan.introEnd,
          cues: plan.cues,
          projects: plan.projects,
          signature: plan.signature,
        },
        null,
        2,
      ),
    );
  process.stdout.write(`saved ${path.join(OUT, `${FILE}.mp4`)}\n`);
} finally {
  await browser.close();
}
