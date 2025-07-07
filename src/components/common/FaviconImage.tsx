import React from 'react';
import Image from 'next/image';
import { useFaviconURL } from '@/lib/services/faviconCache';

interface FaviconImageProps {
  enteName: string;
  paLink?: string;
  size?: number;
  className?: string;
  alt?: string;
  showLoading?: boolean;
}

export function FaviconImage({ 
  enteName, 
  paLink, 
  size = 16, 
  className = "",
  alt,
  showLoading = true
}: FaviconImageProps) {
  const { faviconURL, isLoading } = useFaviconURL(enteName, paLink);
  
  const altText = alt || `Logo of ${enteName || 'entity'}`;
  
  if (showLoading && isLoading) {
    return (
      <div 
        className={`bg-gray-200 rounded animate-pulse ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  
  return (
    <Image 
      src={faviconURL}
      alt={altText}
      width={size} 
      height={size}
      className={`object-contain ${className}`}
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
} 