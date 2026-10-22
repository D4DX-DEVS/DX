import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: { include: ["src/lib/**/*.ts"], exclude: ["src/lib/models/**", "src/lib/db.ts"] },
  },
});
