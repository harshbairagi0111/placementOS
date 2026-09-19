import { Response } from 'express';

/**
 * Sends a safe HTTP 500 error response.
 *
 * In production (NODE_ENV === 'production'):
 * - Suppresses all internal error messages, stack traces, database strings,
 *   filesystem paths, and implementation details.
 * - Returns a generic, safe response: { error: "Internal server error" }
 *
 * In development:
 * - Returns the error message or context for local debugging.
 *
 * In all environments:
 * - Logs the detailed server-side error for diagnostics and monitoring.
 */
export function sendSafeServerError(
  res: Response,
  error: any,
  context: string = 'Internal server error',
  statusCode: number = 500
): Response {
  // Always log detailed server-side error with context
  console.error(`[Server Error] ${context}:`, error);

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    return res.status(statusCode).json({ error: 'Internal server error' });
  }

  const message = error?.message || (typeof error === 'string' ? error : context);
  return res.status(statusCode).json({ error: message });
}
