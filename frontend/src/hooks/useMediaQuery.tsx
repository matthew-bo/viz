import { useState, useEffect } from 'react';

/**
 * useMediaQuery - Hook for responsive breakpoint detection
 * 
 * Usage:
 * const isMobile = useMediaQuery('(max-width: 1023px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 * const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // Server-side rendering guard
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    // Update state
    const updateMatch = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', updateMatch);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', updateMatch);
    };
  }, [query]);

  return matches;
}

/**
 * Convenience hooks for common breakpoints (Tailwind defaults)
 */

// Mobile: < 1024px
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 1023px)');
}

// Tablet: 768px - 1023px
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

// Desktop: >= 1024px
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

// Small mobile: < 640px
export function useIsSmallMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

// Accessibility: Prefers reduced motion
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

// Touch device detection
export function useIsTouchDevice(): boolean {
  return useMediaQuery('(hover: none) and (pointer: coarse)');
}

