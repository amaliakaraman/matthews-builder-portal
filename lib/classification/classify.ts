/**
 * Pure classification function — Citizen Builder Portal PRD §6.2.
 *
 * Determines the App Classification tier (Personal / Consumer / Contributor)
 * or surfaces an "edge case" route (PLATFORM_FEATURE_WORK / UNCLEAR_ROUTE_TO_PX)
 * based on the wizard answers.
 *
 * Implemented as a pure function with the rule order from the PRD preserved
 * EXACTLY — first match wins. The wizard calls this on every answer change
 * so edge cases interrupt the flow at the moment they're triggered, per
 * PRD §7.3 wizard UX.
 */

export type ClassifyAnswers = {
  // Audience
  personal_only: boolean | null;
  department_use: boolean | null;
  cross_department: boolean | null;
  // Data
  read_only: boolean | null;
  store_new_data: boolean | null;
  edit_artemis: boolean | null;
  new_schema: boolean | null;
  // Process
  approved_tooling_ok: boolean | null;
  mvp_test_ok: boolean | null;
  eng_timeline_ok: boolean | null;
};

export type Tier = "personal" | "consumer" | "contributor";

export type EdgeCase = "PLATFORM_FEATURE_WORK" | "UNCLEAR_ROUTE_TO_PX";

export type ClassifyResult = {
  tier: Tier | null;
  edge_case: EdgeCase | null;
  /** True when every required answer is provided. Used by the wizard to
   *  decide whether the result is final or still partial. */
  complete: boolean;
  /** A short, human-readable explanation of WHY this tier was selected.
   *  Surface this on the wizard summary screen (PRD §4.1.2 step 5). */
  rationale: string;
};

const REQUIRED_KEYS: Array<keyof ClassifyAnswers> = [
  "personal_only",
  "department_use",
  "cross_department",
  "read_only",
  "store_new_data",
  "edit_artemis",
  "new_schema",
  "approved_tooling_ok",
  "mvp_test_ok",
  "eng_timeline_ok",
];

export function isComplete(answers: Partial<ClassifyAnswers>): boolean {
  return REQUIRED_KEYS.every((k) => typeof answers[k] === "boolean");
}

export function classify(
  answers: Partial<ClassifyAnswers>
): ClassifyResult {
  const a: ClassifyAnswers = {
    personal_only: answers.personal_only ?? null,
    department_use: answers.department_use ?? null,
    cross_department: answers.cross_department ?? null,
    read_only: answers.read_only ?? null,
    store_new_data: answers.store_new_data ?? null,
    edit_artemis: answers.edit_artemis ?? null,
    new_schema: answers.new_schema ?? null,
    approved_tooling_ok: answers.approved_tooling_ok ?? null,
    mvp_test_ok: answers.mvp_test_ok ?? null,
    eng_timeline_ok: answers.eng_timeline_ok ?? null,
  };

  // Rule 1 — new schema required → not a citizen build at all.
  // PRD §2.2: "this is platform feature work that must be scoped and shipped
  // by the platform team before any dependent Consumer app can be built."
  if (a.new_schema === true) {
    return {
      tier: null,
      edge_case: "PLATFORM_FEATURE_WORK",
      complete: true,
      rationale:
        "Adding new schema to Artemis is platform feature work, not a citizen build. Submit a platform feature request first.",
    };
  }

  // Rule 2 — Artemis write-back → always Contributor (regardless of audience).
  if (a.edit_artemis === true) {
    return {
      tier: "contributor",
      edge_case: null,
      complete: isComplete(a),
      rationale:
        "Writes back to Artemis fields. Per PRD §2.2, write-back forces Contributor classification regardless of audience scope.",
    };
  }

  // Rule 3 — explicit cross-department + edit_artemis is intentionally a
  // no-op here: Rule 2 already returns "contributor" for any edit_artemis === true.
  // The PRD lists it separately for clarity; we preserve it as documentation.

  // Rule 4 — Personal Project.
  if (
    a.personal_only === true &&
    a.department_use === false &&
    a.cross_department === false
  ) {
    return {
      tier: "personal",
      edge_case: null,
      complete: isComplete(a),
      rationale:
        "Personal use only — no team or cross-department audience. Tier 1 / Personal Project. Skip PX review.",
    };
  }

  // Rule 5 — Platform Consumer.
  if (
    a.department_use === true &&
    a.cross_department === false &&
    a.edit_artemis === false
  ) {
    return {
      tier: "consumer",
      edge_case: null,
      complete: isComplete(a),
      rationale:
        "Department-scoped, reads from the platform, no Artemis write-back. Tier 2 / Platform Consumer.",
    };
  }

  // ELSE — unclear: route to PX.
  // Only declare it "complete" once all answers are present; before then this
  // is just a transient state while the user is still answering.
  if (isComplete(a)) {
    return {
      tier: null,
      edge_case: "UNCLEAR_ROUTE_TO_PX",
      complete: true,
      rationale:
        "Your answers don't cleanly match a tier. PX will help classify this manually.",
    };
  }

  return {
    tier: null,
    edge_case: null,
    complete: false,
    rationale: "Keep answering to see your classification.",
  };
}
