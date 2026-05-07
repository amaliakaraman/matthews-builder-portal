import { Check, Clock } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
import { titleCase } from "@/lib/utils";

interface TimelineProps {
  milestones: Array<{
    id: string;
    type: string;
    completedAt: string | null;
    notes: string | null;
    createdAt: string;
  }>;
  currentStatus: string;
  tier: string | null;
}

const FULL_FLOW = [
  "submitted",
  "px_review",
  "eng_alignment",
  "approved",
  "mvp_ready",
  "test_started",
  "px_signoff",
  "deployed",
];

const FLOW_BY_TIER: Record<string, string[]> = {
  personal: ["approved"], // personal projects skip review
  consumer: [
    "submitted",
    "px_review",
    "approved",
    "mvp_ready",
    "test_started",
    "px_signoff",
    "deployed",
  ],
  contributor: FULL_FLOW,
};

export function Timeline({ milestones, tier }: TimelineProps) {
  const flow = (tier && FLOW_BY_TIER[tier]) ?? FULL_FLOW;
  const completedTypes = new Set(
    milestones.filter((m) => m.completedAt).map((m) => m.type)
  );

  return (
    <div>
      <h3 className="text-xs uppercase tracking-[0.14em] text-matthews-deep/55 mb-3">
        Timeline
      </h3>
      <ol className="relative border-l border-matthews-deep/10 pl-6 space-y-5">
        {flow.map((step) => {
          const milestone = milestones.find((m) => m.type === step);
          const done = completedTypes.has(step);
          return (
            <li key={step} className="relative">
              <span
                aria-hidden
                className={cn(
                  "absolute -left-[34px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2",
                  done
                    ? "bg-electric-light border-electric-light text-white"
                    : "bg-white border-matthews-deep/20 text-matthews-deep/40"
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2} />
                ) : (
                  <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                )}
              </span>
              <p className="text-sm font-medium text-matthews-deep">
                {titleCase(step)}
              </p>
              {milestone ? (
                <p className="text-xs text-matthews-deep/60">
                  {milestone.completedAt
                    ? `Completed ${formatRelative(milestone.completedAt)}`
                    : `Logged ${formatRelative(milestone.createdAt)}`}
                </p>
              ) : (
                <p className="text-xs text-matthews-deep/40">Not yet</p>
              )}
              {milestone?.notes ? (
                <p className="mt-1 text-xs text-matthews-deep/70 max-w-prose">
                  {milestone.notes}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
