/**
 * fetchWithTimeout - Wrapper for fetch() with timeout support
 * 
 * Prevents requests from hanging indefinitely by aborting after specified timeout.
 * 
 * Usage:
 * const response = await fetchWithTimeout('/api/data', { method: 'GET' }, 15000);
 */

export interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number; // Timeout in milliseconds (default: 15000ms)
}

export class TimeoutError extends Error {
  constructor(timeout: number) {
    super(`Request timeout after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}

export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {},
  timeout: number = 15000
): Promise<Response> {
  const { timeout: optionsTimeout, ...fetchOptions } = options;
  const finalTimeout = optionsTimeout || timeout;

  // Create AbortController for cancellation
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), finalTimeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    // Check if error is due to abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(finalTimeout);
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Enhanced error messages for common HTTP errors
 */
export function getErrorMessage(error: Error, context?: string): string {
  if (error instanceof TimeoutError) {
    return 'The server is taking too long to respond. Please try again.';
  }

  if (error.message.includes('Failed to fetch')) {
    return 'Connection lost. Please check your internet connection.';
  }

  if (error.message.includes('NetworkError')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Return original error message with context
  return context 
    ? `${context}: ${error.message}`
    : error.message;
}

