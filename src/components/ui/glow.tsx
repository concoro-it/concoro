import { cn } from "@/lib/utils"

interface GlowProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "bottom" | "top"
}

export function Glow({ variant = "bottom", className }: GlowProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute select-none",
        variant === "bottom" &&
          "bottom-0 left-1/2 -translate-x-1/2 translate-y-[60%]",
        variant === "top" &&
          "left-1/2 top-0 -translate-x-1/2 -translate-y-[60%]",
        className
      )}
    >
      <div
        className={cn(
          "h-[200px] w-[600px] max-w-[600px]",
          "rounded-full bg-gradient-to-r from-blue-500 to-purple-500",
          "opacity-20 blur-[100px]"
        )}
      />
    </div>
  )
} 