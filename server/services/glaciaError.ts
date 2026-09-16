/**
 * glaciaError.ts
 * ============================================================
 * Centralized Error & Exception Foundation for Glacia Autonomy Engine
 * ------------------------------------------------------------
 * Eliminates silent catch blocks and provides structured,
 * observable, and safe error classification across all subsystems.
 * ============================================================
 */

export type GlaciaErrorCode =
  | 'GLACIA_AUTH_REQUIRED'
  | 'GLACIA_POLICY_VIOLATION'
  | 'GLACIA_APPROVAL_REQUIRED'
  | 'GLACIA_WORKFLOW_FAILED'
  | 'GLACIA_SANDBOX_TIMEOUT'
  | 'GLACIA_SANDBOX_EXECUTION_FAILED'
  | 'GLACIA_PROVIDER_EXHAUSTED'
  | 'GLACIA_RATE_LIMITED'
  | 'GLACIA_VALIDATION_FAILED'
  | 'GLACIA_CIRCUIT_BROKEN'
  | 'GLACIA_INTERNAL_ERROR';

export interface GlaciaErrorOptions {
  code: GlaciaErrorCode;
  statusCode?: number;
  retryable?: boolean;
  component?: string;
  cause?: unknown;
  details?: Record<string, unknown>;
}

export class GlaciaError extends Error {
  public readonly code: GlaciaErrorCode;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly component: string;
  public readonly details: Record<string, unknown>;
  public readonly timestamp: string;

  constructor(message: string, options: GlaciaErrorOptions) {
    super(message);
    this.name = 'GlaciaError';
    this.code = options.code;
    this.statusCode = options.statusCode ?? getDefaultStatusCode(options.code);
    this.retryable = options.retryable ?? isDefaultRetryable(options.code);
    this.component = options.component ?? 'GlaciaEngine';
    this.details = options.details ?? {};
    this.timestamp = new Date().toISOString();

    if (options.cause) {
      this.cause = options.cause;
    }

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, GlaciaError.prototype);
  }
}

function getDefaultStatusCode(code: GlaciaErrorCode): number {
  switch (code) {
    case 'GLACIA_AUTH_REQUIRED':
      return 401;
    case 'GLACIA_POLICY_VIOLATION':
    case 'GLACIA_APPROVAL_REQUIRED':
      return 403;
    case 'GLACIA_VALIDATION_FAILED':
      return 400;
    case 'GLACIA_RATE_LIMITED':
      return 429;
    case 'GLACIA_SANDBOX_TIMEOUT':
      return 504;
    case 'GLACIA_PROVIDER_EXHAUSTED':
    case 'GLACIA_CIRCUIT_BROKEN':
      return 503;
    case 'GLACIA_WORKFLOW_FAILED':
    case 'GLACIA_SANDBOX_EXECUTION_FAILED':
    case 'GLACIA_INTERNAL_ERROR':
    default:
      return 500;
  }
}

function isDefaultRetryable(code: GlaciaErrorCode): boolean {
  switch (code) {
    case 'GLACIA_RATE_LIMITED':
    case 'GLACIA_PROVIDER_EXHAUSTED':
    case 'GLACIA_SANDBOX_TIMEOUT':
      return true;
    default:
      return false;
  }
}

/**
 * Type guard to check if an unknown error is a GlaciaError
 */
export function isGlaciaError(err: unknown): err is GlaciaError {
  return err instanceof GlaciaError;
}

/**
 * Safely wrap any unknown error into a structured GlaciaError
 */
export function wrapGlaciaError(
  err: unknown,
  fallbackCode: GlaciaErrorCode = 'GLACIA_INTERNAL_ERROR',
  component = 'GlaciaEngine',
  extraDetails: Record<string, unknown> = {}
): GlaciaError {
  if (isGlaciaError(err)) {
    return err;
  }

  const message = err instanceof Error ? err.message : String(err || 'Unknown error occurred');
  return new GlaciaError(message, {
    code: fallbackCode,
    component,
    cause: err,
    details: {
      ...extraDetails,
      originalStack: err instanceof Error ? err.stack : undefined,
    },
  });
}

/**
 * Standard structured logger for Glacia operations
 */
export function logGlaciaError(err: unknown, component: string, action?: string): void {
  const gErr = wrapGlaciaError(err, 'GLACIA_INTERNAL_ERROR', component);
  const actionStr = action ? ` during [${action}]` : '';

  console.error(
    `[${gErr.component}] ❌ Error${actionStr}: [${gErr.code}] ${gErr.message}`,
    {
      statusCode: gErr.statusCode,
      retryable: gErr.retryable,
      details: gErr.details,
      timestamp: gErr.timestamp,
      stack: gErr.stack,
    }
  );
}

/**
 * Transform error into a safe client-facing API response object
 */
export function toSafeErrorResponse(err: unknown): {
  success: false;
  error: string;
  code: string;
  retryable: boolean;
} {
  const gErr = wrapGlaciaError(err);
  return {
    success: false,
    error: gErr.message,
    code: gErr.code,
    retryable: gErr.retryable,
  };
}
