import { Container, getContainer } from "@cloudflare/containers";
import type { DurableObject } from "cloudflare:workers";

/** Bindings from wrangler.jsonc. Secrets are present at runtime too, but only forwarded, never read here. */
interface Env {
  SITE: DurableObjectNamespace<Site>;
}

/** The Next.js server from the root Dockerfile, running as a Cloudflare Container. */
export class Site extends Container<Env> {
  defaultPort = 8080;
  // Kept awake: after a restart the server serves the pages prerendered into the image again,
  // which can predate admin edits until they revalidate. A short value ("15m") is cheaper but cold-starts.
  sleepAfter = "720h";

  constructor(ctx: DurableObject["ctx"], env: Env) {
    super(ctx, env);
    // Worker secrets (dashboard: Settings > Variables & Secrets) become the server's process.env.
    const values = Object.entries(env).filter((entry): entry is [string, string] => typeof entry[1] === "string");
    this.envVars = { ...Object.fromEntries(values), NODE_ENV: "production", PORT: "8080", HOSTNAME: "0.0.0.0" };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const forwarded = new Request(request);
    // clientIp() reads x-forwarded-for, so overwrite it with the address Cloudflare saw.
    const ip = request.headers.get("cf-connecting-ip");
    if (ip) forwarded.headers.set("x-forwarded-for", ip);
    forwarded.headers.set("x-forwarded-proto", "https");
    return getContainer(env.SITE).fetch(forwarded);
  },
} satisfies ExportedHandler<Env>;
