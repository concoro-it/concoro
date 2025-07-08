import { useEffect, useState } from 'react';

/**
 * Hook to defer heavy operations until after initial page load
 * This helps reduce main thread blocking during critical rendering
 */
export function useDeferredLoading(delay: number = 100): boolean {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Use multiple strategies to detect when page is ready
    let timeoutId: NodeJS.Timeout;
    let rafId: number;

    const markReady = () => {
      setIsReady(true);
    };

    // Strategy 1: Use requestIdleCallback if available (best for main thread)
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(markReady, { timeout: delay * 2 });
    } else {
      // Fallback: Use combination of RAF + timeout
      rafId = requestAnimationFrame(() => {
        timeoutId = setTimeout(markReady, delay);
      });
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [delay]);

  return isReady;
}

/**
 * Hook specifically for deferring component animations
 */
export function useDeferredAnimations(delay: number = 200): boolean {
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Don't animate if user prefers reduced motion
      return;
    }

    const timer = setTimeout(() => {
      // Additional check: only animate if page is not busy
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => setCanAnimate(true));
      } else {
        setCanAnimate(true);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return canAnimate;
}

/**
 * Hook for deferring non-critical data fetching
 */
export function useDeferredDataFetch(): boolean {
  const [canFetch, setCanFetch] = useState(false);

  useEffect(() => {
    // Wait for all critical resources to load
    const handleLoad = () => {
      // Use a longer delay for non-critical data
      setTimeout(() => setCanFetch(true), 500);
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  return canFetch;
} 