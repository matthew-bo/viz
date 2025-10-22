import DOMPurify from 'dompurify';

/**
 * Input Sanitization Utilities
 * 
 * Prevents XSS attacks by sanitizing all user input before:
 * - Storing in state
 * - Sending to API
 * - Displaying in UI
 * 
 * Uses DOMPurify for robust HTML sanitization
 */

// Configure DOMPurify
const config = {
  ALLOWED_TAGS: [], // No HTML tags allowed in our app
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true, // Keep text content
  RETURN_TRUSTED_TYPE: false
};

/**
 * Sanitize a single string input
 * Removes all HTML tags and scripts
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  
  // Remove HTML tags and scripts
  const cleaned = DOMPurify.sanitize(input, config);
  
  // Additional safety: trim and limit length
  return cleaned.trim().slice(0, 10000); // Max 10k chars
}

/**
 * Sanitize a number input
 * Ensures it's a valid number
 */
export function sanitizeNumber(input: number | string | null | undefined): number {
  if (input === null || input === undefined || input === '') {
    return 0;
  }
  
  const num = typeof input === 'string' ? parseFloat(input) : input;
  
  if (isNaN(num) || !isFinite(num)) {
    return 0;
  }
  
  return num;
}

/**
 * Sanitize an object with string values
 * Recursively sanitizes all string properties
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'number') {
      sanitized[key] = sanitizeNumber(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) :
        typeof item === 'number' ? sanitizeNumber(item) :
        typeof item === 'object' ? sanitizeObject(item) :
        item
      );
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * Sanitize search query
 * More permissive than general sanitization (allows some special chars)
 */
export function sanitizeSearchQuery(query: string | null | undefined): string {
  if (!query) return '';
  
  // Allow alphanumeric, spaces, and common search operators
  const cleaned = query
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .slice(0, 500); // Limit search query length
  
  return cleaned;
}

/**
 * Sanitize file name
 * Removes dangerous characters from file names
 */
export function sanitizeFileName(fileName: string | null | undefined): string {
  if (!fileName) return 'download';
  
  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Only allow safe chars
    .replace(/_{2,}/g, '_') // Replace multiple underscores
    .slice(0, 255); // Max filename length
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  
  const cleaned = email.trim().toLowerCase();
  
  // Basic email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  return emailRegex.test(cleaned) ? cleaned : '';
}

/**
 * Sanitize URL
 * Only allows http/https protocols
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    
    return parsed.toString();
  } catch {
    return ''; // Invalid URL
  }
}

/**
 * Sanitize party/business name
 * Allows alphanumeric and common business characters
 */
export function sanitizePartyName(name: string | null | undefined): string {
  if (!name) return '';
  
  return name
    .trim()
    .replace(/<[^>]+>/g, '') // Remove HTML
    .replace(/[<>{}]/g, '') // Remove dangerous chars
    .slice(0, 100); // Max party name length
}

/**
 * Sanitize transaction description
 * Allows more characters but still safe
 */
export function sanitizeDescription(description: string | null | undefined): string {
  if (!description) return '';
  
  return DOMPurify.sanitize(description, {
    ...config,
    ALLOWED_TAGS: [], // Still no HTML
  }).trim().slice(0, 1000); // Max description length
}

/**
 * Type guard to check if input needs sanitization
 */
export function needsSanitization(input: any): boolean {
  if (typeof input === 'string') {
    return /<|>|script|javascript:|onerror|onclick/i.test(input);
  }
  return false;
}

/**
 * Log sanitization events for security monitoring
 */
export function logSanitization(
  field: string, 
  original: string, 
  sanitized: string
): void {
  if (original !== sanitized) {
    console.warn(`[Security] Input sanitized in field: ${field}`, {
      originalLength: original.length,
      sanitizedLength: sanitized.length,
      removed: original.length - sanitized.length
    });
    
    // Log to activity log if available
    if (typeof window !== 'undefined' && (window as any).addActivityLog) {
      (window as any).addActivityLog({
        level: 'warning',
        category: 'system',
        message: `Input sanitized: ${field}`,
        details: {
          field,
          charsRemoved: original.length - sanitized.length
        }
      });
    }
  }
}

