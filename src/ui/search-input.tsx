import * as React from "react"
import { cn } from "./utils/ui-utils"
import { Input } from "./input"
import type { InputProps } from "./input"

export interface SearchInputProps extends InputProps {}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <Input
        className={cn(
          // Search-specific styles: 30px height, no border, special styling
          "h-[30px] border-0 bg-muted/50 focus-visible:bg-background transition-colors",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
SearchInput.displayName = "SearchInput"

export { SearchInput }
