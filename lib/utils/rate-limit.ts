import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

/**
 * Rate Limiter Configuration
 * 
 * Uses Upstash Redis for distributed rate limiting across serverless functions.
 * Falls back to in-memory rate limiting for development.
 */

// Initialize Redis client (only if credentials are provided)
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null

/**
 * Rate limiters for different endpoints
 */

// General API rate limit: 100 requests per 10 minutes per IP
export const apiRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '10 m'),
        analytics: true,
        prefix: 'ratelimit:api',
    })
    : null

// Auth endpoints: 10 requests per 15 minutes per IP (stricter for login/signup)
export const authRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '15 m'),
        analytics: true,
        prefix: 'ratelimit:auth',
    })
    : null

// Chat endpoints: 60 requests per minute per user
export const chatRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, '1 m'),
        analytics: true,
        prefix: 'ratelimit:chat',
    })
    : null

// File upload: 10 uploads per hour per user
export const uploadRateLimiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '1 h'),
        analytics: true,
        prefix: 'ratelimit:upload',
    })
    : null

/**
 * Rate limit check helper
 */
export async function checkRateLimit(
    limiter: Ratelimit | null,
    identifier: string
): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {
    // Skip rate limiting in development if Redis is not configured
    if (!limiter) {
        console.warn('Rate limiting is disabled (Redis not configured)')
        return { success: true }
    }

    const { success, limit, remaining, reset } = await limiter.limit(identifier)

    return {
        success,
        limit,
        remaining,
        reset,
    }
}

/**
 * Get client identifier for rate limiting
 * Uses IP address or user ID
 */
export function getClientIdentifier(request: Request, userId?: string): string {
    if (userId) {
        return `user:${userId}`
    }

    // Get IP from headers (works with Vercel, Cloudflare, etc.)
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

    return `ip:${ip}`
}

/**
 * Rate limit middleware for API routes
 */
export async function rateLimit(
    request: Request,
    limiter: Ratelimit | null,
    userId?: string
): Promise<Response | null> {
    const identifier = getClientIdentifier(request, userId)
    const { success, limit, remaining, reset } = await checkRateLimit(limiter, identifier)

    if (!success) {
        return new Response(
            JSON.stringify({
                error: {
                    message: 'Too many requests. Please try again later.',
                    code: 'RATE_LIMIT_EXCEEDED',
                    statusCode: 429,
                },
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': limit?.toString() || '',
                    'X-RateLimit-Remaining': remaining?.toString() || '',
                    'X-RateLimit-Reset': reset?.toString() || '',
                    'Retry-After': reset ? Math.ceil((reset - Date.now()) / 1000).toString() : '60',
                },
            }
        )
    }

    return null
}
