import { cn } from "@/lib/utils";

interface BrandLogoProps {
  variant?: "blue" | "white";
  showWordmark?: boolean;
  className?: string;
}

/**
 * Matthews™ logo lockup. Per PRD §11 Q8, official logo assets are an open
 * question, so this is a text-based placeholder that respects the brand
 * conventions: blue logo on light surfaces, white logo on dark surfaces,
 * always includes the ™ mark.
 *
 * The "M" mark variant is also used as the favicon (PRD §7.2.3).
 */
export function BrandLogo({
  variant = "blue",
  showWordmark = true,
  className,
}: BrandLogoProps) {
  const color = variant === "white" ? "text-white" : "text-matthews-deep";
  const accent =
    variant === "white" ? "text-electric-dark" : "text-electric-light";

  return (
    <div
      className={cn("flex items-center gap-2 select-none", color, className)}
    >
      <MarkM variant={variant} />
      {showWordmark ? (
        <span className="flex items-baseline gap-0.5 font-display font-black text-lg tracking-tight">
          <span>Matthews</span>
          <sup className={cn("text-[0.5em] -top-2 relative", accent)}>™</sup>
        </span>
      ) : null}
      <span className="ml-2 hidden sm:inline-block text-xs uppercase tracking-[0.18em] font-medium opacity-70">
        Builder Portal
      </span>
    </div>
  );
}

function MarkM({ variant }: { variant: "blue" | "white" }) {
  const fg = variant === "white" ? "#ffffff" : "#0e1a34";
  const bg = variant === "white" ? "#0e1a34" : "transparent";
  return (
    <svg
      viewBox="0 0 32 32"
      width="28"
      height="28"
      aria-label="Matthews"
      role="img"
    >
      <rect width="32" height="32" fill={bg} rx="4" />
      <path
        d="M5 24 V8 H9 L16 18 L23 8 H27 V24 H23 V14 L17 22 H15 L9 14 V24 Z"
        fill={fg}
      />
    </svg>
  );
}
