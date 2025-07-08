'use client';

import { DynamicLogo } from '@/components/ui/dynamic-logo';

export function MinimalAuthNavbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center">
          <DynamicLogo
            lightSrc="/concoro-logo-light.svg"
            darkSrc="/concoro-logo-dark.svg"
            alt="Concoro"
            width={147}
            height={33}
            priority
          />
        </div>
      </div>
    </nav>
  );
} 