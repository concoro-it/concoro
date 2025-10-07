'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/lib/hooks/useAuth';
import { LazyAuthProvider } from '@/lib/hooks/useLazyAuth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pages that require full Firebase Auth immediately
  const requiresImmediateAuth = 
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

  // Prevent hydration mismatch by not rendering theme provider until mounted
  if (!mounted) {
    return (
      <LazyAuthProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </LazyAuthProvider>
    );
  }

  const AuthWrapper = requiresImmediateAuth ? AuthProvider : LazyAuthProvider;

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="concoro-theme"
    >
      <AuthWrapper>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </AuthWrapper>
    </ThemeProvider>
  );
} 