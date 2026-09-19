import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const WINDOW_MS = 15 * 60 * 1000; // 15-minute sliding window
const MAX_ATTEMPTS = 20; // 20 attempts per IP per 15 minutes

const ipAttempts = new Map<string, RateLimitRecord>();

// Periodic cleanup interval every 5 minutes to prevent memory leaks
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipAttempts.entries()) {
    if (now > record.resetTime) {
      ipAttempts.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// Prevent cleanup interval from blocking process termination
if (cleanupInterval.unref) {
  cleanupInterval.unref();
}

/**
 * Targeted rate limiter for sensitive authentication endpoints (login, signup, register).
 * Throttles excessive brute-force attempts while keeping normal API requests unthrottled.
 */
export function authRateLimiter(req: Request, res: Response, next: NextFunction) {
  // Allow disabling in automated test suites when testing other components
  if (process.env.DISABLE_AUTH_RATE_LIMIT === 'true') {
    return next();
  }

  const forwarded = req.headers['x-forwarded-for'];
  const clientIp =
    (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') ||
    req.ip ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  const now = Date.now();
  const record = ipAttempts.get(clientIp);

  if (!record || now > record.resetTime) {
    ipAttempts.set(clientIp, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  if (record.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    res.setHeader('Retry-After', retryAfterSeconds.toString());
    return res.status(429).json({
      error: 'Too many authentication attempts. Please try again in 15 minutes.',
    });
  }

  record.count += 1;
  return next();
}

/**
 * Resets the in-memory rate limiter tracking. Primarily used by unit and regression test suites.
 */
export function resetAuthRateLimiter(): void {
  ipAttempts.clear();
}
