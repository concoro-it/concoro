"use client"

import { FaviconDebug } from '@/components/debug/FaviconDebug';
import { SimpleFaviconTest } from '@/components/debug/SimpleFaviconTest';

export default function DebugFaviconPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Favicon Caching System Debug</h1>
      
      {/* Simple upload test first */}
      <SimpleFaviconTest />
      
      {/* Full favicon caching system test */}
      <FaviconDebug />
    </div>
  );
}