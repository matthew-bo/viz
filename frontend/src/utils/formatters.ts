/**
 * Utility functions for formatting data for display
 */

/**
 * Format a number as USD currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number with compact notation (e.g., 1.2M, 500K)
 */
export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(num);
}

/**
 * Format RWA type for display
 */
export function formatRWAType(rwaType?: string): string {
  if (!rwaType) return 'Cash';
  
  return rwaType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Truncate long strings with ellipsis
 */
export function truncate(str: string, maxLength: number = 50): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Parse RWA details JSON safely
 */
export function parseRWADetails(rwaDetails?: string): any {
  if (!rwaDetails) return null;
  try {
    return JSON.parse(rwaDetails);
  } catch {
    return null;
  }
}

