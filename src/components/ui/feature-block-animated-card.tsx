"use client"

import { animate, motion } from "framer-motion"
import React, { useEffect } from "react"
import { cn } from "@/lib/utils"

export interface AnimatedCardProps {
  className?: string
  title?: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  iconClassName?: string
}

export function AnimatedCard({ className, title, description, icon, iconClassName }: AnimatedCardProps) {
  return (
    <div
      className={cn(
        "max-w-sm w-full mx-auto p-6 rounded-xl border border-[rgba(255,255,255,0.10)] dark:bg-[rgba(40,40,40,0.70)] bg-gray-100 shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset] group h-[420px] relative flex flex-col  ",
        className
      )}
    >
      {/* Icon in top right corner */}
      {icon && (
        <div className="absolute top-4 right-4 z-50">
          <Container className={cn("h-14 w-14 circle-1", iconClassName)}>
            {icon}
          </Container>
        </div>
      )}
      
      {/* Spacer for top area */}
      <div className="h-20 flex-shrink-0"></div>
      
             {/* Content area */}
       <div className="flex-1 flex flex-col justify-end pr-16 pb-2">
         <div className="space-y-4">
           {title && (
             <div className="text-lg font-semibold text-gray-800 dark:text-white leading-tight">
               {title}
             </div>
           )}
           {description && (
             <div className="text-sm font-normal text-neutral-600 dark:text-neutral-400 leading-relaxed">
               {description}
             </div>
           )}
         </div>
       </div>
    </div>
  )
}

// Icon animation effect
function setupIconAnimation() {
  useEffect(() => {
    const sequence = [
      ".circle-1",
      { scale: [1, 1.1, 1], y: [0, -4, 0] },
      { duration: 2, repeat: Infinity, repeatDelay: 1 },
    ]

    animate(sequence[0] as string, sequence[1] as any, sequence[2] as any)
  }, [])
}

const Container = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      `rounded-full flex items-center justify-center bg-[rgba(248,248,248,0.01)]
      shadow-[0px_0px_8px_0px_rgba(248,248,248,0.25)_inset,0px_32px_24px_-16px_rgba(0,0,0,0.40)]`,
      className
    )}
    {...props}
  />
))
Container.displayName = "Container"



