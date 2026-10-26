/**
 * Keeps the home banner video in step with the projects, by itself.
 *
 *   npm run hero:watch
 *
 * Every minute it asks the site whether the recorded banner still matches the featured projects (/api/hero-status).
 * When a project has been added, removed, reordered or had its picture or icon changed, it records a new video
 * (wide and phone) and publishes it. Until the new video is ready, the home page shows the live 3D banner, which
 * always follows the current projects, so a new project is on the banner at once.
 *
 * Leave it running on a computer that has Google Chrome and can reach the site and the database (see
 * scripts/hero-video-capture.mjs). Environment: HERO_URL (default http://localhost:3233), HERO_POLL_SECONDS (60).
 */
import { spawn } from "node:child_process";

const BASE = process.env.HERO_URL ?? "http://localhost:3233";
const EVERY = Number(process.env.HERO_POLL_SECONDS ?? 60) * 1000;
let busy = false;

const log = (message) => process.stdout.write(`[${new Date().toISOString()}] ${message}\n`);

function run(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", env: { ...process.env, ...env } });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${args.join(" ")} exited with ${code}`))));
  });
}

async function check() {
  if (busy) return;
  let status;
  try {
    status = await (await fetch(`${BASE}/api/hero-status`, { cache: "no-store" })).json();
  } catch {
    return log(`cannot reach ${BASE}, will try again`);
  }
  if (!status.recorded) return; // the live banner is in use: nothing to keep up to date
  if (status.fresh) return;
  busy = true;
  log("the projects changed: recording a new banner video (this takes a while)");
  try {
    await run("node", ["scripts/hero-video-capture.mjs"]);
    await run("node", ["scripts/hero-video-capture.mjs"], { HERO_VARIANT: "mobile" });
    await run("npm", ["run", "hero:video:publish"]);
    log("the new banner video is published");
  } catch (error) {
    log(`recording failed: ${error.message}`);
  } finally {
    busy = false;
  }
}

log(`watching ${BASE} every ${EVERY / 1000}s`);
await check();
setInterval(check, EVERY);
