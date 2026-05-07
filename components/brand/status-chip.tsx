import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Rectangle container per PRD §7.2.5 — used for tags, status chips,
 * project identifiers. Variants:
 *   - solid Electric Blue with white text
 *   - outlined Electric Blue with Electric Blue text
 *   - solid Deep Blue with white text
 * Rounded corners: 0.0625in (~4px), with slightly more inset on top than bottom.
 */
const chipVariants = cva(
  // base — slightly more top padding than bottom (PRD §7.2.5)
  "inline-flex items-center gap-1.5 rounded-[var(--radius-matthews)] text-[10px] uppercase tracking-[0.12em] font-medium leading-none whitespace-nowrap pt-[7px] pb-[5px] px-2",
  {
    variants: {
      variant: {
        electricSolid: "bg-electric-light text-white",
        electricOutline:
          "border border-electric-light text-electric-light bg-transparent",
        deepSolid: "bg-matthews-deep text-white",
        platinum: "bg-platinum text-matthews-deep",
        success: "bg-[var(--color-success)] text-white",
        warning: "bg-[var(--color-warning)] text-matthews-deep",
        danger: "bg-[var(--color-danger)] text-white",
        muted: "bg-matthews-deep/10 text-matthews-deep",
      },
    },
    defaultVariants: {
      variant: "electricOutline",
    },
  }
);

export interface StatusChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {}

export function StatusChip({
  className,
  variant,
  children,
  ...props
}: StatusChipProps) {
  return (
    <span className={cn(chipVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}

/* Tier-aware chip for the registry / project rows. */
export function TierChip({ tier }: { tier: string | null | undefined }) {
  if (!tier) return <StatusChip variant="muted">Unclassified</StatusChip>;
  const map: Record<string, "electricSolid" | "electricOutline" | "deepSolid"> =
    {
      personal: "electricOutline",
      consumer: "electricSolid",
      contributor: "deepSolid",
    };
  return (
    <StatusChip variant={map[tier] ?? "muted"}>
      {tier === "personal"
        ? "Tier 1 · Personal"
        : tier === "consumer"
          ? "Tier 2 · Consumer"
          : tier === "contributor"
            ? "Tier 3 · Contributor"
            : tier}
    </StatusChip>
  );
}

const STATUS_VARIANT: Record<string, StatusChipProps["variant"]> = {
  draft: "muted",
  submitted: "electricOutline",
  under_px_review: "electricOutline",
  eng_alignment: "electricOutline",
  approved: "electricSolid",
  in_build: "electricSolid",
  mvp_ready: "electricSolid",
  in_test: "electricSolid",
  px_signoff: "electricSolid",
  deployed: "success",
  active: "success",
  acknowledged: "success",
  needs_revision: "warning",
  rejected: "danger",
  archived: "muted",
};

export function ProjectStatusChip({ status }: { status: string }) {
  const variant = STATUS_VARIANT[status] ?? "muted";
  const label = status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Px/g, "PX")
    .replace(/Mvp/g, "MVP");
  return <StatusChip variant={variant}>{label}</StatusChip>;
}
