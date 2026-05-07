"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-[var(--radius-matthews)] border border-matthews-deep/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-light disabled:opacity-50 data-[state=checked]:bg-electric-light data-[state=checked]:border-electric-light data-[state=checked]:text-white",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center">
      <Check className="h-3.5 w-3.5" strokeWidth={2} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";
