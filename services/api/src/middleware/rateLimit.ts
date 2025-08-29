import { Request, Response, NextFunction } from 'express';
import logger from '../logger.js';
import { ERROR_MESSAGES, LOG_MESSAGES } from '../constants/logMessages.js';

interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    message: string;
}

class RateLimiter {
    private requests: Map<string, { count: number; resetTime: number }> = new Map();
    config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = config;
        // Clean up expired entries every minute
        setInterval(() => this.cleanup(), 60000);
    }

    getClientKey(req: Request): string {
        // Use IP address as the key, or X-Forwarded-For header if behind a proxy
        return (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, value] of this.requests.entries()) {
            if (now > value.resetTime) {
                this.requests.delete(key);
            }
        }
    }

    isAllowed(clientKey: string): boolean {
        const now = Date.now();
        const clientData = this.requests.get(clientKey);

        if (!clientData || now > clientData.resetTime) {
            // First request or window expired, reset
            this.requests.set(clientKey, {
                count: 1,
                resetTime: now + this.config.windowMs,
            });
            return true;
        }

        if (clientData.count >= this.config.maxRequests) {
            return false;
        }

        // Increment request count
        clientData.count++;
        return true;
    }

    getRemainingRequests(clientKey: string): number {
        const clientData = this.requests.get(clientKey);
        if (!clientData) return this.config.maxRequests;

        const now = Date.now();
        if (now > clientData.resetTime) return this.config.maxRequests;

        return Math.max(0, this.config.maxRequests - clientData.count);
    }

    getResetTime(clientKey: string): number {
        const clientData = this.requests.get(clientKey);
        return clientData ? clientData.resetTime : Date.now();
    }
}

// Create rate limiters for different endpoints
const generalLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests from this IP, please try again later.',
});

const userLimiter = new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 50,
    message: 'Too many user requests from this IP, please try again later.',
});

export function rateLimit(type: 'general' | 'user' = 'general') {
    return (req: Request, res: Response, next: NextFunction) => {
        const limiter = type === 'user' ? userLimiter : generalLimiter;
        const clientKey = limiter.getClientKey(req);

        if (!limiter.isAllowed(clientKey)) {
            logger.warn(LOG_MESSAGES.RATE_LIMIT_EXCEEDED, {
                clientKey,
                path: req.path,
                method: req.method,
            });

            const resetTime = limiter.getResetTime(clientKey);
            res.setHeader('X-RateLimit-Limit', limiter.config.maxRequests);
            res.setHeader('X-RateLimit-Remaining', 0);
            res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());
            res.setHeader('Retry-After', Math.ceil((resetTime - Date.now()) / 1000));

            return res.status(429).json({
                error: ERROR_MESSAGES.TOO_MANY_REQUESTS,
                message: limiter.config.message,
                retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
            });
        }

        // Add rate limit headers
        const remaining = limiter.getRemainingRequests(clientKey);
        const resetTime = limiter.getResetTime(clientKey);

        res.setHeader('X-RateLimit-Limit', limiter.config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());

        next();
    };
}
