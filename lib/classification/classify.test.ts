import { describe, expect, it } from "vitest";
import { classify, isComplete, type ClassifyAnswers } from "./classify";

const fullPersonal: ClassifyAnswers = {
  personal_only: true,
  department_use: false,
  cross_department: false,
  read_only: true,
  store_new_data: false,
  edit_artemis: false,
  new_schema: false,
  approved_tooling_ok: true,
  mvp_test_ok: true,
  eng_timeline_ok: true,
};

const fullConsumer: ClassifyAnswers = {
  personal_only: false,
  department_use: true,
  cross_department: false,
  read_only: false,
  store_new_data: true,
  edit_artemis: false,
  new_schema: false,
  approved_tooling_ok: true,
  mvp_test_ok: true,
  eng_timeline_ok: true,
};

const fullContributor: ClassifyAnswers = {
  personal_only: false,
  department_use: true,
  cross_department: true,
  read_only: false,
  store_new_data: true,
  edit_artemis: true,
  new_schema: false,
  approved_tooling_ok: true,
  mvp_test_ok: true,
  eng_timeline_ok: true,
};

describe("classify()", () => {
  it("returns Personal for fully-personal scope (PRD §6.2 rule 4)", () => {
    const result = classify(fullPersonal);
    expect(result.tier).toBe("personal");
    expect(result.edge_case).toBeNull();
    expect(result.complete).toBe(true);
  });

  it("returns Consumer for department-scoped no-write-back (PRD §6.2 rule 5)", () => {
    const result = classify(fullConsumer);
    expect(result.tier).toBe("consumer");
    expect(result.edge_case).toBeNull();
  });

  it("returns Contributor for cross-dept with Artemis write-back (PRD §6.2 rule 2/3)", () => {
    const result = classify(fullContributor);
    expect(result.tier).toBe("contributor");
    expect(result.edge_case).toBeNull();
  });

  it("forces Contributor on edit_artemis even at department-only scope (PRD §2.2 edge case)", () => {
    const result = classify({
      ...fullConsumer,
      edit_artemis: true,
    });
    expect(result.tier).toBe("contributor");
  });

  it("surfaces PLATFORM_FEATURE_WORK when new_schema is true (PRD §6.2 rule 1)", () => {
    const result = classify({
      ...fullConsumer,
      new_schema: true,
    });
    expect(result.tier).toBeNull();
    expect(result.edge_case).toBe("PLATFORM_FEATURE_WORK");
    expect(result.complete).toBe(true);
  });

  it("PLATFORM_FEATURE_WORK takes precedence over Artemis write-back", () => {
    const result = classify({
      ...fullContributor,
      new_schema: true,
    });
    expect(result.edge_case).toBe("PLATFORM_FEATURE_WORK");
    expect(result.tier).toBeNull();
  });

  it("returns UNCLEAR_ROUTE_TO_PX when answers don't cleanly match a tier", () => {
    const result = classify({
      personal_only: false,
      department_use: false,
      cross_department: true,
      read_only: false,
      store_new_data: true,
      edit_artemis: false,
      new_schema: false,
      approved_tooling_ok: true,
      mvp_test_ok: true,
      eng_timeline_ok: true,
    });
    expect(result.tier).toBeNull();
    expect(result.edge_case).toBe("UNCLEAR_ROUTE_TO_PX");
  });

  it("returns incomplete (no edge case) while answers are missing", () => {
    const result = classify({
      personal_only: true,
    });
    expect(result.complete).toBe(false);
    expect(result.tier).toBeNull();
    expect(result.edge_case).toBeNull();
  });

  it("isComplete() requires every key to be a boolean", () => {
    expect(isComplete({})).toBe(false);
    expect(isComplete(fullPersonal)).toBe(true);
    expect(
      isComplete({
        ...fullPersonal,
        eng_timeline_ok: undefined,
      } as Partial<ClassifyAnswers>)
    ).toBe(false);
  });

  it("explanation copy is non-empty for every result", () => {
    expect(classify(fullPersonal).rationale.length).toBeGreaterThan(10);
    expect(classify(fullConsumer).rationale.length).toBeGreaterThan(10);
    expect(classify(fullContributor).rationale.length).toBeGreaterThan(10);
    expect(
      classify({ ...fullConsumer, new_schema: true }).rationale.length
    ).toBeGreaterThan(10);
  });
});
