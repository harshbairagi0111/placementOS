import cors from 'cors';

/**
 * Known insecure or default placeholder JWT secrets that must NEVER be allowed in production.
 */
export const INSECURE_DEFAULT_SECRETS = [
  'super-secret-jwt-key-change-in-production',
  'replace-with-a-long-random-secret',
  'your-jwt-secret',
  'change-me',
  'secret',
  'jwt_secret',
  'default',
  '123456',
  'password',
  'my-secret-key',
  'test-secret',
];

export interface JwtSecretValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates whether a JWT secret is acceptable for the current environment.
 * In production mode (isProduction: true), it enforces:
 *  - Secret must exist and not be empty
 *  - Secret must NOT be any known default or placeholder
 *  - Secret must NOT contain placeholder substrings (e.g. 'change-in-production', 'replace-with')
 *  - Secret must be at least 32 characters long for cryptographic security
 */
export function validateJwtSecret(
  secret?: string,
  isProduction: boolean = process.env.NODE_ENV === 'production'
): JwtSecretValidationResult {
  if (!isProduction) {
    return { valid: true };
  }

  if (!secret || secret.trim() === '') {
    return {
      valid: false,
      error: 'JWT_SECRET environment variable is missing or empty in production.',
    };
  }

  const trimmed = secret.trim();

  // Check known blacklist
  if (INSECURE_DEFAULT_SECRETS.includes(trimmed.toLowerCase())) {
    return {
      valid: false,
      error: `Insecure JWT_SECRET rejected: "${trimmed}" is a known default/placeholder and must not be used in production.`,
    };
  }

  // Check for placeholder patterns
  const lower = trimmed.toLowerCase();
  if (
    lower.includes('change-in-production') ||
    lower.includes('replace-with') ||
    lower.includes('your-secret') ||
    lower.includes('change-me')
  ) {
    return {
      valid: false,
      error: 'Insecure JWT_SECRET rejected: Secret contains placeholder text and must be replaced in production.',
    };
  }

  // Minimum length check for 256-bit entropy
  if (trimmed.length < 32) {
    return {
      valid: false,
      error: `Insecure JWT_SECRET rejected: Secret length is ${trimmed.length} characters; production requires at least 32 characters.`,
    };
  }

  return { valid: true };
}

/**
 * Asserts that the JWT secret is valid. Throws an error if invalid in production.
 */
export function assertValidJwtSecret(
  secret?: string,
  isProduction: boolean = process.env.NODE_ENV === 'production'
): string {
  const result = validateJwtSecret(secret, isProduction);
  if (!result.valid) {
    throw new Error(result.error);
  }
  return secret || 'dev-local-jwt-secret-do-not-use-in-prod';
}

/**
 * Retrieves the active JWT secret.
 * In production, strictly validates and fails closed if invalid.
 * In development/test, provides a safe local fallback if not configured.
 */
export function getJwtSecret(
  isProduction: boolean = process.env.NODE_ENV === 'production'
): string {
  const envSecret = process.env.JWT_SECRET;
  if (isProduction) {
    return assertValidJwtSecret(envSecret, true);
  }
  return envSecret || 'dev-local-jwt-secret-do-not-use-in-prod';
}

/**
 * Parses and returns the list of allowed CORS origins.
 */
export function getAllowedCorsOrigins(): string[] {
  const originSet = new Set<string>();

  if (process.env.CORS_ORIGINS) {
    process.env.CORS_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((origin) => originSet.add(origin));
  }

  if (process.env.APP_URL) {
    try {
      const parsed = new URL(process.env.APP_URL);
      originSet.add(parsed.origin);
    } catch {
      // Ignore malformed APP_URL
    }
  }

  return Array.from(originSet);
}

/**
 * Builds environment-aware CORS configuration.
 * In development: allows dev origins and direct local tools.
 * In production: strictly enforces explicit origins whitelist. Never combines '*' with credentials.
 */
export function createCorsOptions(
  isProduction: boolean = process.env.NODE_ENV === 'production'
): cors.CorsOptions {
  if (!isProduction) {
    return {
      origin: (_origin, callback) => {
        // Development allows all origins or requests without origin (curl, etc.)
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    };
  }

  const allowedOrigins = getAllowedCorsOrigins();

  return {
    origin: (origin, callback) => {
      // Requests without origin (e.g. server-to-server, health check, curl) are permitted
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Origin not in allowed whitelist: do not set Access-Control-Allow-Origin
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };
}

/**
 * Validates critical production configuration on server startup.
 */
export function validateProductionConfig(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    return;
  }

  console.log('[Security] Validating production environment configuration...');

  // 1. Enforce strict JWT secret
  assertValidJwtSecret(process.env.JWT_SECRET, true);

  // 2. Log CORS configuration status
  const allowed = getAllowedCorsOrigins();
  if (allowed.length === 0) {
    console.warn(
      '[Security Warning] Production CORS_ORIGINS is not set. Cross-origin browser requests will be blocked.'
    );
  } else {
    console.log(`[Security] Production CORS allowed origins: ${allowed.join(', ')}`);
  }
}
