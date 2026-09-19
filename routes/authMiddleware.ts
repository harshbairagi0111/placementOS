import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from './securityConfig';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Authentication middleware enforcing RFC 6750 Bearer token authorization header.
 * Query parameter tokens (?token=...) are strictly rejected to prevent credential leakage
 * in URLs, browser histories, server access logs, and referrer headers.
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  let token: string | undefined;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // Reject requests without valid Bearer token header
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as { userId: string; email: string; role: string };
    req.user = decoded;
    return next();
  } catch (err) {
    // Safe generic 401 response - does not distinguish or leak token/secret internals
    return res.status(401).json({ error: 'Invalid or expired session — please log in again' });
  }
}
