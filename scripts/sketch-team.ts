/**
 * Draws the pencil-sketch version of every team portrait that has none yet (members saved before sketches existed).
 *   npm run sketch:team            draw the missing ones
 *   npm run sketch:team -- --all   draw every portrait again
 */
import { all, run } from "@/lib/db";
import { sketchFromUrl } from "@/lib/media";
import type { MediaDoc } from "@/lib/models";

function out(message: string): void {
  process.stdout.write(`${message}\n`);
}

async function main(): Promise<void> {
  const again = process.argv.includes("--all");
  const rows = await all<{ id: string; name: string; photo: string | null; photo_sketch: string | null }>("SELECT id, name, photo, photo_sketch FROM team_members");
  let done = 0;
  for (const row of rows) {
    if (!row.photo || (row.photo_sketch && !again)) continue;
    const photo = JSON.parse(row.photo) as MediaDoc;
    const sketch = await sketchFromUrl(photo.url, `Pencil sketch of ${row.name}`);
    if (!sketch) {
      out(`skipped ${row.name}: photo not found in the media store`);
      continue;
    }
    await run("UPDATE team_members SET photo_sketch = ? WHERE id = ?", [JSON.stringify(sketch), row.id]);
    out(`sketched ${row.name}`);
    done++;
  }
  out(`${done} sketch${done === 1 ? "" : "es"} made.`);
}

main().catch((error: unknown) => {
  process.stderr.write(`sketch failed: ${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
