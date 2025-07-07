import * as React from "react"
import { cn } from "@/lib/utils"

// Interface for props that can be passed to children
interface PromptChildProps {
  value?: string
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>
  onKeyDown?: React.KeyboardEventHandler
}

const PromptInput = React.forwardRef<
  HTMLDivElement,
  Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> & {
    value: string
    onChange: React.ChangeEventHandler<HTMLTextAreaElement>
    onSubmit: () => void
  }
>(({ className, value, onChange, onSubmit, children, ...props }, ref) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border bg-background p-2",
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // Only pass props to components that expect them
          if (typeof child.type === 'string') {
            // It's a DOM element, don't pass custom props
            return child;
          } else {
            // It's a React component, pass the props
            return React.cloneElement(child as React.ReactElement<PromptChildProps>, {
              value,
              onChange,
              onKeyDown: handleKeyDown,
            })
          }
        }
        return child
      })}
    </div>
  )
})
PromptInput.displayName = "PromptInput"

// Use standard onChange instead of onValueChange
const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[60px] w-full resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
})
PromptInputTextarea.displayName = "PromptInputTextarea"

const PromptInputActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center", className)}
    {...props}
  />
))
PromptInputActions.displayName = "PromptInputActions"

export { PromptInput, PromptInputTextarea, PromptInputActions } 