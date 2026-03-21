// Simple in-memory rate limiter
// Works on single-process deployments (Vercel edge or single Node instance).
// For multi-instance production, replace Map with an Upstash Redis store.

type RateLimitEntry = { count: number; resetAt: number };

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (entry.resetAt < now) store.delete(key);
    });
  }, 5 * 60 * 1000);
}

/**
 * Check if a key (e.g. IP + route) has exceeded the rate limit.
 * @param key      Unique identifier (userId or IP + endpoint)
 * @param limit    Max requests allowed per window
 * @param windowMs Window duration in milliseconds
 * @returns `{ ok: true }` if allowed, `{ ok: false, retryAfter }` if blocked
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { ok: true };
}

/**
 * Extract a request identifier from a Next.js request.
 * Uses x-forwarded-for when available, falls back to a generic key.
 */
export function getRequestKey(request: Request, suffix: string): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  return `${ip}:${suffix}`;
}
