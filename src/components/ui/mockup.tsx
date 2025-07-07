import { cn } from "@/lib/utils"
import React from "react"

interface MockupFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "small" | "default"
  children: React.ReactNode
}

export function MockupFrame({
  size = "default",
  className,
  children,
  ...props
}: MockupFrameProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[1248px] overflow-hidden rounded-xl border bg-background shadow-xl",
        size === "small" && "max-w-[800px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface MockupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "window" | "responsive"
  children: React.ReactNode
}

export function Mockup({ type = "window", className, children }: MockupProps) {
  return (
    <div className={cn("overflow-hidden", className)}>
      {type === "window" && (
        <div className="flex items-center gap-1.5 border-b bg-muted/50 px-4 py-2">
          <div className="h-2 w-2 rounded-full bg-muted-foreground/15" />
          <div className="h-2 w-2 rounded-full bg-muted-foreground/15" />
          <div className="h-2 w-2 rounded-full bg-muted-foreground/15" />
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  )
} 