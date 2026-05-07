import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[88px] w-full rounded-[var(--radius-matthews)] border border-matthews-deep/20 bg-white px-3 py-2 text-sm text-matthews-deep placeholder:text-matthews-deep/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-light disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
