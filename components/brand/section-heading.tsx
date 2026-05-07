import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  level?: "h1" | "h2" | "h3";
  variant?: "light" | "dark";
  className?: string;
  actions?: React.ReactNode;
}

/**
 * The "vertical H1 support line" — Matthews' signature brand device per PRD §7.2.5.
 * 2pt Electric Blue rule, distance from line to title = height of 2 text lines,
 * 25% of title height of breathing room above and below.
 *
 * The PRD calls this "the most reused brand device" (§7.4) and asks for it
 * at the top of every major page heading.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  level = "h2",
  variant = "light",
  className,
  actions,
}: SectionHeadingProps) {
  const Tag = level;
  const titleClass =
    level === "h1"
      ? "font-display text-4xl md:text-5xl font-black leading-[1.05] tracking-tight"
      : level === "h2"
        ? "text-2xl md:text-3xl font-bold leading-tight tracking-tight"
        : "text-xl md:text-2xl font-bold leading-tight";
  const titleColor = variant === "dark" ? "text-white" : "text-matthews-deep";
  const eyebrowColor =
    variant === "dark" ? "text-platinum/70" : "text-matthews-deep/60";
  const descColor =
    variant === "dark" ? "text-platinum/80" : "text-matthews-deep/70";

  return (
    <header
      className={cn(
        "relative pl-4 md:pl-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[2px]",
          variant === "dark" ? "bg-electric-dark" : "bg-electric-light"
        )}
      />
      <div className="space-y-2">
        {eyebrow ? (
          <p
            className={cn(
              "text-xs uppercase tracking-[0.16em] font-medium",
              eyebrowColor
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <Tag className={cn(titleClass, titleColor)}>{title}</Tag>
        {description ? (
          <p className={cn("text-sm md:text-base max-w-[65ch]", descColor)}>
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </header>
  );
}
