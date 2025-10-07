"use client"

import { useEffect } from 'react';

interface PaginationHeadProps {
  prevUrl?: string | null;
  nextUrl?: string | null;
}

/**
 * Component to inject pagination link tags into the document head
 * for SEO purposes (rel="prev" and rel="next")
 */
export function PaginationHead({ prevUrl, nextUrl }: PaginationHeadProps) {
  useEffect(() => {
    // Remove any existing prev/next links
    const existingPrev = document.querySelector('link[rel="prev"]');
    const existingNext = document.querySelector('link[rel="next"]');
    if (existingPrev) existingPrev.remove();
    if (existingNext) existingNext.remove();
    
    // Add new prev link if provided
    if (prevUrl) {
      const prevLink = document.createElement('link');
      prevLink.rel = 'prev';
      prevLink.href = prevUrl;
      document.head.appendChild(prevLink);
    }
    
    // Add new next link if provided
    if (nextUrl) {
      const nextLink = document.createElement('link');
      nextLink.rel = 'next';
      nextLink.href = nextUrl;
      document.head.appendChild(nextLink);
    }
    
    // Cleanup on unmount
    return () => {
      const prev = document.querySelector('link[rel="prev"]');
      const next = document.querySelector('link[rel="next"]');
      if (prev) prev.remove();
      if (next) next.remove();
    };
  }, [prevUrl, nextUrl]);
  
  return null; // This component doesn't render anything
}

