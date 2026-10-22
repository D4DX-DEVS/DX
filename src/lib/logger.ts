type Level = "debug" | "info" | "warn" | "error";

function write(level: Level, message: string, meta?: unknown): void {
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}${
    meta === undefined ? "" : ` ${safeStringify(meta)}`
  }\n`;
  if (level === "error" || level === "warn") process.stderr.write(line);
  else process.stdout.write(line);
}

function safeStringify(value: unknown): string {
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export const logger = {
  debug: (message: string, meta?: unknown) => write("debug", message, meta),
  info: (message: string, meta?: unknown) => write("info", message, meta),
  warn: (message: string, meta?: unknown) => write("warn", message, meta),
  error: (message: string, meta?: unknown) => write("error", message, meta),
};
