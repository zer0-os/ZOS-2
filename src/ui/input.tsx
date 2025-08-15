import * as React from "react"

import { cn } from "./utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, placeholder, onFocus, onBlur, onChange, value, ...props }, ref) => {
    const [shouldHidePlaceholder, setShouldHidePlaceholder] = React.useState(false);
    
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Hide placeholder when focusing on empty input
      const currentValue = value !== undefined ? value : e.target.value;
      if (placeholder && currentValue === "") {
        setShouldHidePlaceholder(true);
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Always show placeholder again when losing focus if input is empty
      const currentValue = value !== undefined ? value : e.target.value;
      if (currentValue === "") {
        setShouldHidePlaceholder(false);
      }
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Call the original onChange first
      onChange?.(e);
      
      // Then handle our placeholder logic
      const newValue = e.target.value;
      
      // If input becomes empty while focused, keep placeholder hidden for smooth typing
      // It will be restored on blur
      if (newValue === "" && document.activeElement === e.target) {
        setShouldHidePlaceholder(true);
      }
    };

    // For controlled inputs, use the value prop; for uncontrolled, we'll rely on the input's actual value
    const currentValue = value !== undefined ? value : '';
    
    // Show placeholder unless we should hide it AND the input is empty
    const displayPlaceholder = (shouldHidePlaceholder && currentValue === "") ? "" : placeholder;

    return (
      <input
        type={type}
        className={cn(
          // Updated default styles: 30px height (h-[30px]), no border, subtle focus ring
          "flex h-[30px] w-full rounded-md border-0 bg-background px-3 py-1 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-ring-custom disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        placeholder={displayPlaceholder}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        value={value}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
