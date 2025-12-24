import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Use environment variables for Redis connection
// If no URL is provided, we can fallback to an in-memory mock for dev, 
// BUT for enterprise we should warn or fail.
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || "http://localhost:8079", // Fallback for local
    token: process.env.UPSTASH_REDIS_REST_TOKEN || "example_token",
});

// Create a new ratelimiter, that allows 10 requests per 10 seconds
export const rateLimiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
    prefix: "@upstash/ratelimit",
});

export async function checkRateLimit(identifier: string) {
    if (process.env.NODE_ENV === 'development' && !process.env.UPSTASH_REDIS_REST_URL) {
        return { success: true, limit: 100, remaining: 99, reset: 0 };
    }

    const { success, limit, remaining, reset } = await rateLimiter.limit(identifier);
    return { success, limit, remaining, reset };
}
