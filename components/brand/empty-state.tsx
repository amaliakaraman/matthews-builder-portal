import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  variant?: "light" | "dark";
  className?: string;
}

/**
 * Empty state per PRD §7.3 — Kallisto headline (Satoshi Black fallback),
 * Satoshi explanatory copy, Electric Blue CTA button.
 */
export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
  variant = "light",
  className,
}: EmptyStateProps) {
  const dark = variant === "dark";
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6 rounded-[var(--radius-matthews)]",
        dark ? "bg-matthews-deep text-white" : "bg-platinum text-matthews-deep",
        className
      )}
    >
      <h3 className="font-display text-3xl md:text-4xl font-black tracking-tight max-w-xl">
        {title}
      </h3>
      {description ? (
        <p
          className={cn(
            "mt-3 text-sm max-w-md",
            dark ? "text-platinum/80" : "text-matthews-deep/70"
          )}
        >
          {description}
        </p>
      ) : null}
      {ctaLabel && ctaHref ? (
        <Button
          asChild
          variant={dark ? "primaryDark" : "primary"}
          className="mt-6"
        >
          <Link href={ctaHref}>{ctaLabel} →</Link>
        </Button>
      ) : null}
    </div>
  );
}
