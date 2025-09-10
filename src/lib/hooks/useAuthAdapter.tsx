"use client"

import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLazyAuth } from '@/lib/hooks/useLazyAuth';

/**
 * Adapter hook that automatically chooses between full auth and lazy auth
 * based on the current route
 */
export function useAuthAdapter() {
  const pathname = usePathname();
  
  // Pages that require full Firebase Auth immediately
  const requiresFullAuth = 
    pathname?.startsWith('/signin') || 
    pathname?.startsWith('/signup') || 
    pathname?.startsWith('/reset-password') ||
    pathname?.startsWith('/verify-email') ||
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/chat') ||
    pathname?.startsWith('/settings') ||
    pathname?.startsWith('/profile') ||
    pathname?.startsWith('/basic-info') ||
    pathname?.startsWith('/setup-profile') ||
    pathname?.startsWith('/saved-concorsi') ||
    pathname?.startsWith('/preferenze-lavorative') ||
    pathname?.startsWith('/notifiche');

  // Always call both hooks (unconditionally)
  const fullAuthResult = useAuth();
  const lazyAuthResult = useLazyAuth();

  // Return the appropriate auth hook based on route
  if (requiresFullAuth) {
    // Add default values for compatibility with lazy auth
    return {
      ...fullAuthResult,
      isAuthLoaded: true,
      initializeAuth: async () => {}, // No-op for full auth
    };
  } else {
    return lazyAuthResult;
  }
}
