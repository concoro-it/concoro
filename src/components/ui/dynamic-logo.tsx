"use client";

import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";

interface DynamicLogoProps {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
}

export function DynamicLogo({
  lightSrc,
  darkSrc,
  alt,
  width,
  height,
  priority = false,
  className = "",
}: DynamicLogoProps) {
  // TODO: Dark mode temporarily disabled - always show light logo
  const logoSrc = lightSrc;

  /* COMMENTED OUT - Dark mode logo switching disabled
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show light logo by default during SSR and loading
  const logoSrc = mounted && resolvedTheme === "dark" ? darkSrc : lightSrc;
  */

  return (
    <Image
      src={logoSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
} 