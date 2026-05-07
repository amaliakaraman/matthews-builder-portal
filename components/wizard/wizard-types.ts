import type { ClassifyAnswers } from "@/lib/classification/classify";

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export interface WizardState {
  draftId: string | null;
  answers: Partial<ClassifyAnswers>;
  productOwnerDeptId: string | null;
  audienceType: string | null;
  metadata: {
    name: string;
    description: string;
    problemStatement: string;
    expectedUsers: string;
    intendedStartDate: string;
    scopingDocsUrl: string;
  };
  acknowledged: boolean;
}

export const EMPTY_STATE: WizardState = {
  draftId: null,
  answers: {},
  productOwnerDeptId: null,
  audienceType: null,
  metadata: {
    name: "",
    description: "",
    problemStatement: "",
    expectedUsers: "",
    intendedStartDate: "",
    scopingDocsUrl: "",
  },
  acknowledged: false,
};

export interface WizardQuestion {
  key: keyof ClassifyAnswers;
  group: "audience" | "data" | "process";
  prompt: string;
  helper?: string;
}

/**
 * Wizard questions — verbatim from PRD §4.1.2 step 1.
 */
export const WIZARD_QUESTIONS: WizardQuestion[] = [
  // Audience
  {
    key: "personal_only",
    group: "audience",
    prompt:
      "Is this for your own use only — not intended for teammates or department deployment?",
  },
  {
    key: "department_use",
    group: "audience",
    prompt: "Will this be used by people in your department?",
  },
  {
    key: "cross_department",
    group: "audience",
    prompt:
      "Will the value this creates serve people outside your department?",
  },
  // Data
  {
    key: "read_only",
    group: "data",
    prompt: "Does your use case only require reading data from the platform?",
  },
  {
    key: "store_new_data",
    group: "data",
    prompt: "Does your use case require storing new data?",
    helper:
      "If yes, the system will provision an app-owned database for your project on approval.",
  },
  {
    key: "edit_artemis",
    group: "data",
    prompt:
      "Does your use case require editing or pushing back to existing Artemis data fields?",
    helper:
      "Write-back to Artemis forces Tier 3 / Contributor classification regardless of audience scope.",
  },
  {
    key: "new_schema",
    group: "data",
    prompt:
      "Does your use case require new schema added to the platform?",
    helper:
      "If yes, this is platform feature work — not a citizen build. We'll route you to the platform feature request path.",
  },
  // Process
  {
    key: "approved_tooling_ok",
    group: "process",
    prompt:
      "Are you prepared to use approved Matthews tools, accounts, and brand standards?",
  },
  {
    key: "mvp_test_ok",
    group: "process",
    prompt:
      "Are you prepared to ship an MVP to a test audience before broad rollout?",
  },
  {
    key: "eng_timeline_ok",
    group: "process",
    prompt: "Are you prepared to work within platform engineering's timeline?",
  },
];
