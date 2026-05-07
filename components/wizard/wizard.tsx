"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeading } from "@/components/brand/section-heading";
import { TierChip } from "@/components/brand/status-chip";
import { classify, isComplete } from "@/lib/classification/classify";
import { AUDIENCE_LABELS, TIER_DESCRIPTIONS } from "@/lib/db/types";
import {
  EMPTY_STATE,
  WIZARD_QUESTIONS,
  type WizardState,
  type WizardStep,
} from "./wizard-types";
import { saveDraftAction, submitWizardAction } from "@/lib/projects/wizard-server";

interface WizardProps {
  departments: Array<{ id: string; name: string }>;
  sponsors: Array<{ audienceType: string; name: string }>;
  draft: {
    id: string;
    name: string;
    description: string | null;
    problemStatement: string | null;
    expectedUsers: string | null;
    scopingDocsUrl: string | null;
    intendedStartDate: string | null;
    productOwnerDeptId: string | null;
    audienceType: string | null;
    intakeAnswers: object;
  } | null;
}

export function Wizard({ departments, sponsors, draft }: WizardProps) {
  const initial: WizardState = useMemo(() => {
    if (!draft) return EMPTY_STATE;
    return {
      draftId: draft.id,
      answers: (draft.intakeAnswers as WizardState["answers"]) ?? {},
      productOwnerDeptId: draft.productOwnerDeptId,
      audienceType: draft.audienceType,
      metadata: {
        name: draft.name,
        description: draft.description ?? "",
        problemStatement: draft.problemStatement ?? "",
        expectedUsers: draft.expectedUsers ?? "",
        intendedStartDate: draft.intendedStartDate ?? "",
        scopingDocsUrl: draft.scopingDocsUrl ?? "",
      },
      acknowledged: false,
    };
  }, [draft]);

  const [state, setState] = useState<WizardState>(initial);
  const [step, setStep] = useState<WizardStep>(1);
  const [pending, startTransition] = useTransition();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const result = useMemo(() => classify(state.answers), [state.answers]);
  const showPlatformInterrupt =
    result.edge_case === "PLATFORM_FEATURE_WORK" && step === 1;
  const showUnclearInterrupt =
    result.edge_case === "UNCLEAR_ROUTE_TO_PX" &&
    step === 1 &&
    isComplete(state.answers);

  const sponsorByAudience = useMemo(
    () => Object.fromEntries(sponsors.map((s) => [s.audienceType, s.name])),
    [sponsors]
  );

  function setAnswer(key: keyof WizardState["answers"], value: boolean) {
    setState((s) => ({
      ...s,
      answers: { ...s.answers, [key]: value },
    }));
  }

  function canAdvance(): boolean {
    if (step === 1) {
      // Need either a tier or a final edge_case before progressing.
      // Allow advance if: classification is complete (any of personal/consumer/contributor)
      // and not blocked on PLATFORM_FEATURE_WORK.
      if (result.edge_case === "PLATFORM_FEATURE_WORK") return false;
      // Personal projects may skip Owner/Sponsor; we still allow them through but
      // we'll handle that in steps 2/3 by showing them as optional.
      return result.complete;
    }
    if (step === 2) {
      if (result.tier === "personal") return true;
      return !!state.productOwnerDeptId;
    }
    if (step === 3) {
      if (result.tier === "personal") return true;
      return !!state.audienceType;
    }
    if (step === 4) {
      return state.metadata.name.trim().length > 0;
    }
    if (step === 5) {
      return state.acknowledged;
    }
    return false;
  }

  async function onSaveDraft() {
    setStatusMsg(null);
    setErrorMsg(null);
    startTransition(async () => {
      const res = await saveDraftAction({
        draftId: state.draftId,
        answers: state.answers,
        productOwnerDeptId: state.productOwnerDeptId,
        audienceType: state.audienceType,
        metadata: {
          name: state.metadata.name,
          description: state.metadata.description || null,
          problemStatement: state.metadata.problemStatement || null,
          expectedUsers: state.metadata.expectedUsers || null,
          intendedStartDate: state.metadata.intendedStartDate || null,
          scopingDocsUrl: state.metadata.scopingDocsUrl || null,
        },
        acknowledged: false,
      });
      if (res.ok) {
        setStatusMsg("Draft saved.");
        setState((s) => ({ ...s, draftId: res.projectId ?? s.draftId }));
      } else {
        setErrorMsg(res.error ?? "Could not save draft.");
      }
    });
  }

  async function onSubmit() {
    setStatusMsg(null);
    setErrorMsg(null);
    startTransition(async () => {
      const res = await submitWizardAction({
        draftId: state.draftId,
        answers: state.answers,
        productOwnerDeptId:
          result.tier === "personal" ? null : state.productOwnerDeptId,
        audienceType:
          result.tier === "personal" ? null : state.audienceType,
        metadata: {
          name: state.metadata.name,
          description: state.metadata.description || null,
          problemStatement: state.metadata.problemStatement || null,
          expectedUsers: state.metadata.expectedUsers || null,
          intendedStartDate: state.metadata.intendedStartDate || null,
          scopingDocsUrl: state.metadata.scopingDocsUrl || null,
        },
        acknowledged: state.acknowledged,
      });
      if (res && !res.ok) {
        setErrorMsg(res.error ?? "Could not submit.");
      }
    });
  }

  const stepTitles = [
    "Classification",
    "Product Owner",
    "Executive Sponsor",
    "Project details",
    "Review & submit",
  ];

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow={`Step ${step} of 5 · ${stepTitles[step - 1]}`}
        title="Register a project"
        description="The wizard resolves three independent dimensions — classification, product owner, executive sponsor — and captures the metadata PX needs to triage your build."
        level="h1"
      />

      {/* Progress bar — Electric Blue fill on Platinum Grey track (PRD §7.3) */}
      <div className="h-1.5 w-full bg-platinum rounded-full overflow-hidden">
        <div
          className="h-full bg-electric-light transition-all duration-300"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      {/* Edge case interrupt panels (PRD §7.3) */}
      {showPlatformInterrupt ? (
        <PlatformFeatureInterrupt
          onBack={() => setAnswer("new_schema", false)}
        />
      ) : showUnclearInterrupt ? (
        <UnclearInterrupt onBack={() => setStep(1)} />
      ) : (
        <>
          {step === 1 ? (
            <Step1Classification
              answers={state.answers}
              setAnswer={setAnswer}
              tier={result.tier}
              complete={result.complete}
              rationale={result.rationale}
            />
          ) : null}
          {step === 2 ? (
            <Step2ProductOwner
              departments={departments}
              value={state.productOwnerDeptId}
              onChange={(v) =>
                setState((s) => ({ ...s, productOwnerDeptId: v }))
              }
              tierIsPersonal={result.tier === "personal"}
            />
          ) : null}
          {step === 3 ? (
            <Step3Sponsor
              audiences={Object.keys(AUDIENCE_LABELS)}
              sponsorByAudience={sponsorByAudience}
              value={state.audienceType}
              onChange={(v) => setState((s) => ({ ...s, audienceType: v }))}
              tierIsPersonal={result.tier === "personal"}
            />
          ) : null}
          {step === 4 ? (
            <Step4Metadata
              metadata={state.metadata}
              onChange={(m) =>
                setState((s) => ({ ...s, metadata: { ...s.metadata, ...m } }))
              }
            />
          ) : null}
          {step === 5 ? (
            <Step5Review
              state={state}
              departments={departments}
              sponsorByAudience={sponsorByAudience}
              tier={result.tier}
              rationale={result.rationale}
              acknowledged={state.acknowledged}
              onAcknowledge={(ack) =>
                setState((s) => ({ ...s, acknowledged: ack }))
              }
            />
          ) : null}
        </>
      )}

      {statusMsg ? (
        <p className="text-sm text-matthews-deep/70" role="status">
          {statusMsg}
        </p>
      ) : null}
      {errorMsg ? (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {errorMsg}
        </p>
      ) : null}

      {!showPlatformInterrupt && !showUnclearInterrupt ? (
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-matthews-deep/10">
          <Button
            variant="ghost"
            onClick={onSaveDraft}
            disabled={pending || !state.metadata.name}
            type="button"
          >
            <Save className="h-4 w-4" strokeWidth={1.5} />
            Save draft and exit
          </Button>
          <div className="flex items-center gap-2">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep((s) => (s - 1) as WizardStep)}
                disabled={pending}
                type="button"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                Back
              </Button>
            ) : null}
            {step < 5 ? (
              <Button
                disabled={!canAdvance() || pending}
                onClick={() => setStep((s) => (s + 1) as WizardStep)}
                type="button"
              >
                Continue
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            ) : (
              <Button
                disabled={!canAdvance() || pending}
                onClick={onSubmit}
                type="button"
              >
                {pending ? "Submitting…" : "Submit project"}
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {/* Live tier indicator for context (only when classification is partial/complete) */}
      {step === 1 && (result.tier || result.complete) ? (
        <div className="flex items-center gap-3 text-sm text-matthews-deep/80">
          <span className="text-xs uppercase tracking-[0.14em] text-matthews-deep/50">
            Current classification
          </span>
          <TierChip tier={result.tier ?? null} />
          <span>{result.rationale}</span>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Steps ---------- */

function Step1Classification({
  answers,
  setAnswer,
  tier,
  complete,
  rationale,
}: {
  answers: WizardState["answers"];
  setAnswer: (key: keyof WizardState["answers"], v: boolean) => void;
  tier: string | null;
  complete: boolean;
  rationale: string;
}) {
  const groups: Array<{ id: "audience" | "data" | "process"; title: string }> =
    [
      { id: "audience", title: "Audience" },
      { id: "data", title: "Data behavior" },
      { id: "process", title: "Process" },
    ];
  return (
    <div className="space-y-10">
      {groups.map((g) => (
        <div key={g.id} className="space-y-4">
          <h3 className="text-xs uppercase tracking-[0.14em] text-matthews-deep/60">
            {g.title}
          </h3>
          <div className="space-y-3">
            {WIZARD_QUESTIONS.filter((q) => q.group === g.id).map((q) => (
              <YesNoQuestion
                key={q.key}
                prompt={q.prompt}
                helper={q.helper}
                value={answers[q.key] ?? null}
                onChange={(v) => setAnswer(q.key, v)}
              />
            ))}
          </div>
        </div>
      ))}
      {complete && tier ? (
        <div className="rounded-[var(--radius-matthews)] bg-platinum p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-matthews-deep/60">
            Classification preview
          </p>
          <div className="mt-2 flex items-start gap-3">
            <TierChip tier={tier} />
            <p className="text-sm text-matthews-deep/80 max-w-xl">{rationale}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function YesNoQuestion({
  prompt,
  helper,
  value,
  onChange,
}: {
  prompt: string;
  helper?: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-[var(--radius-matthews)] border border-matthews-deep/10 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium text-matthews-deep">{prompt}</p>
        {helper ? (
          <p className="mt-1 text-xs text-matthews-deep/60">{helper}</p>
        ) : null}
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          type="button"
          variant={value === true ? "primary" : "outline"}
          size="sm"
          onClick={() => onChange(true)}
        >
          Yes
        </Button>
        <Button
          type="button"
          variant={value === false ? "secondary" : "outline"}
          size="sm"
          onClick={() => onChange(false)}
        >
          No
        </Button>
      </div>
    </div>
  );
}

function Step2ProductOwner({
  departments,
  value,
  onChange,
  tierIsPersonal,
}: {
  departments: Array<{ id: string; name: string }>;
  value: string | null;
  onChange: (v: string | null) => void;
  tierIsPersonal: boolean;
}) {
  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-base font-medium text-matthews-deep">
        What is the primary job this product performs?
      </p>
      <p className="text-sm text-matthews-deep/70 max-w-xl">
        Ownership follows function — not who built it. A marketing tool built
        by an agent is still owned by Marketing. PX may reassign if the answer
        doesn't match the dominant job.
      </p>
      {tierIsPersonal ? (
        <p className="text-sm text-matthews-deep/60 italic">
          Personal projects don't have a Product Owner. You can skip this step.
        </p>
      ) : null}
      <div className="max-w-md">
        <Label htmlFor="po">Owning department</Label>
        <Select value={value ?? undefined} onValueChange={(v) => onChange(v)}>
          <SelectTrigger id="po" className="mt-2">
            <SelectValue placeholder="Select a department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function Step3Sponsor({
  audiences,
  sponsorByAudience,
  value,
  onChange,
  tierIsPersonal,
}: {
  audiences: string[];
  sponsorByAudience: Record<string, string>;
  value: string | null;
  onChange: (v: string | null) => void;
  tierIsPersonal: boolean;
}) {
  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-base font-medium text-matthews-deep">
        Who are the primary people interfacing with this product?
      </p>
      <p className="text-sm text-matthews-deep/70 max-w-xl">
        The Executive Sponsor for that audience holds deployment sign-off
        authority for projects directed at them.
      </p>
      {tierIsPersonal ? (
        <p className="text-sm text-matthews-deep/60 italic">
          Personal projects don't require an Executive Sponsor. You can skip
          this step.
        </p>
      ) : null}
      <div className="max-w-md">
        <Label htmlFor="aud">Primary audience</Label>
        <Select value={value ?? undefined} onValueChange={(v) => onChange(v)}>
          <SelectTrigger id="aud" className="mt-2">
            <SelectValue placeholder="Select an audience" />
          </SelectTrigger>
          <SelectContent>
            {audiences.map((a) => (
              <SelectItem key={a} value={a}>
                {AUDIENCE_LABELS[a] ?? a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {value ? (
        <div className="rounded-[var(--radius-matthews)] bg-platinum p-4 text-sm text-matthews-deep/80">
          <span className="text-xs uppercase tracking-[0.14em] text-matthews-deep/60 block mb-1">
            Resolved sponsor
          </span>
          {sponsorByAudience[value] ?? "No sponsor assigned for this audience yet."}
        </div>
      ) : null}
    </div>
  );
}

function Step4Metadata({
  metadata,
  onChange,
}: {
  metadata: WizardState["metadata"];
  onChange: (patch: Partial<WizardState["metadata"]>) => void;
}) {
  return (
    <div className="grid gap-5 max-w-3xl">
      <div className="space-y-2">
        <Label htmlFor="name">Project name</Label>
        <Input
          id="name"
          required
          value={metadata.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">One-sentence description</Label>
        <Input
          id="description"
          value={metadata.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="What does this product do?"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="problem">Problem statement</Label>
        <Textarea
          id="problem"
          value={metadata.problemStatement}
          onChange={(e) => onChange({ problemStatement: e.target.value })}
          placeholder="What problem does this solve, and for whom?"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="users">Expected users</Label>
          <Input
            id="users"
            value={metadata.expectedUsers}
            onChange={(e) => onChange({ expectedUsers: e.target.value })}
            placeholder="e.g. Underwriting analysts (~25 people)"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start">Intended start date</Label>
          <Input
            id="start"
            type="date"
            value={metadata.intendedStartDate}
            onChange={(e) => onChange({ intendedStartDate: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="docs">Existing scoping docs (URL)</Label>
        <Input
          id="docs"
          type="url"
          value={metadata.scopingDocsUrl}
          onChange={(e) => onChange({ scopingDocsUrl: e.target.value })}
          placeholder="https://…"
        />
      </div>
    </div>
  );
}

function Step5Review({
  state,
  departments,
  sponsorByAudience,
  tier,
  rationale,
  acknowledged,
  onAcknowledge,
}: {
  state: WizardState;
  departments: Array<{ id: string; name: string }>;
  sponsorByAudience: Record<string, string>;
  tier: string | null;
  rationale: string;
  acknowledged: boolean;
  onAcknowledge: (v: boolean) => void;
}) {
  const dept = departments.find((d) => d.id === state.productOwnerDeptId);
  const requirements: string[] = [];
  if (tier === "consumer") {
    requirements.push("Use approved Matthews tools, accounts, and brand standards.");
    requirements.push("Ship an MVP to a test audience before broad rollout.");
    requirements.push("PX coach will be assigned for early direction.");
  } else if (tier === "contributor") {
    requirements.push("Engineering alignment is required before build can start.");
    requirements.push("PX, PM, design, and engineering coordinator will be assigned.");
    requirements.push("MVP must be reviewed and signed off before broad rollout.");
  } else if (tier === "personal") {
    requirements.push("Self-serve. PX won't review or coach this project.");
    requirements.push("Don't share with teammates without re-registering at the right tier.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-5">
        <SectionHeading
          title={state.metadata.name || "Untitled project"}
          description={state.metadata.description || undefined}
          level="h3"
        />
        {state.metadata.problemStatement ? (
          <p className="text-sm text-matthews-deep/80 max-w-xl">
            {state.metadata.problemStatement}
          </p>
        ) : null}
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <Pair label="Tier" value={tier ?? "Unclassified"} />
          <Pair
            label="Product Owner"
            value={
              tier === "personal" ? "—" : (dept?.name ?? "Not selected")
            }
          />
          <Pair
            label="Executive Sponsor"
            value={
              tier === "personal"
                ? "—"
                : (state.audienceType
                    ? `${AUDIENCE_LABELS[state.audienceType] ?? state.audienceType} · ${sponsorByAudience[state.audienceType] ?? "TBD"}`
                    : "Not selected")
            }
          />
          <Pair
            label="Expected users"
            value={state.metadata.expectedUsers || "—"}
          />
          <Pair
            label="Intended start"
            value={state.metadata.intendedStartDate || "—"}
          />
          <Pair
            label="Scoping docs"
            value={state.metadata.scopingDocsUrl || "—"}
          />
        </dl>
        {requirements.length > 0 ? (
          <div className="rounded-[var(--radius-matthews)] bg-platinum p-5">
            <h4 className="text-xs uppercase tracking-[0.14em] text-matthews-deep/60 mb-3">
              What's required of you
            </h4>
            <ul className="space-y-1.5 text-sm">
              {requirements.map((r) => (
                <li key={r} className="flex gap-2">
                  <span aria-hidden className="text-electric-light">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <label className="flex items-start gap-3 text-sm text-matthews-deep/80 max-w-xl">
          <Checkbox
            checked={acknowledged}
            onCheckedChange={(v) => onAcknowledge(Boolean(v))}
          />
          <span>
            I confirm the answers above are accurate and I'll meet the
            tier-specific requirements listed. PX may reclassify if the project
            scope changes.
          </span>
        </label>
      </div>
      <aside className="surface-deep p-5 rounded-[var(--radius-matthews)]">
        <h4 className="font-display text-lg font-black mb-2">
          {tier ? `Tier: ${tier}` : "Awaiting classification"}
        </h4>
        <p className="text-sm text-platinum/85">{rationale}</p>
        {tier ? (
          <p className="mt-4 text-xs text-platinum/70">
            {TIER_DESCRIPTIONS[tier]}
          </p>
        ) : null}
      </aside>
    </div>
  );
}

function Pair({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-matthews-deep/55">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-matthews-deep">{value}</dd>
    </div>
  );
}

/* ---------- Edge-case interrupts (PRD §7.3) ---------- */

function PlatformFeatureInterrupt({ onBack }: { onBack: () => void }) {
  return (
    <div className="surface-deep rounded-[var(--radius-matthews)] p-10 md:p-14 text-center max-w-3xl mx-auto">
      <p className="text-xs uppercase tracking-[0.18em] text-platinum/70 mb-3">
        This isn't a citizen build
      </p>
      <h2 className="font-display text-3xl md:text-4xl font-black text-white tracking-tight">
        Looks like you need platform feature work first.
      </h2>
      <p className="mt-4 text-platinum/85 max-w-xl mx-auto">
        Adding new schema to Artemis isn't something a citizen builder ships —
        the platform team needs to scope and ship that capability before any
        dependent app can be built. We'll route you to the platform feature
        request path. Once the schema lands, come back here to register the
        consumer or contributor app on top.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild variant="primaryDark">
          <a href="mailto:platform@matthews.com?subject=Platform%20feature%20request">
            Request platform feature
          </a>
        </Button>
        <Button variant="outlineDark" onClick={onBack}>
          I answered "new schema" by mistake — go back
        </Button>
      </div>
    </div>
  );
}

function UnclearInterrupt({ onBack }: { onBack: () => void }) {
  return (
    <div className="surface-deep rounded-[var(--radius-matthews)] p-10 md:p-14 text-center max-w-3xl mx-auto">
      <p className="text-xs uppercase tracking-[0.18em] text-platinum/70 mb-3">
        Heads up
      </p>
      <h2 className="font-display text-3xl md:text-4xl font-black text-white tracking-tight">
        Your answers don't cleanly match a tier.
      </h2>
      <p className="mt-4 text-platinum/85 max-w-xl mx-auto">
        That's fine — submit anyway and PX will help classify this manually.
        We'll preserve all your answers as part of the audit trail.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="outlineDark" onClick={onBack}>
          Review my answers
        </Button>
      </div>
    </div>
  );
}
