import { createHash } from "node:crypto";
import { query } from "@/server/db/pool";

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
 * Persistent sliding-window style limiter stored in PostgreSQL.
 * Fails closed if the database query fails.
 */
export async function consumeRateLimit(bucketKey: string): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStartMs = now - (now % WINDOW_MS);
  const windowStart = new Date(windowStartMs).toISOString();

  const result = await query<{ hit_count: number }>(
    `INSERT INTO request_rate_limits (bucket_key, window_start, hit_count)
     VALUES ($1, $2::timestamptz, 1)
     ON CONFLICT (bucket_key, window_start)
     DO UPDATE SET hit_count = request_rate_limits.hit_count + 1
     RETURNING hit_count`,
    [bucketKey, windowStart],
  );

  const hits = result.rows[0]?.hit_count ?? MAX_HITS + 1;
  const allowed = hits <= MAX_HITS;
  return {
    allowed,
    remaining: Math.max(0, MAX_HITS - hits),
    retryAfterSeconds: Math.ceil((windowStartMs + WINDOW_MS - now) / 1000),
  };
}
