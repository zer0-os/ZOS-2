import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "./utils/ui-utils"

const superButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-transparent border border-primary text-primary hover:bg-primary/10 [text-shadow:0_0_8px_hsl(var(--primary)/0.3)]",
        filled: "bg-primary text-primary-foreground hover:bg-primary/90 [text-shadow:0_0_8px_hsl(var(--primary)/0.5)]",
        ghost: "hover:bg-primary/10 hover:text-primary hover:[text-shadow:0_0_8px_hsl(var(--primary)/0.3)]",
        outline: "border border-primary bg-transparent text-primary hover:bg-primary hover:text-primary-foreground [text-shadow:0_0_8px_hsl(var(--primary)/0.3)] hover:[text-shadow:none]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        custom: "px-4 py-2",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface SuperButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof superButtonVariants> {
  asChild?: boolean
}

const SuperButton = React.forwardRef<HTMLButtonElement, SuperButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(superButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
SuperButton.displayName = "SuperButton"

export { SuperButton, superButtonVariants }
