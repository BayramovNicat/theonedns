import { NextResponse } from 'next/server';

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();

/** Purge entries older than 5 minutes. Called inline to avoid setInterval timer leaks in serverless. */
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of buckets) {
    if (now - entry.lastRefill > 5 * 60 * 1000) {
      buckets.delete(key);
    }
  }
}

/**
 * Token-bucket rate limiter. Returns null if allowed, or a 429 Response if denied.
 *
 * NOTE: This is an in-memory limiter — it resets on cold starts and is per-instance
 * in serverless deployments. For multi-instance protection, replace with a persistent
 * store (e.g. @upstash/ratelimit or a Supabase-backed counter).
 *
 * @param key      Unique key (e.g. userId or userId:route)
 * @param max      Max tokens in the bucket
 * @param windowMs Refill interval in milliseconds
 */
export function rateLimit(
  key: string,
  max: number = 30,
  windowMs: number = 60_000,
): NextResponse | null {
  cleanup();

  const now = Date.now();
  let entry = buckets.get(key);

  if (!entry) {
    entry = { tokens: max - 1, lastRefill: now };
    buckets.set(key, entry);
    return null;
  }

  // Refill tokens based on elapsed time
  const elapsed = now - entry.lastRefill;
  const refill = Math.floor((elapsed / windowMs) * max);

  if (refill > 0) {
    entry.tokens = Math.min(max, entry.tokens + refill);
    entry.lastRefill = now;
  }

  if (entry.tokens <= 0) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
  }

  entry.tokens--;
  return null;
}
