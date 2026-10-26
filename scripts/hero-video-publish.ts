/**
 * Stores the recorded banner video (scripts/hero-video-capture.mjs) and makes the home page play it.
 *   npm run hero:video            records and publishes
 *   npm run hero:video:publish    publishes what was already recorded
 * To go back to the live 3D banner, run: npm run hero:video:off
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { nowIso, run } from "@/lib/db";
import { deleteMedia, processImage, storeVideo } from "@/lib/media";
import { first } from "@/lib/db";

function out(message: string): void {
  process.stdout.write(`${message}\n`);
}

async function main(): Promise<void> {
  const previous = await first<{ data: string }>(
    "SELECT data FROM settings WHERE key = 'hero'",
  );
  const old = previous
    ? (JSON.parse(previous.data) as {
        video?: string;
        poster?: { url?: string };
        mobile?: { video?: string; poster?: { url?: string } } | null;
      })
    : null;

  if (process.argv.includes("--off")) {
    await run("DELETE FROM settings WHERE key = 'hero'");
    await deleteMedia(old?.poster?.url);
    await deleteMedia(old?.mobile?.poster?.url);
    out(
      "the home page uses the live 3D banner again (restart or wait for the cache to expire to see it)",
    );
    return;
  }

  const dir = process.env.HERO_OUT ?? path.resolve("storage/hero");
  const plan = JSON.parse(
    await readFile(path.join(dir, "hero.json"), "utf8"),
  ) as Record<string, unknown>;
  const video = await storeVideo(await readFile(path.join(dir, "hero.mp4")));
  const poster = await processImage(
    await readFile(path.join(dir, "hero-poster.jpg")),
    "D4DX banner",
  );
  // The tall phone version is optional: without it phones play the wide one.
  const hasMobile = await readFile(path.join(dir, "hero-mobile.mp4")).then(
    () => true,
    () => false,
  );
  const mobile = hasMobile
    ? {
        video: await storeVideo(
          await readFile(path.join(dir, "hero-mobile.mp4")),
        ),
        poster: await processImage(
          await readFile(path.join(dir, "hero-mobile-poster.jpg")),
          "D4DX banner",
        ),
      }
    : null;
  const data = JSON.stringify({ ...plan, video, poster, mobile });
  await run(
    "INSERT INTO settings (key, data, updated_at) VALUES ('hero', ?, ?) ON CONFLICT (key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
    [data, nowIso()],
  );
  await deleteMedia(old?.poster?.url);
  await deleteMedia(old?.video);
  await deleteMedia(old?.mobile?.poster?.url);
  await deleteMedia(old?.mobile?.video);
  out(`published: ${video}${mobile ? ` and ${mobile.video}` : ""}`);
}

main().catch((error: unknown) => {
  process.stderr.write(
    `hero video failed: ${error instanceof Error ? error.stack : String(error)}\n`,
  );
  process.exitCode = 1;
});
