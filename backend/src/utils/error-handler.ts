import { Response } from 'express';

/**
 * Canton HTTP JSON API error codes
 * Reference: https://docs.daml.com/json-api/index.html#error-handling
 */
export enum CantonErrorCode {
  CONTRACT_NOT_FOUND = 'CONTRACT_NOT_FOUND',
  INVALID_ARGUMENT = 'INVALID_ARGUMENT',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  UNAVAILABLE = 'UNAVAILABLE',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Map Canton error to HTTP status code
 */
function mapCantonErrorToStatus(errorCode: string): number {
  switch (errorCode) {
    case CantonErrorCode.CONTRACT_NOT_FOUND:
      return 404;
      
    case CantonErrorCode.INVALID_ARGUMENT:
      return 400;
      
    case CantonErrorCode.PERMISSION_DENIED:
      return 403;
      
    case CantonErrorCode.UNAUTHORIZED:
      return 401;
      
    case CantonErrorCode.RESOURCE_EXHAUSTED:
      return 429;
      
    case CantonErrorCode.UNAVAILABLE:
      return 503;
      
    default:
      return 500;
  }
}

/**
 * Parse Canton error from various error formats
 */
function parseCantonError(error: any): {
  code: string;
  message: string;
  isCantonError: boolean;
} {
  // Canton HTTP JSON API error format
  if (error.errors && Array.isArray(error.errors)) {
    return {
      code: error.errors[0] || CantonErrorCode.UNKNOWN,
      message: error.message || 'Canton operation failed',
      isCantonError: true
    };
  }
  
  // Check error message for known Canton error patterns
  const errorMsg = error.message || String(error);
  
  if (errorMsg.includes('not found') || errorMsg.includes('NOT_FOUND')) {
    return {
      code: CantonErrorCode.CONTRACT_NOT_FOUND,
      message: errorMsg,
      isCantonError: true
    };
  }
  
  if (errorMsg.includes('invalid') || errorMsg.includes('INVALID')) {
    return {
      code: CantonErrorCode.INVALID_ARGUMENT,
      message: errorMsg,
      isCantonError: true
    };
  }
  
  if (errorMsg.includes('permission') || errorMsg.includes('PERMISSION')) {
    return {
      code: CantonErrorCode.PERMISSION_DENIED,
      message: errorMsg,
      isCantonError: true
    };
  }
  
  if (errorMsg.includes('unavailable') || errorMsg.includes('UNAVAILABLE') || 
      errorMsg.includes('connection') || errorMsg.includes('ECONNREFUSED') ||
      errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT')) {
    return {
      code: CantonErrorCode.UNAVAILABLE,
      message: 'Canton service temporarily unavailable',
      isCantonError: true
    };
  }
  
  if (errorMsg.includes('unauthorized') || errorMsg.includes('UNAUTHORIZED')) {
    return {
      code: CantonErrorCode.UNAUTHORIZED,
      message: errorMsg,
      isCantonError: true
    };
  }
  
  // Unknown error
  return {
    code: CantonErrorCode.UNKNOWN,
    message: errorMsg,
    isCantonError: false
  };
}

/**
 * Handle Canton errors and send appropriate HTTP response
 * 
 * Usage:
 * catch (error: any) {
 *   handleCantonError(error, res, 'query transactions');
 * }
 */
export function handleCantonError(
  error: any,
  res: Response,
  operation: string
): void {
  console.error(`Failed to ${operation}:`, error);
  
  const parsed = parseCantonError(error);
  const statusCode = mapCantonErrorToStatus(parsed.code);
  
  const response: any = {
    error: `Failed to ${operation}`,
    code: parsed.code,
    details: parsed.message
  };
  
  // Add retry hint for temporary failures
  if (statusCode === 503 || statusCode === 429) {
    response.retry = true;
    response.retryAfter = statusCode === 429 ? 60 : 5; // seconds
  }
  
  // Add helpful context for 404 errors
  if (statusCode === 404) {
    response.hint = 'Contract may have already been accepted or does not exist';
  }
  
  // In development, include full error stack
  if (process.env.NODE_ENV !== 'production') {
    response.stack = error.stack;
  }
  
  res.status(statusCode).json(response);
}

/**
 * Handle general errors (non-Canton)
 */
export function handleGeneralError(
  error: any,
  res: Response,
  operation: string
): void {
  console.error(`Unexpected error during ${operation}:`, error);
  
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(500).json({
    error: `Internal server error during ${operation}`,
    code: 'INTERNAL_ERROR',
    message: isDevelopment ? error.message : 'An unexpected error occurred',
    ...(isDevelopment && { stack: error.stack })
  });
}

