import "server-only";
import mongoose from "mongoose";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = globalThis as unknown as { __mongoose?: MongooseCache };
const cache: MongooseCache = globalForMongoose.__mongoose ?? { conn: null, promise: null };
globalForMongoose.__mongoose = cache;

/** One shared connection per server process (survives dev hot reloads). */
export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    const { MONGODB_URI, DEBUG_DB } = env();
    if (DEBUG_DB === "1") {
      // Prints every query so we can verify each page only asks for what it renders.
      mongoose.set("debug", (collection: string, method: string, query: unknown) => {
        logger.debug(`mongo ${collection}.${method}`, query);
      });
    }
    mongoose.set("strictQuery", true);
    cache.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });
  }
  try {
    cache.conn = await cache.promise;
  } catch (error: unknown) {
    cache.promise = null;
    logger.error("MongoDB connection failed", error);
    throw new Error("Database unavailable");
  }
  return cache.conn;
}
