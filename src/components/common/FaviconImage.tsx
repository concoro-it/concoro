import React from 'react';
import Image from 'next/image';

interface FaviconImageProps {
  enteName: string;
  paLink?: string;
  size?: number;
  className?: string;
  alt?: string;
}

export function FaviconImage({ 
  enteName, 
  paLink, 
  size = 16, 
  className = "",
  alt
}: FaviconImageProps) {
  const altText = alt || `Logo of ${enteName || 'entity'}`;
  
  return (
    <Image 
      src="/placeholder_icon.png"
      alt={altText}
      width={size} 
      height={size}
      className={`object-contain ${className}`}
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
} 