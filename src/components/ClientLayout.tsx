'use client';

import { usePathname } from 'next/navigation';
import { Inter } from 'next/font/google';
import { Providers } from '@/app/providers';
import Navbar from '@/components/ui/navbar';
import LightweightNavbar from '@/components/ui/lightweight-navbar';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { AlertCookieNotice } from '@/components/ui/alert-cookie-notice';
import { Suspense, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/signin') || 
                     pathname?.startsWith('/signup') || 
                     pathname?.startsWith('/reset-password') ||
                     pathname?.startsWith('/verify-email');

  // Pages that require full Firebase Auth immediately (same logic as Providers)
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

  // Pages that should use the full navbar (includes bandi pages for auth-aware UI)
  const useFullNavbar = requiresFullAuth || pathname?.startsWith('/bandi');

  // Use full navbar for auth-aware pages, lightweight for public pages
  const NavbarComponent = useFullNavbar ? Navbar : LightweightNavbar;



  return (
    <ErrorBoundary>
      <div className={inter.className}>
        <Providers>
          {!isAuthRoute && (
            <ErrorBoundary>
              <Suspense fallback={<div className="h-16 bg-background border-b" />}>
                <NavbarComponent />
              </Suspense>
            </ErrorBoundary>
          )}
          <div className="pb-16 md:pb-0">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
          {!isAuthRoute && (
            <Suspense fallback={<div className="h-16 bg-white border-t fixed bottom-0 left-0 right-0 md:hidden"></div>}>
              <ErrorBoundary>
                <MobileBottomNav />
              </ErrorBoundary>
            </Suspense>
          )}
          {/* Cookie Consent Banner - appears on all pages */}
          <ErrorBoundary>
            <AlertCookieNotice />
          </ErrorBoundary>
        </Providers>
      </div>
    </ErrorBoundary>
  );
} 