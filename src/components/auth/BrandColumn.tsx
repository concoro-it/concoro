'use client';

import React, { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/ui/animated-beam";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export function BrandColumn() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <div className="hidden lg:flex lg:w-1/2 bg-[#0A1F44] items-center justify-center relative overflow-hidden">

      <div className="absolute inset-0 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,#1a3a6b,transparent_70%)] before:opacity-40" />
      
      <div
        className="absolute inset-0 flex items-center justify-center"
        ref={containerRef}
      >
        <div className="flex size-full flex-col max-w-lg max-h-[200px] items-stretch justify-between gap-10">
          <div className="flex flex-row items-center justify-between">
            <Circle ref={div1Ref}>
              <img src="/icons/milano.svg" alt="Icon 1" className="w-6 h-6" />
            </Circle>
            <Circle ref={div5Ref}>
              <img src="/icons/roma.svg" alt="Icon 5" className="w-6 h-6" />
            </Circle>
          </div>
          <div className="flex flex-row items-center justify-between">
            <Circle ref={div2Ref}>
              <img src="/icons/inpa.svg" alt="Icon 2" className="w-6 h-6" />
            </Circle>
            <Circle ref={div4Ref} className="size-16">
              <img src="/icons/concoro.svg" alt="Icon 4" className="w-8 h-8" />
            </Circle>
            <Circle ref={div6Ref}>
              <img src="/icons/agenzia.svg" alt="Icon 6" className="w-6 h-6" />
            </Circle>
          </div>
          <div className="flex flex-row items-center justify-between">
            <Circle ref={div3Ref}>
              <img src="/icons/inps.svg" alt="Icon 3" className="w-6 h-6" />
            </Circle>
            <Circle ref={div7Ref}>
              <img src="/icons/ferrovie.svg" alt="Icon 7" className="w-6 h-6" />
            </Circle>
          </div>
        </div>

        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div1Ref}
          toRef={div4Ref}
          curvature={-75}
          endYOffset={-10}
          pathColor="rgba(255,255,255,0.2)"
          gradientStartColor="#4a90e2"
          gradientStopColor="#1a3a6b"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div2Ref}
          toRef={div4Ref}
          pathColor="rgba(255,255,255,0.2)"
          gradientStartColor="#4a90e2"
          gradientStopColor="#1a3a6b"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div3Ref}
          toRef={div4Ref}
          curvature={75}
          endYOffset={10}
          pathColor="rgba(255,255,255,0.2)"
          gradientStartColor="#4a90e2"
          gradientStopColor="#1a3a6b"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div5Ref}
          toRef={div4Ref}
          curvature={-75}
          endYOffset={-10}
          reverse
          pathColor="rgba(255,255,255,0.2)"
          gradientStartColor="#4a90e2"
          gradientStopColor="#1a3a6b"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div6Ref}
          toRef={div4Ref}
          reverse
          pathColor="rgba(255,255,255,0.2)"
          gradientStartColor="#4a90e2"
          gradientStopColor="#1a3a6b"
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={div7Ref}
          toRef={div4Ref}
          curvature={75}
          endYOffset={10}
          reverse
          pathColor="rgba(255,255,255,0.2)"
          gradientStartColor="#4a90e2"
          gradientStopColor="#1a3a6b"
        />
      </div>
    </div>
  );
} 