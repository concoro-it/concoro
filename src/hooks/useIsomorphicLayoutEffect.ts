import { useEffect, useLayoutEffect } from 'react';

/**
 * A hook that uses useLayoutEffect on the client and useEffect on the server
 * to prevent hydration mismatches while maintaining performance on the client.
 */
export const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect; 