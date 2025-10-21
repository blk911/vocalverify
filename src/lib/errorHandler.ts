/**
 * Error Handler
 * Centralized error handling with proper logging and user-friendly messages
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

// Error types
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DATABASE = 'DATABASE_ERROR',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE_ERROR',
  INTERNAL = 'INTERNAL_ERROR',
}

// Custom error class
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: any;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.name = this.constructor.name;

    Error.captureStackTrace(this);
  }
}

// Validation error
export class ValidationError extends AppError {
  constructor(message: string, context?: any) {
    super(message, ErrorType.VALIDATION, 400, true, context);
  }
}

// Authentication error
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: any) {
    super(message, ErrorType.AUTHENTICATION, 401, true, context);
  }
}

// Authorization error
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: any) {
    super(message, ErrorType.AUTHORIZATION, 403, true, context);
  }
}

// Not found error
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: any) {
    super(`${resource} not found`, ErrorType.NOT_FOUND, 404, true, context);
  }
}

// Database error
export class DatabaseError extends AppError {
  constructor(message: string, context?: any) {
    super(message, ErrorType.DATABASE, 500, true, context);
  }
}

// External service error
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, context?: any) {
    super(
      `${service} error: ${message}`,
      ErrorType.EXTERNAL_SERVICE,
      503,
      true,
      context
    );
  }
}

/**
 * Error handler for API routes
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  // Log the error
  if (error instanceof AppError) {
    logger.error(error.message, error, context || error.type, error.context);

    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        type: error.type,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
          context: error.context,
        }),
      },
      { status: error.statusCode }
    );
  }

  // Handle standard errors
  if (error instanceof Error) {
    logger.error(error.message, error, context);

    return NextResponse.json(
      {
        ok: false,
        error: 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && {
          message: error.message,
          stack: error.stack,
        }),
      },
      { status: 500 }
    );
  }

  // Handle unknown errors
  logger.error('Unknown error occurred', undefined, context, { error });

  return NextResponse.json(
    {
      ok: false,
      error: 'An unexpected error occurred',
    },
    { status: 500 }
  );
}

/**
 * Async error wrapper for API routes
 */
export function asyncHandler(
  handler: (req: Request, context?: any) => Promise<NextResponse>
) {
  return async (req: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(req, context);
    } catch (error) {
      return handleApiError(error, 'API');
    }
  };
}

/**
 * Validate required fields
 */
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (
      !data[field] ||
      (typeof data[field] === 'string' && !data[field].trim())
    ) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missing, provided: Object.keys(data) }
    );
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', { email });
  }
}

/**
 * Validate phone format
 */
export function validatePhone(phone: string): void {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phone.replace(/[\s-()]/g, ''))) {
    throw new ValidationError('Invalid phone format', { phone });
  }
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    logger.warn('Failed to parse JSON', 'JSON', { json, error });
    return defaultValue;
  }
}

/**
 * Retry logic for external services
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        logger.warn(
          `Operation failed, retrying (${attempt}/${maxRetries})`,
          'Retry',
          { error: lastError.message }
        );
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw new ExternalServiceError(
    'Operation',
    `Failed after ${maxRetries} attempts: ${lastError?.message}`,
    { lastError }
  );
}

/**
 * Timeout wrapper
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

/**
 * Error boundary for client components
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Check if error is operational
 */
export function isOperationalError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
