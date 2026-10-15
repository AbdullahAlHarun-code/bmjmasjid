import { createHash } from "node:crypto";
import { withTransaction } from "@/server/db/pool";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_HITS = 8;

export function hashRateKey(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * Persistent fixed-window limiter stored in MySQL / MariaDB.
 * Fails closed if the database query fails.
 */
export async function consumeRateLimit(bucketKey: string): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStartMs = now - (now % WINDOW_MS);
  const hits = await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO request_rate_limits (bucket_key, window_start, hit_count)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE hit_count = hit_count + 1`,
      [bucketKey, windowStartMs],
    );
    const result = await client.query<{ hit_count: number }>(
      "SELECT hit_count FROM request_rate_limits WHERE bucket_key=? AND window_start=?",
      [bucketKey, windowStartMs],
    );
    return Number(result.rows[0]?.hit_count ?? MAX_HITS + 1);
  });
  const allowed = hits <= MAX_HITS;
  return {
    allowed,
    remaining: Math.max(0, MAX_HITS - hits),
    retryAfterSeconds: Math.ceil((windowStartMs + WINDOW_MS - now) / 1000),
  };
}
