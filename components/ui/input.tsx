import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-[var(--radius-matthews)] border border-matthews-deep/20 bg-white px-3 py-2 text-sm text-matthews-deep placeholder:text-matthews-deep/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-light disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
