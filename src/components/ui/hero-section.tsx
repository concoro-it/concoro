"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon, MapPinIcon, CalendarIcon, BuildingIcon, SearchIcon } from "lucide-react";
import { Mockup, MockupFrame } from "@/components/ui/mockup";
import { Glow } from "@/components/ui/glow";
import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface HeroAction {
  text: string;
  href: string;
  icon?: React.ReactNode;
  variant?: "default" | "glow";
}

interface HeroProps {
  badge?: {
    text: string;
    action: {
      text: string;
      href: string;
    };
  };
  title: string;
  description: string;
  actions: HeroAction[];
  image: {
    light: string;
    dark: string;
    alt: string;
  };
}

export function HeroSection({
  badge,
  title,
  description,
  actions,
  image,
}: HeroProps) {
  // TODO: Dark mode temporarily disabled - always use light image
  const imageSrc = image.light;

  return (
    <section
      className={cn(
        "bg-background text-foreground",
        "py-8 sm:py-12 px-4",
        "fade-bottom overflow-hidden pb-0"
      )}
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl max-w-2xl">
            {title}
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 max-w-2xl">
            {description}
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-3xl mt-8">
            <div className="bg-white shadow-lg rounded-lg p-4">
              <div className="flex flex-col gap-4">
                {/* Search Input */}
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search jobs by title, company, or description..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4" />
                    Località
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Scadenza
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <BuildingIcon className="h-4 w-4" />
                    Ente
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Image Preview */}
          <div className="relative w-full mt-12">
            <MockupFrame className="animate-appear opacity-0 delay-700">
              <Mockup type="window">
                <Image
                  src={imageSrc}
                  alt={image.alt}
                  width={1248}
                  height={765}
                  priority
                  className="w-full"
                />
              </Mockup>
            </MockupFrame>
            <Glow
              variant="bottom"
              className="animate-appear-zoom opacity-0 delay-1000"
            />
          </div>
        </div>
      </div>
    </section>
  );
} 