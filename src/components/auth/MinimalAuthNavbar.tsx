'use client';

import { DynamicLogo } from '@/components/ui/dynamic-logo';

export function MinimalAuthNavbar() {
  return (
    <div className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
        {/* Non-clickable logo */}
        <div className="flex items-center">
          <DynamicLogo className="h-8 w-auto" />
        </div>
        
        {/* Empty space for balance */}
        <div></div>
      </div>
    </div>
  );
} 