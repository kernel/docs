import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiting is only active when Upstash credentials are set, so local dev
// and preview builds work without Redis. Set UPSTASH_REDIS_REST_URL and
// UPSTASH_REDIS_REST_TOKEN in the Vercel project to enable it.
const enabled =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = enabled ? Redis.fromEnv() : null;

// a short burst window plus a daily ceiling, keyed per client
const burst = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      prefix: "ratelimit:chat:burst",
      analytics: true,
    })
  : null;

const daily = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, "1 d"),
      prefix: "ratelimit:chat:daily",
      analytics: true,
    })
  : null;

/**
 * Returns true if the request is within limits (or rate limiting is disabled).
 */
export async function allowChatRequest(identifier: string): Promise<boolean> {
  if (!burst || !daily) return true;
  const [b, d] = await Promise.all([
    burst.limit(identifier),
    daily.limit(identifier),
  ]);
  return b.success && d.success;
}
