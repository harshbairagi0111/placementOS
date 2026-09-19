import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authMiddleware, AuthRequest } from '../routes/authMiddleware';
import { authRouter } from '../routes/auth';
import {
  validateJwtSecret,
  assertValidJwtSecret,
  getJwtSecret,
  createCorsOptions,
  getAllowedCorsOrigins,
  INSECURE_DEFAULT_SECRETS,
} from '../routes/securityConfig';
import { authRateLimiter, resetAuthRateLimiter } from '../routes/authRateLimiter';

console.log('====================================================');
console.log('    PRODUCTION HARDENING & SECURITY TEST SUITE     ');
console.log('====================================================\n');

async function runTests() {
  const TEST_JWT_SECRET = 'super-long-secure-production-jwt-secret-key-32chars!';
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  process.env.NODE_ENV = 'development';

  // -------------------------------------------------------------
  // Test 1: Production JWT Secret Protection (Test E)
  // -------------------------------------------------------------
  console.log('Test 1: Production JWT Secret Validation (Fail-Closed Architecture)...');

  // Known insecure defaults must fail in production
  for (const insecureSecret of INSECURE_DEFAULT_SECRETS) {
    const res = validateJwtSecret(insecureSecret, true);
    assert.strictEqual(
      res.valid,
      false,
      `Secret "${insecureSecret}" MUST be rejected in production mode`
    );
    assert.throws(
      () => assertValidJwtSecret(insecureSecret, true),
      /Insecure JWT_SECRET rejected/,
      `assertValidJwtSecret must throw for insecure secret: ${insecureSecret}`
    );
  }

  // Missing or empty secret must fail in production
  const missingRes = validateJwtSecret(undefined, true);
  assert.strictEqual(missingRes.valid, false, 'Undefined JWT_SECRET must be rejected in production');
  const emptyRes = validateJwtSecret('', true);
  assert.strictEqual(emptyRes.valid, false, 'Empty JWT_SECRET must be rejected in production');

  // Short secrets (< 32 chars) must fail in production
  const shortRes = validateJwtSecret('short-secret-1234', true);
  assert.strictEqual(shortRes.valid, false, 'Short secret (< 32 chars) must be rejected in production');

  // Valid strong secret in production must pass
  const validProdRes = validateJwtSecret('a-strong-random-key-with-at-least-32-characters-length!', true);
  assert.strictEqual(validProdRes.valid, true, 'Strong secret (>= 32 chars) must pass validation');

  // Development mode allows convenience/local testing
  const devRes = validateJwtSecret('dev-secret', false);
  assert.strictEqual(devRes.valid, true, 'Development mode should allow local testing');

  console.log('  PASSED: Production JWT Secret Validation rejected all insecure defaults and placeholders.\n');

  // -------------------------------------------------------------
  // Test 2: Authentication Middleware Transport Restrictions (Tests A, B, C, D)
  // -------------------------------------------------------------
  console.log('Test 2: Authentication Middleware Transport Restrictions...');

  const app = express();

  // Apply Security Headers & Body Limit
  app.use(
    helmet({
      contentSecurityPolicy: false,
      frameguard: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.disable('x-powered-by');

  // Production CORS simulation with specific allowed origin
  process.env.CORS_ORIGINS = 'https://placementos.edu,https://app.placementos.edu';
  app.use(cors(createCorsOptions(true)));

  app.use(express.json({ limit: '1mb' }));
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Payload too large. Maximum allowed size is 1MB.' });
    }
    next(err);
  });

  // Protected route for testing
  app.get('/api/test/protected', authMiddleware, (req: AuthRequest, res: Response) => {
    return res.status(200).json({ status: 'ok', user: req.user });
  });

  // Controlled error route for testing production error sanitization
  app.get('/api/test/trigger-error', (req: Request, res: Response) => {
    const error = new Error('Sensitive MongoDB connection URI: mongodb://admin:secret123@internal.db:27017/db');
    (error as any).stack = 'Error: Sensitive trace at /internal/placementos/database.ts:42:15';
    throw error;
  });

  // Test auth routes
  app.use('/api/auth', authRouter);

  // Global Error Handler matching server.ts
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const isProd = process.env.NODE_ENV === 'production';
    const statusCode =
      typeof err.status === 'number' && err.status >= 400 && err.status < 600
        ? err.status
        : typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600
        ? err.statusCode
        : 500;

    if (isProd && statusCode >= 500) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(statusCode).json({
      error: isProd ? 'Request failed' : (err.message || 'Server error'),
    });
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const validToken = jwt.sign(
    { userId: '650000000000000000000001', email: 'test@student.edu', role: 'student' },
    TEST_JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Test A — Valid Bearer token
  const resA = await fetch(`${baseUrl}/api/test/protected`, {
    headers: { Authorization: `Bearer ${validToken}` },
  });
  assert.strictEqual(resA.status, 200, 'Test A: Valid Bearer token must succeed with HTTP 200');
  const bodyA = await resA.json();
  assert.strictEqual(bodyA.user.userId, '650000000000000000000001');
  console.log('  PASSED: Test A — Valid Bearer token successfully authenticated (HTTP 200).');

  // Test B — Query token rejected (must NOT authenticate)
  const resB = await fetch(`${baseUrl}/api/test/protected?token=${validToken}`);
  assert.strictEqual(resB.status, 401, 'Test B: Query parameter token must be rejected with HTTP 401');
  const bodyB = await resB.json();
  assert.strictEqual(bodyB.error, 'Authentication required');
  console.log('  PASSED: Test B — Query parameter ?token= rejected with HTTP 401.');

  // Test C — Missing token
  const resC = await fetch(`${baseUrl}/api/test/protected`);
  assert.strictEqual(resC.status, 401, 'Test C: Missing token must return HTTP 401');
  const bodyC = await resC.json();
  assert.strictEqual(bodyC.error, 'Authentication required');
  console.log('  PASSED: Test C — Missing token rejected with HTTP 401.');

  // Test D — Invalid token
  const resD = await fetch(`${baseUrl}/api/test/protected`, {
    headers: { Authorization: 'Bearer invalid.tampered.token' },
  });
  assert.strictEqual(resD.status, 401, 'Test D: Invalid token must return HTTP 401');
  const bodyD = await resD.json();
  assert.strictEqual(
    bodyD.error,
    'Invalid or expired session — please log in again',
    'Test D: Must return safe generic error message'
  );
  // Verify no secret or stack details leak in response
  const bodyDStr = JSON.stringify(bodyD);
  assert.strictEqual(bodyDStr.includes(TEST_JWT_SECRET), false, 'JWT secret must NEVER appear in response');
  assert.strictEqual(bodyDStr.includes('JsonWebTokenError'), false, 'JWT error internals must not leak');
  console.log('  PASSED: Test D — Invalid token returns safe HTTP 401 without leaking secret or JWT details.');

  // -------------------------------------------------------------
  // Test 3: Production CORS Tests (Requirement 13)
  // -------------------------------------------------------------
  console.log('\nTest 3: Production CORS Enforcement...');

  // Test Allowed Origin
  const allowedRes = await fetch(`${baseUrl}/api/test/protected`, {
    headers: {
      Authorization: `Bearer ${validToken}`,
      Origin: 'https://placementos.edu',
    },
  });
  assert.strictEqual(
    allowedRes.headers.get('Access-Control-Allow-Origin'),
    'https://placementos.edu',
    'Configured production origin must be allowed in Access-Control-Allow-Origin'
  );
  assert.strictEqual(
    allowedRes.headers.get('Access-Control-Allow-Credentials'),
    'true',
    'Configured origin may allow credentials'
  );
  console.log('  PASSED: Allowed production origin correctly received CORS headers.');

  // Test Unknown/Unconfigured Origin
  const unknownRes = await fetch(`${baseUrl}/api/test/protected`, {
    headers: {
      Authorization: `Bearer ${validToken}`,
      Origin: 'https://malicious-attacker-site.com',
    },
  });
  assert.strictEqual(
    unknownRes.headers.get('Access-Control-Allow-Origin'),
    null,
    'Unconfigured origin must NOT receive Access-Control-Allow-Origin header in production'
  );
  console.log('  PASSED: Unconfigured origin correctly blocked from CORS headers.');

  // Test Wildcard + Credentials Check
  const corsOptions = createCorsOptions(true);
  assert.notStrictEqual(
    (corsOptions as any).origin,
    '*',
    'Production CORS options must NEVER use wildcard "*" origin with credentials'
  );
  console.log('  PASSED: Production CORS never combines wildcard "*" with credentials.');

  // -------------------------------------------------------------
  // Test 4: Safe Production Error Responses (Requirement 14)
  // -------------------------------------------------------------
  console.log('\nTest 4: Safe Production Error Sanitization...');

  // 1. In Production Mode: errors must be sanitized
  process.env.NODE_ENV = 'production';
  const prodErrRes = await fetch(`${baseUrl}/api/test/trigger-error`);
  assert.strictEqual(prodErrRes.status, 500, 'Error route must return HTTP 500');
  const prodErrBody = await prodErrRes.json();
  assert.strictEqual(
    prodErrBody.error,
    'Internal server error',
    'Production 500 error must be generic "Internal server error"'
  );

  const prodErrStr = JSON.stringify(prodErrBody);
  assert.strictEqual(prodErrStr.includes('mongodb://'), false, 'Database URI must NOT leak in production error');
  assert.strictEqual(prodErrStr.includes('/internal/'), false, 'Filesystem path must NOT leak in production error');
  assert.strictEqual(prodErrStr.includes('database.ts'), false, 'Code filename must NOT leak in production error');
  assert.strictEqual(prodErrStr.includes('trace'), false, 'Stack trace must NOT leak in production error');
  console.log('  PASSED: Production 500 errors are sanitized to generic "Internal server error".');

  // 2. In Development Mode: allows debugging details
  process.env.NODE_ENV = 'development';
  const devErrRes = await fetch(`${baseUrl}/api/test/trigger-error`);
  assert.strictEqual(devErrRes.status, 500);
  const devErrBody = await devErrRes.json();
  assert.ok(devErrBody.error.includes('Sensitive MongoDB connection URI'), 'Dev mode provides error message for debugging');
  console.log('  PASSED: Development mode retains detailed error messages for developers.');

  // -------------------------------------------------------------
  // Test 5: Security Headers & X-Powered-By
  // -------------------------------------------------------------
  console.log('\nTest 5: Security Headers...');
  const secHeadersRes = await fetch(`${baseUrl}/api/test/protected`, {
    headers: { Authorization: `Bearer ${validToken}` },
  });
  assert.strictEqual(
    secHeadersRes.headers.get('X-Content-Type-Options'),
    'nosniff',
    'X-Content-Type-Options: nosniff must be present'
  );
  assert.strictEqual(
    secHeadersRes.headers.get('x-powered-by'),
    null,
    'X-Powered-By header must be stripped'
  );
  console.log('  PASSED: Security headers properly set and X-Powered-By stripped.');

  // -------------------------------------------------------------
  // Test 6: JSON Request Body Limit (1MB)
  // -------------------------------------------------------------
  console.log('\nTest 6: JSON Request Body Limit (1MB)...');
  // Create an oversized payload (~1.5 MB string)
  const oversizedPayload = { data: 'x'.repeat(1.5 * 1024 * 1024) };
  const oversizedRes = await fetch(`${baseUrl}/api/test/protected`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${validToken}`,
    },
    body: JSON.stringify(oversizedPayload),
  });
  assert.strictEqual(
    oversizedRes.status,
    413,
    'Oversized JSON payload (> 1MB) must be rejected with HTTP 413 Payload Too Large'
  );
  const oversizedBody = await oversizedRes.json();
  assert.ok(oversizedBody.error.includes('Payload too large'), 'Returns payload too large error message');
  console.log('  PASSED: Oversized JSON payload correctly rejected with HTTP 413.');

  // -------------------------------------------------------------
  // Test 7: Targeted Authentication Rate Limiting
  // -------------------------------------------------------------
  console.log('\nTest 7: Targeted Authentication Rate Limiting...');
  resetAuthRateLimiter();

  let rateLimited = false;
  let retryAfterHeader: string | null = null;

  // Make 22 consecutive login requests
  for (let i = 1; i <= 22; i++) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@user.com', password: 'wrongpassword' }),
    });

    if (res.status === 429) {
      rateLimited = true;
      retryAfterHeader = res.headers.get('Retry-After');
      const body = await res.json();
      assert.ok(body.error.includes('Too many authentication attempts'), 'Returns rate limit message');
      break;
    }
  }

  assert.strictEqual(rateLimited, true, 'Authentication endpoint must trigger 429 after 20 attempts');
  assert.ok(retryAfterHeader !== null, '429 response must include Retry-After header');
  console.log('  PASSED: Targeted rate limiting throttles excessive login attempts with HTTP 429.');

  // Clean up
  resetAuthRateLimiter();
  await new Promise<void>((resolve) => server.close(() => resolve()));

  console.log('\n====================================================');
  console.log(' ALL PRODUCTION SECURITY & HARDENING TESTS PASSED!  ');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
